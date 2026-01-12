import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { sendOrderConfirmationEmail, sendBrandOrderNotificationEmail } from '@/lib/resend';

interface RpcPaymentResult {
    success: boolean;
    message?: string;
    error?: string;
}
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
                // 3. Process Payment via RPC (Atomic Transaction)
                // @ts-ignore - RPC types not generated
                const { data: rpcResult, error: rpcError } = await supabase.rpc('process_order_payment', {
                    p_order_id: null, // We need to find ID first? No, we have tx_ref = order_number
                    // Actually, the RPC takes order_id. We only have order_number (tx_ref).
                    // We should modify the RPC to take order_number OR look it up here.
                    // Let's look it up quickly first, or better, modify RPC to accept order_number.
                    // But for now, let's look up just the ID to be safe.
                })

                // Wait, optimizing: The RPC logic I wrote takes p_order_id.
                // I should fetch the ID first.

                // 3. Find Order ID by Number
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

                // Double check amount
                if (Math.abs(order.total - paidAmount) > 0.01) {
                    console.warn(`Amount mismatch: DB ${order.total} vs FLW ${paidAmount}`);
                }

                // 4. Execute Atomic Update
                // @ts-ignore
                const { data: result, error: rpcError } = await supabase.rpc('process_order_payment', {
                    p_order_id: order.id,
                    p_tx_ref: flutterwaveId,
                    p_gateway_res: body
                });

                if (rpcError || (result && !(result as RpcPaymentResult).success)) {
                    console.error('RPC Payment Processing Failed:', rpcError || result);
                    // If "Order already paid", we treat as success to FLW
                    if ((result as unknown as RpcPaymentResult)?.message === 'Order already paid') {
                        return NextResponse.json({ received: true });
                    }
                    return NextResponse.json({ error: 'Processing failed' }, { status: 500 });
                }

                // 5. Send Emails (Still strictly "after" the transaction, which is fine)

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

        return NextResponse.json({ received: true });
    } catch (err: any) {
        console.error('Webhook error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
