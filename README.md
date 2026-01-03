# MyJara.ng

MyJara is Nigeria's most rewarding e-marketplace, where every purchase comes with a little extra. The platform connects brands directly with customers, leveraging the concept of "Jara" (bonus items or discounts) to boost sales and provide exceptional value to shoppers.

## 🚀 Key Features

- **Store Customization**: Brands can customize their storefront with dynamic themes and layouts.
- **Jara Engine**: Easy-to-configure "Buy X Get Y" offers.
- **Modern Search**: Responsive, full-text search with city and category filtering.
- **Secure Payments**: Integration with Flutterwave for safe transactions.
- **Admin Dashboards**: Dedicated interfaces for Brands (Operations, Logistics, Orders) and Platform Admins.
- **Real-time Support**: In-app chat between customers and brands.
- **Automated Notifications**: Email alerts via Resend for order confirmations and status updates.

## 🛠️ Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Lucide Icons.
- **Backend/DB**: Supabase (Auth, PostgreSQL, Realtime, RPC).
- **Payments**: Flutterwave.
- **Email**: Resend.
- **Deployment**: Vercel & Supabase.

## 📋 Implementation Plan: Webhooks & Notifications

This section outlines the technical implementation of the transactional and communication layer.

### 1. Infrastructure
- Resend integration for robust email delivery.
- Secure environment management for secret hashes and API keys.

### 2. Payment Verification (Webhooks)
- **Signature Verification**: Verifying `verif-hash` to ensure requests originate from Flutterwave.
- **Event Handling**: Processing `charge.completed` events to verify transaction amounts and cross-reference order numbers.
- **State Management**: Automatic order status updates to `paid` upon successful verification.

### 3. Email Automation
- **Order Confirmation**: Instant receipt sent to customers.
- **Brand Alerts**: New order notifications for store owners to begin fulfillment.
- **Fulfillment Tracking**: Automated updates when items are "Shipped" or "Delivered".

### 4. Admin Operations
- Enhanced brand dashboard with logistics mapping and granular order fulfillment views.

---

## Getting Started

### Prerequisites
- Node.js 18+
- Supabase Account
- Flutterwave API Keys
- Resend API Key

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/myjara-ng/myjara.ng.git
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (`.env.local`):
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_FLW_PUBLIC_KEY=your_flw_key
   FLW_SECRET_HASH=your_webhook_hash
   RESEND_API_KEY=your_resend_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
