import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder');

export { resend };

export async function sendOrderConfirmationEmail({
    email,
    orderNumber,
    total,
    customerName
}: {
    email: string;
    orderNumber: string;
    total: string;
    customerName: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyJara <orders@myjara.ng>',
            to: [email],
            subject: `Order Confirmed: ${orderNumber}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; rounded: 8px;">
                    <h1 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 24px;">Order Confirmed!</h1>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Hi ${customerName},</p>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Thank you for your order. We've received your payment and the brand is now getting your items ready.</p>
                    
                    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Order Number</p>
                        <p style="margin: 4px 0 12px 0; font-weight: bold; font-family: monospace;">${orderNumber}</p>
                        
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Total Paid</p>
                        <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 18px; color: #059669;">${total}</p>
                    </div>

                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5; margin-bottom: 32px;">You can track your order status in your MyJara dashboard.</p>
                    
                    <a href="https://myjara.ng/orders" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View My Order</a>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p>© 2026 MyJara. All rights reserved.</p>
                    </div>
                </div>
            `
        });

        if (error) {
            console.error('Resend error:', error);
            return { error };
        }

        return { data };
    } catch (error) {
        console.error('Email caught error:', error);
        return { error };
    }
}

export async function sendBrandOrderNotificationEmail({
    email,
    orderNumber,
    total,
    storeName
}: {
    email: string;
    orderNumber: string;
    total: string;
    storeName: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyJara <orders@myjara.ng>',
            to: [email],
            subject: `New Order Received: ${orderNumber}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h1 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 24px;">New Order for ${storeName}</h1>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">You have received a new paid order!</p>
                    
                    <div style="background-color: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Order Number</p>
                        <p style="margin: 4px 0 12px 0; font-weight: bold; font-family: monospace;">${orderNumber}</p>
                        
                        <p style="margin: 0; font-size: 14px; text-transform: uppercase; color: #9ca3af; letter-spacing: 0.05em;">Amount Paid</p>
                        <p style="margin: 4px 0 0 0; font-weight: bold; font-size: 18px; color: #059669;">${total}</p>
                    </div>

                    <a href="https://myjara.ng/dashboard/orders" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">View in Dashboard</a>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p>© 2026 MyJara. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return { data, error };
    } catch (error) {
        console.error('Brand email error:', error);
        return { error };
    }
}

export async function sendAccountApprovedEmail({
    email,
    fullName
}: {
    email: string;
    fullName: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyJara <welcome@myjara.ng>',
            to: [email],
            subject: 'Account Approved! Welcome to MyJara',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h1 style="color: #059669; font-size: 24px; font-weight: bold; margin-bottom: 24px;">You're In! 🎉</h1>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Hi ${fullName},</p>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Great news! Your wholesaler account has been verified and approved.</p>
                    <p style="font-size: 16px; color: #4b5563; line-height: 1.5;">Your store is now <strong>Active</strong> on the MyJara marketplace. You can now access all features of your dashboard, add products, and start selling.</p>
                    
                    <div style="margin: 32px 0;">
                        <a href="https://myjara.ng/dashboard" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Go to Dashboard</a>
                    </div>
                    
                    <p style="font-size: 14px; color: #6b7280; line-height: 1.5;">If you have any questions, reply to this email.</p>
                    
                    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p>© 2026 MyJara. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return { data, error };
    } catch (error) {
        console.error('Approval email error:', error);
        return { error };
    }
}

export async function sendPolicyAcceptedEmail({
    email,
    fullName,
    date
}: {
    email: string;
    fullName: string;
    date: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyJara <legal@myjara.ng>',
            to: [email],
            subject: 'Operations Policy Acceptance Confirmation',
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #1f2937; font-size: 20px; font-weight: bold; margin-bottom: 20px;">Policy Acceptance Confirmation</h2>
                    <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">Hi ${fullName},</p>
                    <p style="font-size: 15px; color: #4b5563; line-height: 1.5;">This email confirms that you have accepted the MyJara Operations Policy.</p>
                    
                    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0;">
                        <p style="margin: 0 0 8px 0; font-weight: bold; color: #374151;">Details:</p>
                        <p style="margin: 0; font-size: 14px; color: #4b5563;">Date Accepted: ${date}</p>
                        <p style="margin: 4px 0 0 0; font-size: 14px; color: #4b5563;">Status: <span style="color: #059669; font-weight: bold;">Confirmed</span></p>
                    </div>

                    <p style="font-size: 14px; color: #6b7280;">A copy of this confirmation has been logged in our system.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p>© 2026 MyJara. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return { data, error };
    } catch (error) {
        console.error('Policy email error:', error);
        return { error };
    }
}

export async function sendUnreadMessageEmail({
    email,
    recipientName,
    senderName,
    messagePreview,
    actionLink
}: {
    email: string;
    recipientName: string;
    senderName: string;
    messagePreview: string;
    actionLink: string;
}) {
    try {
        const { data, error } = await resend.emails.send({
            from: 'MyJara <notifications@myjara.ng>',
            to: [email],
            subject: `New message from ${senderName}`,
            html: `
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                    <h2 style="color: #1f2937; margin-bottom: 20px;">New Message</h2>
                    <p style="font-size: 16px; color: #4b5563;">Hi ${recipientName},</p>
                    <p style="font-size: 16px; color: #4b5563;">You have a new message from <strong>${senderName}</strong>:</p>
                    
                    <div style="background-color: #f3f4f6; padding: 16px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #059669;">
                        <p style="margin: 0; font-style: italic; color: #374151;">"${messagePreview}"</p>
                    </div>

                    <a href="${actionLink}" style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reply Now</a>
                    
                    <div style="margin-top: 30px; font-size: 12px; color: #9ca3af; text-align: center;">
                        <p>© 2026 MyJara. All rights reserved.</p>
                    </div>
                </div>
            `
        });
        return { data, error };
    } catch (error) {
        console.error('Notification email error:', error);
        return { error };
    }
}
