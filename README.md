# MyJara E-Marketplace Architecture & Design Plan

A comprehensive architecture for a multi-tenant "store-of-stores" e-marketplace where brands operate independent storefronts within a unified platform.

---

## Executive Summary

MyJara is a **product-centric marketplace** where:
- Each brand has an independent, isolated store
- Products are discovered across all stores via unified search
- Jara (bonus products) is the core value proposition—not discounts
- Payments flow through Flutterwave with per-store configurations

---

## 1. System Architecture

### High-Level Architecture Diagram

```mermaid
graph TB
    subgraph "Client Layer"
        WEB[Next.js App<br/>Vercel]
        MOBILE[Future Mobile Apps]
    end

    subgraph "Domain Management"
        VERCEL_DNS[Vercel Domains]
        WILDCARD[*.myjara.com]
        CUSTOM[Custom Domains]
    end

    subgraph "Supabase Platform"
        AUTH[Supabase Auth<br/>Users, Brands, Admins]
        DB[(PostgreSQL<br/>All Data)]
        RLS[Row Level Security<br/>Multi-tenant Isolation]
        REALTIME[Supabase Realtime<br/>Chat & Updates]
        STORAGE[Supabase Storage<br/>Product Images]
        EDGE[Edge Functions<br/>Webhooks]
    end

    subgraph "External Services"
        FW[Flutterwave<br/>Payments]
        RESEND[Resend<br/>Emails]
    end

    WEB --> VERCEL_DNS
    MOBILE --> VERCEL_DNS
    VERCEL_DNS --> WILDCARD
    VERCEL_DNS --> CUSTOM
    
    WEB --> AUTH
    WEB --> DB
    WEB --> REALTIME
    WEB --> STORAGE
    
    DB --> RLS
    EDGE --> FW
    EDGE --> RESEND
```

### Why This Stack is Maintainable

| Benefit | How |
|---------|-----|
| **Single Codebase** | One Next.js app handles everything—no microservices |
| **Built-in Auth** | Supabase Auth with RLS = no custom auth code |
| **Type Safety** | Supabase generates TypeScript types from DB |
| **Real-time Free** | Supabase Realtime for chat—no Redis needed |
| **Serverless** | Vercel + Supabase = zero server management |
| **Easy Onboarding** | New devs learn one framework, one platform |

### Multi-Tenant Strategy

| Aspect | Approach |
|--------|----------|
| **Database** | Single Supabase project, tenant isolation via `store_id` |
| **Security** | Supabase Row Level Security (RLS) policies |
| **Domain Routing** | Vercel wildcard domains + middleware |
| **Configuration** | Per-store settings in `stores` table |

---

