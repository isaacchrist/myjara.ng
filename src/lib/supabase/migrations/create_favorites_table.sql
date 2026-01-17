-- Create favorite_stores table for "Liked Vendors" feature

CREATE TABLE IF NOT EXISTS public.favorite_stores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    store_id UUID REFERENCES public.stores(id) NOT NULL,
    UNIQUE(user_id, store_id)
);

-- Add RLS Policies
ALTER TABLE public.favorite_stores ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own favorites" ON public.favorite_stores
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can add favorites
CREATE POLICY "Users can add favorites" ON public.favorite_stores
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can remove favorites
CREATE POLICY "Users can remove favorites" ON public.favorite_stores
    FOR DELETE
    USING (auth.uid() = user_id);
