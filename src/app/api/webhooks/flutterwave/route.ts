import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendBrandOrderNotificationEmail } from '@/lib/resend';
import { formatPrice } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
    try {
        const signature = req.headers.get('verif-hash');
        const secretHash = process.env.FLW_SECRET_HASH;

        // 1. Basic Security Check
        if (secretHash && signature !== secretHash) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        console.log('Flutterwave Webhook received:', body);

        // 2. Validate Event
        if (body.event === 'charge.completed' || body['event.type'] === 'CARD_TRANSACTION') {
            const txData = body.data || body; // Structure varies slightly

            if (txData.status === 'successful') {
                const orderNumber = txData.tx_ref;
                const flutterwaveId = txData.id.toString();
                const paidAmount = txData.amount;

                const supabase = await createAdminClient();

                // 3. Find and verify order
                const { data: order, error: orderError } = await (supabase
                    .from('orders') as any)
                    .select(`
                        *, 
                        user:users!user_id(email, full_name),
                        store:stores!store_id(
                            name,
                            owner:users!owner_id(email)
                        )
                    `)
                    .eq('order_number', orderNumber)
                    .single();

                if (orderError || !order) {
                    console.error('Order not found for webhook:', orderNumber);
                    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
                }

                // Double check amount (avoid security issues)
                if (Math.abs(order.total - paidAmount) > 0.01) {
                    console.warn(`Amount mismatch for order ${orderNumber}: DB ${order.total} vs FLW ${paidAmount}`);
                }

                // 4. Update Order Status
                if (order.status === 'pending') {
                    const { error: updateError } = await (supabase
                        .from('orders') as any)
                        .update({
                            status: 'paid',
                            flutterwave_tx_ref: flutterwaveId,
                            updated_at: new Date().toISOString()
                        })
                        .eq('id', order.id);

                    if (updateError) {
                        console.error('Failed to update order status via webhook:', updateError);
                        return NextResponse.json({ error: 'Update failed' }, { status: 500 });
                    }

                    // 5. Update Transaction status if exists
                    await (supabase
                        .from('transactions') as any)
                        .update({ status: 'success', flutterwave_tx_id: flutterwaveId })
                        .eq('order_id', order.id);

                    // 6. Send Email Notifications
                    // To Customer
                    await sendOrderConfirmationEmail({
                        email: order.user.email,
                        customerName: order.user.full_name || order.user.email.split('@')[0],
                        orderNumber: order.order_number,
                        total: formatPrice(order.total)
                    });

                    // To Brand
                    if (order.store?.owner?.email) {
                        await sendBrandOrderNotificationEmail({
                            email: order.store.owner.email,
                            orderNumber: order.order_number,
                            total: formatPrice(order.total),
                            storeName: order.store.name
                        });
                    }

                    console.log(`Order ${orderNumber} successfully processed via webhook`);
                }
            }
        }

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('Webhook error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
