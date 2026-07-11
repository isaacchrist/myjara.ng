-- Phase 1.5: chat product references + flag-as-dispute
--
-- product_id lets a chat message carry a compact product attachment
-- (nullable -- content stays required so the NOT NULL constraint and the
-- existing email-preview logic in sendMessageAction still work unchanged).
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES public.products(id) ON DELETE SET NULL;

-- room_id lets a dispute originate from a chat conversation instead of only
-- an order. Visibility is already correctly scoped by the existing
-- customer_id/store_id RLS policies (022_fix_disputes_schema_and_rls.sql) --
-- no new policy needed as long as flagChatAsDisputeAction populates both
-- from the room.
ALTER TABLE public.disputes
    ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES public.chat_rooms(id) ON DELETE SET NULL;
