# MyJara Platform Stabilization & Feature Roadmap

## Context

MyJara has gone through several rapid AI-assisted development passes. That left behind duplicate/conflicting database schemas (three different chat table sets, two migration directories that disagree with each other and with `src/types/database.ts`), admin tooling that queries columns/tables that don't exist, a paywall that's only half-enforced, and — most urgently — a `users` RLS policy that exposes every user's DOB, home address, bank account number, and tax ID to anyone, unauthenticated. On top of that unstable foundation, there's a long list of real product gaps: wholesalers can't see or monetize their own stores properly, categories are split across two disconnected taxonomies, chat doesn't support product references or admin-user conversations reliably, and the UI has no visual identity beyond flat Tailwind defaults.

Given the size of this (five distinct workstreams, dozens of individual items), the goal here is not to fully spec every feature today. It's to sequence the work by risk — stop active data corruption/exposure first, then make already-half-built features (chat, admin visibility, wholesaler dashboard) actually work, then build the new monetization/ads/UI initiatives on top of a stable base — and to fully scope the phase we start with (Phase 0) so it's immediately executable. Phases 1–4 are roadmap-level scoping; each gets its own detailed implementation pass when we reach it.

This plan reflects two rounds of live code investigation (not just the docs), so some things flagged during scoping turned out to be worse than described (chat has three incompatible schemas, not just "not working"; admin/messages references a table that doesn't exist at all) and a couple turned out to be partially built already (the category multi-select on seller profile-edit *does* save — it just saves to a taxonomy nothing else reads, which is likely why it feels broken).

**Status:** Phase 0 (0.1–0.5) has been implemented in code — see the migrations in `supabase/migrations/021`–`024` and `supabase/migrations/README.md`. Those migrations have **not** been applied to the live database yet (no DB credentials were available in that session); they need to be run via the Supabase SQL Editor before Phase 0 is actually in effect. Phases 1–4 are unstarted.

---

## Phase 0 — Security & Data-Integrity Emergency

No user-visible feature work in this phase — the goal is to stop active harm and give every later phase a foundation that won't silently corrupt data.

**0.1 Fix the `users` RLS PII leak**
`supabase/migrations/001_initial_schema.sql:239-241` has `CREATE POLICY "Public can view basic user info" ON users FOR SELECT USING (true)`. Later migrations added `date_of_birth`, `residential_address`, `bank_name`, `account_number`, `account_name`, `rc_number`, `tax_id_number`, `directors_info` directly onto this table without ever narrowing that policy. Anyone with the anon key can currently read all of it for every user.
- New migration: replace the blanket policy with `USING (auth.uid() = id)` for the full row.
- Grep every client-side `supabase.from('users').select(...)` call (chat participant display, store-owner name lookups, etc.) and either move them server-side or point them at a new narrow `public_user_profiles` view exposing only `id, full_name, avatar_url`.

**0.2 Fix `disputes` RLS + the admin disputes page**
- `disputes` RLS currently only allows `customer_id = auth.uid()` — there's no admin or store-owner read policy at all (the migration's own comment calls it a placeholder). Add one.
- `admin/disputes/page.tsx` uses the anon client instead of `createAdminClient()` like every other admin page — switch it.
- The page selects a `subject` column that doesn't exist on the real table (`create_disputes_table.sql` has `reason`, not `subject`) — fix the query to match actual columns (`reason, description, cause, status`).

**0.3 Consolidate the chat schema (fixes admin↔user chat, chat broken for some users)**
Three incompatible schemas exist today: `chat_rooms`/`messages` (`012_chat_system.sql`, what `src/app/actions/chat.ts` and all real chat UI use), the orphaned `chat_conversations`/`chat_messages` (`001`/`002_chat_and_customization.sql`, still queried by one marketplace chat page but otherwise dead), and a `conversations` table referenced by `admin/messages/page.tsx` that **doesn't exist in any migration** — that page is almost certainly erroring or silently empty right now.
- Standardize on `chat_rooms`/`messages` since it's what's actually wired through the action layer everywhere else.
- Rebuild `admin/messages/page.tsx` on top of the existing `chat.ts` actions (`getChatRoomsAction`, `sendMessageAction`, etc.) instead of the nonexistent `conversations` table.
- Retire the orphaned `chat_conversations` schema once its one remaining caller (`(marketplace)/chat/[id]/page.tsx`) is migrated or removed.

**0.4 Fix admin analytics revenue computation**
`admin/analytics/page.tsx` and the `get_sales_by_location` RPC both filter `orders.status = 'completed'`, but the real `OrderStatus` enum is `pending|paid|processing|shipped|delivered|cancelled` — `'completed'` never matches, so revenue is likely always reporting 0. Fixed to use `delivered` (the status sellers actually set via the "Mark Delivered" action) as the revenue-recognized terminal status.

