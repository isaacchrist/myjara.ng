-- Add contact fields to stores for public visibility
ALTER TABLE public.stores 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS profile_picture_url TEXT;

-- Sync existing phone numbers from users to stores (for retailers)
UPDATE public.stores s
SET 
    phone = u.phone,
    profile_picture_url = u.avatar_url
FROM public.users u
WHERE s.owner_id = u.id
AND s.phone IS NULL;
