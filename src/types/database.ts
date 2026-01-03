export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export type UserRole = 'customer' | 'brand_admin' | 'platform_admin'
export type StoreStatus = 'pending' | 'active' | 'suspended'
export type ProductStatus = 'draft' | 'active' | 'archived'
export type LogisticsType = 'pickup' | 'delivery'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type TransactionStatus = 'pending' | 'success' | 'failed'
export type MessageSenderType = 'customer' | 'brand'

export interface Database {
    public: {
        Tables: {
            users: {
                Row: {
                    id: string
                    email: string
                    phone: string | null
                    full_name: string
                    role: UserRole
                    avatar_url: string | null
                    addresses: Json | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id: string
                    email: string
                    phone?: string | null
                    full_name: string
                    role?: UserRole
                    avatar_url?: string | null
                    addresses?: Json | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    email?: string
                    phone?: string | null
                    full_name?: string
                    role?: UserRole
                    avatar_url?: string | null
                    addresses?: Json | null
                    created_at?: string
                    updated_at?: string
                }
            }
            stores: {
                Row: {
                    id: string
                    owner_id: string
                    name: string
                    slug: string
                    logo_url: string | null
                    banner_url: string | null
                    description: string | null
                    flutterwave_subaccount_id: string | null
                    settings: Json | null
                    status: StoreStatus
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    owner_id: string
                    name: string
                    slug: string
                    logo_url?: string | null
                    banner_url?: string | null
                    description?: string | null
                    flutterwave_subaccount_id?: string | null
                    settings?: Json | null
                    status?: StoreStatus
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    owner_id?: string
                    name?: string
                    slug?: string
                    logo_url?: string | null
                    banner_url?: string | null
                    description?: string | null
                    flutterwave_subaccount_id?: string | null
                    settings?: Json | null
                    status?: StoreStatus
                    created_at?: string
                    updated_at?: string
                }
            }
            store_domains: {
                Row: {
                    id: string
                    store_id: string
                    domain: string
                    type: 'subdomain' | 'custom'
                    is_verified: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    domain: string
                    type?: 'subdomain' | 'custom'
                    is_verified?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    domain?: string
                    type?: 'subdomain' | 'custom'
                    is_verified?: boolean
                    created_at?: string
                }
            }
            categories: {
                Row: {
                    id: string
                    parent_id: string | null
                    name: string
                    slug: string
                    icon: string | null
                    sort_order: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    parent_id?: string | null
                    name: string
                    slug: string
                    icon?: string | null
                    sort_order?: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    parent_id?: string | null
                    name?: string
                    slug?: string
                    icon?: string | null
                    sort_order?: number
                    created_at?: string
                }
            }
            products: {
                Row: {
                    id: string
                    store_id: string
                    category_id: string | null
                    name: string
                    description: string | null
                    price: number
                    jara_buy_quantity: number
                    jara_get_quantity: number
                    stock_quantity: number
                    attributes: Json | null
                    status: ProductStatus
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    category_id?: string | null
                    name: string
                    description?: string | null
                    price: number
                    jara_buy_quantity?: number
                    jara_get_quantity?: number
                    stock_quantity?: number
                    attributes?: Json | null
                    status?: ProductStatus
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    category_id?: string | null
                    name?: string
                    description?: string | null
                    price?: number
                    jara_buy_quantity?: number
                    jara_get_quantity?: number
                    stock_quantity?: number
                    attributes?: Json | null
                    status?: ProductStatus
                    created_at?: string
                    updated_at?: string
                }
            }
            product_images: {
                Row: {
                    id: string
                    product_id: string
                    url: string
                    sort_order: number
                    is_primary: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    product_id: string
                    url: string
                    sort_order?: number
                    is_primary?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    product_id?: string
                    url?: string
                    sort_order?: number
                    is_primary?: boolean
                    created_at?: string
                }
            }
            store_logistics: {
                Row: {
                    id: string
                    store_id: string
                    type: LogisticsType
                    location_name: string
                    city: string
                    delivery_fee: number
                    delivery_timeline: string | null
                    coverage_zones: Json | null
                    is_active: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    store_id: string
                    type: LogisticsType
                    location_name: string
                    city: string
                    delivery_fee?: number
                    delivery_timeline?: string | null
                    coverage_zones?: Json | null
                    is_active?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    store_id?: string
                    type?: LogisticsType
                    location_name?: string
                    city?: string
                    delivery_fee?: number
                    delivery_timeline?: string | null
                    coverage_zones?: Json | null
                    is_active?: boolean
                    created_at?: string
                }
            }
            orders: {
                Row: {
                    id: string
                    user_id: string
                    store_id: string
                    order_number: string
                    subtotal: number
                    logistics_fee: number
                    total: number
                    status: OrderStatus
                    logistics_option_id: string | null
                    delivery_address: Json | null
                    flutterwave_tx_ref: string | null
                    created_at: string
                    updated_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    store_id: string
                    order_number: string
                    subtotal: number
                    logistics_fee?: number
                    total: number
                    status?: OrderStatus
                    logistics_option_id?: string | null
                    delivery_address?: Json | null
                    flutterwave_tx_ref?: string | null
                    created_at?: string
                    updated_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    store_id?: string
                    order_number?: string
                    subtotal?: number
                    logistics_fee?: number
                    total?: number
                    status?: OrderStatus
                    logistics_option_id?: string | null
                    delivery_address?: Json | null
                    flutterwave_tx_ref?: string | null
                    created_at?: string
                    updated_at?: string
                }
            }
            order_items: {
                Row: {
                    id: string
                    order_id: string
                    product_id: string
                    quantity: number
                    jara_quantity: number
                    unit_price: number
                    total_price: number
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    product_id: string
                    quantity: number
                    jara_quantity?: number
                    unit_price: number
                    total_price: number
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    product_id?: string
                    quantity?: number
                    jara_quantity?: number
                    unit_price?: number
                    total_price?: number
                    created_at?: string
                }
            }
            transactions: {
                Row: {
                    id: string
                    order_id: string
                    store_id: string
                    flutterwave_tx_id: string | null
                    amount: number
                    status: TransactionStatus
                    gateway_response: Json | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    order_id: string
                    store_id: string
                    flutterwave_tx_id?: string | null
                    amount: number
                    status?: TransactionStatus
                    gateway_response?: Json | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    order_id?: string
                    store_id?: string
                    flutterwave_tx_id?: string | null
                    amount?: number
                    status?: TransactionStatus
                    gateway_response?: Json | null
                    created_at?: string
                }
            }
            chat_conversations: {
                Row: {
                    id: string
                    user_id: string
                    store_id: string
                    product_id: string | null
                    last_message_at: string | null
                    created_at: string
                }
                Insert: {
                    id?: string
                    user_id: string
                    store_id: string
                    product_id?: string | null
                    last_message_at?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    store_id?: string
                    product_id?: string | null
                    last_message_at?: string | null
                    created_at?: string
                }
            }
            chat_messages: {
                Row: {
                    id: string
                    conversation_id: string
                    sender_id: string
                    message: string
                    sender_type: MessageSenderType
                    is_read: boolean
                    created_at: string
                }
                Insert: {
                    id?: string
                    conversation_id: string
                    sender_id: string
                    message: string
                    sender_type: MessageSenderType
                    is_read?: boolean
                    created_at?: string
                }
                Update: {
                    id?: string
                    conversation_id?: string
                    sender_id?: string
                    message?: string
                    sender_type?: MessageSenderType
                    is_read?: boolean
                    created_at?: string
                }
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            search_products: {
                Args: {
                    search_query?: string
                    filter_city?: string
                    filter_category_id?: string
                    filter_min_price?: number
                    filter_max_price?: number
                    filter_min_jara?: number
                    page_limit?: number
                    page_offset?: number
                }
                Returns: {
                    id: string
                    name: string
                    description: string
                    price: number
                    jara_buy_quantity: number
                    jara_get_quantity: number
                    store_id: string
                    store_name: string
                    store_slug: string
                    store_logo_url: string
                    category_id: string
                    category_name: string
                    primary_image_url: string
                    cities: string[]
                }[]
            }
        }
        Enums: {
            user_role: UserRole
            store_status: StoreStatus
            product_status: ProductStatus
            logistics_type: LogisticsType
            order_status: OrderStatus
            transaction_status: TransactionStatus
            message_sender_type: MessageSenderType
        }
    }
}

// Convenience types
export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type InsertTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type UpdateTables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']

export type User = Tables<'users'>
export type Store = Tables<'stores'>
export type Product = Tables<'products'>
export type ProductImage = Tables<'product_images'>
export type Category = Tables<'categories'>
export type StoreLogistics = Tables<'store_logistics'>
export type Order = Tables<'orders'>
export type OrderItem = Tables<'order_items'>
export type Transaction = Tables<'transactions'>
export type ChatConversation = Tables<'chat_conversations'>
export type ChatMessage = Tables<'chat_messages'>