**0.5 Reconcile the two migration directories**
`supabase/migrations/*.sql` (numbered, looks official) and `src/lib/supabase/migrations/*.sql` (20 ad-hoc scripts that actually add columns/tables the app depends on, e.g. `stores.categories`, `disputes`, the analytics RPC) disagree with each other and with `src/types/database.ts`, which is why the codebase is full of `as any` casts. A full historical merge turned out to be unsafe to do blind (see `supabase/migrations/README.md` for why); instead, new bugs found were fixed as idempotent migrations layered on top of whatever the live state actually is, and a `supabase db pull` / `supabase gen types` follow-up is documented for whoever has live DB credentials.

**Phase 0 verification:** confirm an anon/logged-out request can no longer read other users' PII; log in as admin and successfully view + respond in a real chat conversation via `admin/messages`; confirm `admin/disputes` shows disputes filed by a test account; place a test order through to its terminal status and confirm it shows up in admin analytics revenue.

---

## Phase 1 — Core Data Model & Admin Visibility

**1.1 Unify the categories taxonomy** — this is the root cause behind the "categories not editable" and "admin can't see products by category" complaints. Sellers pick from a hardcoded `PRODUCT_CATEGORIES` list in `src/lib/constants.ts`, stored as raw strings in `stores.categories`. Products, meanwhile, use `products.category_id`, a real foreign key into the `categories` table (UUID primary keys). These two taxonomies are disconnected — the seller-side multi-select on `seller/profile/edit/page.tsx` genuinely does save (`src/app/actions/profile.ts:83-89`), but it saves into a field nothing else reads, which is likely why it feels broken from the outside.
- Migrate `PRODUCT_CATEGORIES` into real `categories` rows (top-level slugs already match the seeded data in `001_initial_schema.sql`, so this is mostly a mapping exercise), change `stores.categories` to reference `categories.id` (or a `store_categories` join table), and update both the profile-edit page and admin categories page to read/write the same source of truth.
- Build actual CRUD on `admin/categories/page.tsx` (currently view-only — no create/edit/delete for name, slug, or icon).
- Fix a real bug found along the way: `updateProfile()` skips writing `categories` entirely when the array is empty (`if (formData.categories && formData.categories.length > 0)` in `profile.ts:83`), so a seller can never clear all their categories.

**1.2 Admin store & product visibility**
- `admin/stores/page.tsx` queries an `is_verified` column that doesn't exist in any migration — add the column or fix the query — and add a retailer-vs-wholesaler type filter (by `shop_type`).
- Add a "products by category" filter/view to the admin panel.

**1.3 Registration → profile completeness**
- Decide, field by field, which registration-collected values (full name, email, sex, DOB) should become editable vs. intentionally locked (e.g. legal-name changes routed through support), then wire the rest into `seller/profile/edit` and the customer settings page.
- Extend wholesaler/brand registration (`register/brand/page.tsx`) to collect what retailer registration already does — it currently hardcodes `categories: []` and skips several fields the retailer flow captures.

