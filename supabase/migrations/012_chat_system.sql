-- Create Chat Rooms table
CREATE TABLE public.chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) NOT NULL,
    store_id UUID REFERENCES public.stores(id) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_message_content TEXT, -- Optimization for list view
    UNIQUE(user_id, store_id)
);

-- Create Messages table
CREATE TABLE public.messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    room_id UUID REFERENCES public.chat_rooms(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.users(id) NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Chat Rooms
-- 1. Users can see their own rooms
CREATE POLICY "Users can view their own chat rooms"
ON public.chat_rooms FOR SELECT
USING (auth.uid() = user_id);

-- 2. Store Owners can see rooms for their stores
CREATE POLICY "Store owners can view their store chat rooms"
ON public.chat_rooms FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.stores
        WHERE stores.id = chat_rooms.store_id
        AND stores.owner_id = auth.uid()
    )
);

-- 3. Users can create rooms (initiating chat)
CREATE POLICY "Users can create chat rooms"
ON public.chat_rooms FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for Messages
-- 1. Participants can view messages
CREATE POLICY "Participants can view messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.chat_rooms
        WHERE chat_rooms.id = messages.room_id
        AND (
            chat_rooms.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.stores
                WHERE stores.id = chat_rooms.store_id
                AND stores.owner_id = auth.uid()
            )
        )
    )
);

-- 2. Participants can send messages
CREATE POLICY "Participants can insert messages"
ON public.messages FOR INSERT
WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
        SELECT 1 FROM public.chat_rooms
        WHERE chat_rooms.id = room_id
        AND (
            chat_rooms.user_id = auth.uid() OR
            EXISTS (
                SELECT 1 FROM public.stores
                WHERE stores.id = chat_rooms.store_id
                AND stores.owner_id = auth.uid()
            )
        )
    )
);

-- Function to update chat_rooms.updated_at and last_message on new message
CREATE OR REPLACE FUNCTION public.handle_new_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.chat_rooms
    SET 
        updated_at = NEW.created_at,
        last_message_content = NEW.content
    WHERE id = NEW.room_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new message
CREATE TRIGGER on_new_message
AFTER INSERT ON public.messages
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_message();

-- Enable Realtime for messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
