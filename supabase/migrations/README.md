# Migration history status (as of Phase 0 stabilization pass)

This folder (`supabase/migrations/`) is the **only** place new schema changes
should be written from now on. `src/lib/supabase/migrations/` (21 ad-hoc
`.sql` files, applied manually via the Supabase SQL Editor over Jan–Feb 2026)
is **deprecated** -- do not add new files there.

## Why it isn't fully merged into this folder

The ad-hoc scripts don't reconcile cleanly by just reading them:

- `create_disputes_table.sql` and `fix_disputes_table.sql` look, from their
  own comments, like they should apply in the opposite order from their file
  timestamps (`fix_...` says it's dropping and recreating a table that
  already exists with the wrong shape, but `create_...` is a plain
  `CREATE TABLE IF NOT EXISTS` and is timestamped *later*). Which one
  actually ran last against the live database can't be determined by
  reading the repo.
- Several files are competing rewrites of the same `handle_new_user()`
  trigger (`complete_fix.sql`, `fix_trigger_enum.sql`,
  `fix_trigger_shop_type.sql`, `recreate_trigger.sql`,
  `fix_registration_trigger.sql`). Only whichever one was actually run last
  reflects the live function body -- guessing wrong and replaying an
  intermediate version would silently regress a real bug fix.
- A few are pure diagnostics (`diagnostic_check.sql`, `inspect_policies.sql`,
  `schema_inspection.sql`, `enable_error_logging.sql`,
  `enable_verbose_logging.sql`) with no lasting schema effect -- fine to
  ignore, but confirms this folder was being used as a scratchpad, not a
  migration history.

Fabricating a merged history from guesswork would be worse than the current
honest gap: a wrong guess becomes a landmine the next time someone applies
migrations to a fresh environment.

## What was done instead (021-024 in this folder)

Rather than reconstruct history, the actual bugs found during the Phase 0
stabilization pass were fixed as new, idempotent migrations layered on top
of whatever the live state actually is (`ADD COLUMN IF NOT EXISTS`,
`CREATE OR REPLACE FUNCTION`, etc.), so they're correct regardless of the
exact prior sequence. See 021-024 for specifics.

## Recommended follow-up (needs Supabase project credentials this session didn't have)

1. `npx supabase link --project-ref bpjqaquqgsyodzcpodtz` (needs a Supabase
   access token, `supabase login` first).
2. `npx supabase db pull` -- generates a migration reflecting the *actual*
   live schema, which becomes the true baseline going forward.
3. `npx supabase gen types typescript --linked > src/types/database.ts` --
   replaces the stale, hand-written type file (currently only reflects
   migration 001) so the ~20+ `as any` casts across the codebase can start
   being removed incrementally.
4. Once that baseline exists, `src/lib/supabase/migrations/` can be deleted.
