'use server'

import { createAdminClient } from '@/lib/supabase/server';
import { resend } from '@/lib/resend';
import { formatPrice } from '@/lib/utils';

export async function updateOrderFulfillmentStatus(orderId: string, newStatus: string) {
    const supabase = await createAdminClient();

    // 1. Fetch order and user info
    const { data: order, error: fetchError } = await (supabase
        .from('orders') as any)
        .select('*, user:users(email, full_name), store:stores(name)')
        .eq('id', orderId)
        .single();

    if (fetchError || !order) {
        return { error: 'Order not found' };
    }

    // 2. Update status
    const { error: updateError } = await (supabase
        .from('orders') as any)
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', orderId);

    if (updateError) {
        return { error: 'Failed to update order status' };
    }

    // 3. Send Email if status is relevant
    if (newStatus === 'shipped' || newStatus === 'delivered') {
        const subject = newStatus === 'shipped' ? `Your order ${order.order_number} has been shipped!` : `Your order ${order.order_number} has been delivered!`;
        const title = newStatus === 'shipped' ? 'Order Shipped!' : 'Order Delivered!';
        const message = newStatus === 'shipped'
            ? `Good news! Your order from ${order.store.name} is on its way.`
            : `Your order from ${order.store.name} was marked as delivered. We hope you enjoy your purchase!`;

        await resend.emails.send({
            from: 'MyJara <orders@myjara.ng>',
            to: [order.user.email],
            subject: subject,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h1 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 24px;">${title}</h1>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Hi ${order.user.full_name || order.user.email.split('@')[0]},</p>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">${message}</p>
                    
                    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Order Number</p>
                        <p style="margin: 4px 0 0 0; font-weight: bold; font-family: monospace;">${order.order_number}</p>
                    </div>

                    <a href="https://myjara.ng/orders/${order.id}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View Order Details</a>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p>© 2026 MyJara. All rights reserved.</p>
                    </div>
                </div>
            `
        });
    }

    return { success: true };
}
