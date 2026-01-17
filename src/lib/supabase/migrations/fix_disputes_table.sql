-- Re-create disputes table to ensure schema is correct
-- This drops the existing table to resolve the "column customer_id does not exist" error
-- caused by a pre-existing table with a different schema.

DROP TABLE IF EXISTS public.disputes;

CREATE TABLE public.disputes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    customer_id UUID REFERENCES public.users(id) NOT NULL,
    order_id TEXT NOT NULL, 
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'under_review', 'resolved', 'closed')),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Add RLS Policies
ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

-- Customers can view their own disputes
CREATE POLICY "Customers can view their own disputes" ON public.disputes
    FOR SELECT
    USING (auth.uid() = customer_id);

-- Customers can create disputes
CREATE POLICY "Customers can create disputes" ON public.disputes
    FOR INSERT
    WITH CHECK (auth.uid() = customer_id);
