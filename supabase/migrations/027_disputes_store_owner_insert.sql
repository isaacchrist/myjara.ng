-- Phase 1.5 follow-up: flagChatAsDisputeAction lets EITHER side of a chat
-- conversation flag it (customer or store owner), and always records the
-- real customer as customer_id (room.user_id) so both participants keep
-- their existing dispute-visibility policies (022) regardless of who filed
-- it. The existing INSERT policy only allowed auth.uid() = customer_id,
-- which would reject the store-owner-flags case since they aren't the
-- customer -- add a second INSERT policy for that path.
CREATE POLICY "Store owners can create disputes for their store"
    ON public.disputes FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.stores s
            WHERE s.id = public.disputes.store_id
              AND s.owner_id = auth.uid()
        )
    );
