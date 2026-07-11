-- Phase 0.3: allow store owners to initiate a chat room with a customer
--
-- chat_rooms only had an INSERT policy for the customer side
-- (WITH CHECK auth.uid() = user_id, 012_chat_system.sql), so a seller
-- messaging a customer who hadn't already started a conversation (e.g. from
-- an order detail page) had no way to create that room -- the "Chat with
-- Customer" button on seller/orders/[id] was linking to a page keyed off a
-- customer id instead of a real conversation, which never worked anyway.

CREATE POLICY "Store owners can create chat rooms for their store"
    ON public.chat_rooms FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = store_id AND s.owner_id = auth.uid()
        )
    );

-- Not done here, needs manual review first:
-- public.chat_conversations / public.chat_messages (001/002_chat_and_customization.sql)
-- and public.conversations (referenced only by the old, broken admin/messages
-- page, never actually created by any migration) are now fully unreferenced
-- by the app after this change-set. If a manual check of the live data in
-- chat_conversations/chat_messages shows nothing worth preserving, those two
-- tables can be dropped in a follow-up migration.