**1.4 User tags** — clarified: every user/vendor/admin should get a short, unique, human-readable tag (distinct from their `id` UUID) so people and disputes can be found without quoting a raw UUID.
- `users.tag`: unique, generated at registration from `slug(name) + '-' + first 4 chars of the real UUID` — keeps the tag deterministically tied back to the UUID (the thing every FK and RLS policy actually uses) without encoding meaning *into* the UUID itself, which would fight its purpose as an opaque key. Admins get an `admin-` prefixed tag.
- Searchable in chat (`searchUsersAction`, `searchStoresAction`) and in the admin disputes list; admin/users shows both `tag` and the full `id` for reference.
- **Deferred, not built yet:** "wholesalers can name up to 5 tagged staff accounts (support/disputes/etc.)" and "multi-shop retailers get one tag per shop, varying by location/category" both need a real sub-account/staff model and the multi-shop data model neither of which exist yet — `stores` is strictly one-row-per-owner today (see 2.1's `store_locations` note and the assumption audit in 2.5). Building tags for accounts that can't exist yet would be premature; revisit as part of 2.1 (wholesaler staff accounts) and 2.5 (multi-shop) once those land, then extend tag generation to encode shop location/category at that point.

**1.5 Chat: product references + dispute flagging** (builds on the 0.3 consolidation)
- Add a nullable `product_id` (or a `metadata jsonb`) to `messages` and a compact product-attach UI in the chat composer, reusing `ProductCard`.
- Add a "flag as dispute" action on a conversation that creates a `disputes` row linked to it, visible only to the admin and that conversation's user.

---

## Phase 2 — Wholesaler / Multi-Tenant Infra & Monetization

**2.1 Wholesaler dashboard fixes**
- The dashboard layout's persistent header "View Store" link is hardcoded to `/` instead of `/store/${store.slug}` (the correct link already exists elsewhere, on `dashboard/page.tsx`) — likely why multi-tenant "feels" broken even though the storefront route and subdomain routing both work when traced.
- There's an existing but seemingly-orphaned `/store/[slug]/admin` route gated by a separate access-key form, not obviously connected to anything past key entry — needs a decision when this phase starts: repurpose as the wholesaler's real admin entry point, or remove it.
- Build a wholesaler payments/billing page (payout history, settlement details), mirroring the settlement-account UI that already exists for retailers in `seller/profile`.

**2.2 Custom domain connection** — build UI against the existing, currently-unused `store_domains` table (add-domain form, verification instructions, status). Subdomain routing already works; custom domains are new.

**2.3 Differentiated pricing & a real paywall**
- Split the flat `SUBSCRIPTION_PLANS` by `shop_type` (physical/online/market_day) instead of one set for all retailers, and reconcile the third, currently-dead plan definition living in `register/brand/page.tsx`.
- Design wholesaler per-customer-conversion billing (default: a completed order attributed to that store = one conversion — confirm before building).
- Extend the middleware subscription-expiry gate to `/dashboard` (wholesaler routes) — today only `/seller/*` (retailer) is enforced, so wholesalers face no paywall at all regardless of subscription status.

**2.4 Post-signup onboarding flow** — after wholesaler registration, show a glassmorphism customization widget (new Dialog primitive from Phase 4), then open the live `/store/[slug]` in a new tab and the dashboard in another.

**2.5 Physical retailer multi-shop** — "one store per owner" is assumed throughout the codebase (dashboard, profile, chat welcome message all do `.eq('owner_id', user.id).single()`). Recommend a `store_locations` child table under one store rather than allowing multiple `stores` rows per owner, to avoid breaking that assumption everywhere at once — full design deferred to this phase.

**2.6 Social links & notifications** — add social link columns to `stores`; build a minimal notifications table + bell UI; add a scheduled job (Vercel Cron) for subscription-expiry reminder emails reusing the existing `resend.ts` templates.

---

## Phase 3 — Ads Platform

- New tables: `ads` (store_id, product_ids[], target criteria, status, payment_ref, rejected_reason) linked to `disputes` via a nullable `ad_id`.
- Vendor "Run Ads" button on the brand dashboard: product picker + targeting form + Flutterwave-or-promo-code submission, reusing the existing `checkout-form`/`payment-button` patterns.
- New admin ad review queue: approve → admin controls placement; reject → opens a chat with that vendor (Phase 1.5) scoped to that ad, with one-click dispute flagging.
- Super-admin placement pipeline: an `ad_placements` config (slot key → active ad ids) read by the homepage and other pages at render time, plus a small admin-editable settings table for homepage copy/banners (not a full CMS).
- Per-user signal tracking: derive most-purchased product/category per user from `order_items`, kept server-side only (never exposed in the customer-facing account UI), consumed by the ad-placement query to bias which ads a given user sees on the homepage.

---

## Phase 4 — UI/UX Redesign

- Build a real `dialog.tsx` primitive — `@radix-ui/react-dialog` is already a dependency but only wired up for `Sheet`, and there is currently zero glassmorphism anywhere in the app except one stray `backdrop-blur-sm` badge in the store gallery. This is new design work, not a retrofit: frosted-glass background, then align `Sheet`/`Toast` to the same treatment so all popups look consistent.
- Remove the homepage's inline "Shop by Category" section (`src/app/(main)/page.tsx` ~lines 204–229) to free up space.
- Consolidate the two near-duplicate pages (`/how-jara-works` and `/how-it-works`) into one, and repoint the homepage/footer links at the survivor.
- Make the footer (`src/components/shared/footer.tsx`, currently fully static) conditional on auth/role state.
- Enrich the customer account dashboard: surface the existing-but-unlinked Favorites and Disputes pages, and add the ₦1000 "Best Deals" premium page plus an Explore-page popup that fires after the user's first search, is dismissible, and links to the subscription page (built on Phase 2.3's plan infra).
- Admin portal: new analytics widgets for most-sold category/product by area, shop volume by area, and a top jara-payout leaderboard (new RPCs alongside the existing `get_sales_by_location`).

---

## Open questions to resolve before their phase starts

- **Phase 1.4:** what specifically is broken about "user tag names" — need a concrete example/screen.
- **Phase 2.1:** repurpose or remove the orphaned `/store/[slug]/admin` access-key page?
- **Phase 2.3:** confirm the wholesaler "conversion" definition — defaulting to "completed order" unless told otherwise.

## Verification approach

- Phase 0: manual RLS/admin smoke tests as listed above, plus `npm run build` after any schema/type changes, then applying `supabase/migrations/021`–`024` via the Supabase SQL Editor (no DB credentials were available to apply them automatically).
- Each later phase: build + a live manual walkthrough of the touched flow in a browser (this repo has no automated test suite currently — confirm that's still true before skipping tests on later phases).
