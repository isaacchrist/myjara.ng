-- Add phone_number to users table if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone_number') THEN 
        ALTER TABLE public.users ADD COLUMN phone_number TEXT; 
    END IF; 
END $$;

-- Create client_contacts table
CREATE TABLE IF NOT EXISTS public.client_contacts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    store_id UUID NOT NULL REFERENCES public.stores(id) ON DELETE CASCADE,
    client_identifier TEXT NOT NULL, -- Could be user_id or a unique has/phone if anonymous
    contact_type TEXT NOT NULL, -- 'phone_copy', 'whatsapp', 'call'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- RLS Policies
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;

-- Stores can insert contacts
CREATE POLICY "Stores can insert contacts" ON public.client_contacts
    FOR INSERT WITH CHECK (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid() OR admin_access_key = current_setting('request.headers')::json->>'x-admin-key'
        )
    );

-- Stores can view their own contacts
CREATE POLICY "Stores can view their own contacts" ON public.client_contacts
    FOR SELECT USING (
        store_id IN (
            SELECT id FROM public.stores WHERE owner_id = auth.uid() OR admin_access_key = current_setting('request.headers')::json->>'x-admin-key'
        )
    );