## 2. Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o{ ORDERS : places
    USERS ||--o{ CHAT_MESSAGES : sends
    USERS {
        uuid id PK
        string email UK
        string phone UK
        string password_hash
        string full_name
        enum role "customer|brand_admin|platform_admin"
        jsonb addresses
        timestamp created_at
    }

    STORES ||--o{ PRODUCTS : contains
    STORES ||--o{ ORDERS : receives
    STORES ||--o{ STORE_LOGISTICS : defines
    STORES ||--o{ STORE_DOMAINS : has
    STORES {
        uuid id PK
        uuid owner_id FK
        string name UK
        string slug UK
        string logo_url
        string description
        jsonb flutterwave_config
        jsonb settings
        enum status "pending|active|suspended"
        timestamp created_at
    }

    STORE_DOMAINS {
        uuid id PK
        uuid store_id FK
        string domain UK
        enum type "subdomain|custom"
        boolean is_verified
        timestamp created_at
    }

    PRODUCTS ||--o{ PRODUCT_IMAGES : has
    PRODUCTS ||--o{ ORDER_ITEMS : appears_in
    PRODUCTS {
        uuid id PK
        uuid store_id FK
        uuid category_id FK
        string name
        text description
        decimal price
        int jara_buy_quantity
        int jara_get_quantity
        int stock_quantity
        jsonb attributes
        enum status "draft|active|archived"
        timestamp created_at
    }

    PRODUCT_IMAGES {
        uuid id PK
        uuid product_id FK
        string url
        int sort_order
        boolean is_primary
    }

    CATEGORIES {
        uuid id PK
        uuid parent_id FK
        string name
        string slug UK
        int sort_order
    }

    STORE_LOGISTICS {
        uuid id PK
        uuid store_id FK
        enum type "pickup|delivery"
        string location_name
        string city
        decimal delivery_fee
        string delivery_timeline
        jsonb coverage_zones
        boolean is_active
    }

    ORDERS ||--|{ ORDER_ITEMS : contains
    ORDERS {
        uuid id PK
        uuid user_id FK
        uuid store_id FK
        string order_number UK
        decimal subtotal
        decimal logistics_fee
        decimal total
        enum status "pending|paid|processing|shipped|delivered|cancelled"
        uuid logistics_option_id FK
        jsonb delivery_address
        string flutterwave_tx_ref
        timestamp created_at
    }

    ORDER_ITEMS {
        uuid id PK
        uuid order_id FK
        uuid product_id FK
        int quantity
        int jara_quantity
        decimal unit_price
        decimal total_price
    }

    CHAT_CONVERSATIONS ||--o{ CHAT_MESSAGES : contains
    CHAT_CONVERSATIONS {
        uuid id PK
        uuid user_id FK
        uuid store_id FK
        uuid last_message_id FK
        timestamp created_at
    }

    CHAT_MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text message
        enum sender_type "customer|brand"
        boolean is_read
        timestamp created_at
    }

    TRANSACTIONS {
        uuid id PK
        uuid order_id FK
        uuid store_id FK
        string flutterwave_tx_id UK
        decimal amount
        enum status "pending|success|failed"
        jsonb gateway_response
        timestamp created_at
    }
```

### Key Tables Summary

| Table | Purpose |
|-------|---------|
| `users` | All users (customers, brand admins, platform admins) |
| `stores` | Brand storefronts with Flutterwave configs |
| `store_domains` | Subdomain and custom domain mappings |
| `products` | Product catalog with Jara offers |
| `store_logistics` | Pickup points and delivery zones per store |
| `orders` | Order records linking user, store, and logistics |
| `transactions` | Flutterwave payment tracking |
| `chat_*` | Brand-to-customer communication |

---

## 3. API Design

### API Structure Overview

```
/api/v1/
├── auth/
│   ├── POST   /register           # Customer registration
│   ├── POST   /login              # Login (all user types)
│   ├── POST   /logout             # Logout
│   └── POST   /refresh            # Token refresh
│
├── search/
│   └── GET    /products           # Global product search
│
├── products/
│   ├── GET    /:id                # Product detail
│   └── GET    /:id/logistics      # Product logistics options
│
├── orders/
│   ├── POST   /                   # Create order
│   ├── GET    /:id                # Order detail
│   └── GET    /my                 # User's orders
│
├── payments/
│   ├── POST   /initialize         # Get Flutterwave payment link
│   └── POST   /webhook            # Flutterwave callback
│
├── chat/
│   ├── GET    /conversations      # User's conversations
│   ├── GET    /conversations/:id  # Conversation messages
│   └── POST   /conversations/:id  # Send message
│
├── stores/
│   └── GET    /:slug              # Store public info (for subdomain)
│
├── brand/                         # Brand Dashboard APIs
│   ├── GET    /dashboard          # Dashboard stats
│   ├── CRUD   /products           # Manage products
│   ├── CRUD   /logistics          # Manage logistics
│   ├── GET    /orders             # Store orders
│   ├── GET    /chat               # Customer chats
│   ├── GET    /support            # Support admin view
│   └── GET    /operations         # Operations admin view
│
└── admin/                         # Platform Admin APIs
    ├── CRUD   /stores             # Manage stores
    ├── CRUD   /categories         # Manage categories
    ├── GET    /transactions       # All transactions
    └── GET    /analytics          # Platform analytics
```

---

## 4. UI Layouts

### 4.1 Homepage / Discover
- **Hero**: Unified search for products across all brands.
- **Filters**: City, Price, and specifically "Min Jara" (bonus gift) filters.
- **Featured**: Highlighting the best Jara offers in Nigeria.

### 4.2 Checkout Flow
- **Quantity Selector**: Dynamically calculates the free "Jara" items.
- **Logistics**: Brands define their own pickup points and delivery zones.
- **Payment**: Seamless Flutterwave integration.

### 4.3 Brand Operations
- **Logistics Center**: Manage multiple pickup locations and delivery fees.
- **Order Fulfillment**: Detailed tracking from payment to delivery.
- **Customer Support**: Real-time chat with search context.

---

## 5. Technical Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16 (App Router) |
| **Styling** | Tailwind CSS + shadcn/ui |
| **Database** | Supabase (PostgreSQL) |
| **Auth** | Supabase Auth (RLS Isolation) |
| **Real-time** | Supabase Realtime (Chat) |
| **Payments** | Flutterwave |
| **Email** | Resend |

---

## 6. Implementation Phases

### Phase 1: Foundation ✅
- Next.js + Supabase project setup
- Multi-tenant database schema & RLS policies
- Core UI component library

### Phase 2: Core Marketplace ✅
- Product management & Jara configuration
- Global search engine
- Brand registration & dashboard foundation

### Phase 3: Transactions ✅
- Checkout flow & logistics selection
- Flutterwave payment integration
- Order management backend

### Phase 4: Communication & Operations ✅
- Real-time chat system
- Store customization (Theme/Layout)
- Automated email notifications (Resend)
- Backend Payment Webhooks

---

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables in `.env.local`
4. Run development server: `npm run dev`
