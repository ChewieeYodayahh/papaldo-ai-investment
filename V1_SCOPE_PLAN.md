# v1 scope: what's done, what's parked (2026-10-02)

Carlos (2026-10-02): v1 stays a market and tool simulator, not a full social
network from day one. Everything social stays behind the **Developer** role
(admins only, through `user_roles` and `private.is_admin()`) until Carlos decides
it belongs in v1.

## Done (uncommitted at time of writing)

- **Repo:** `marketing/video/build/` and `/out/` are untracked and ignored.
- **AI advisory removed:** `features/advisory`, `/api/advisory/outlook`,
  `core/services/claude.ts` and `@google/genai`.
- **Alpaca catalogue removed:** the "All US stocks" table and catalogue search.
  `/markets` search covers Papaldo's names only.
- **Universe at 70** (`20261002120000_universe_70.sql`, applied). The new names
  cover Healthcare, Energy, Industrials, Consumer, Communication, Utilities, Real
  Estate and Materials. Market caps fill on the next `market-data` workflow run.
- **ETF profiles:**
  - the table `etf_profiles` (`20261002130000_etf_profiles.sql`, applied; public
    read only);
  - `python/etf_profiles.py` with 5 tests;
  - a weekly workflow step that runs once the `ALPHAVANTAGE_API_KEY` repo secret
    exists.
- **Landing page:** static, zoomed screens, with the MacBook first and a separate
  "Works on your phone too" section (see PROGRESS.md).

## Parked: next session

### Markets (for everyone)

- Regenerate `core/services/supabase/database.types.ts`. It doesn't list
  `etf_profiles` yet, and its hand-kept `market_outlooks` block is now dead.
  Update `.claude/rules/database.md` to match.
- Add `markets/api/etf.ts` with `getEtfProfile(symbol)`.
- A "Top holdings" dialog on ETF rows and on ETF symbol pages:
  - the top 10 with weight bars;
  - the sector split;
  - "As of";
  - "See more on <issuer>", which opens `source_url`.
- A plain-English "What is an ETF?" card on `/markets`, plus an `etf` entry in
  `tools/calculators/terms.ts`.
- Docs: CLAUDE.md, CONTEXT.md and EXTERNAL_SERVICES.md still mention advisory and
  Gemini.

### Social (Developer role only)

**Database:** `supabase/drafts/social_personalization.sql`, written and **not
applied**. It covers:
- `users.facebook_url`, `website_title`, `banner_url`, `profile_palette`,
  `profile_colors` and `last_active_at`, each with checks;
- `chat_messages.author_avatar_url`, snapshotted by the insert trigger;
- `active_members()`, refused in the database to anyone without the Developer role;
- `public_profile()` returning the new fields. Email, contact and income are still
  never returned.

To apply it: move it to `supabase/migrations/` with a fresh timestamp, apply it,
then run `db-auditor`.

**App, all gated on `ShellUser.isAdmin`:**
- avatars beside names in the chat;
- an "N active" avatar stack with a names dialog;
- a 60 s heartbeat from signed-in tabs;
- `/network` ("Open Network"): active now, friends with online dots, your member
  profile preview with Customize, recent chats, recent blogs;
- the profile page shortcuts become Open Network, Export moves to the bottom, and
  Sign out stays in the header menu only;
- a Facebook badge (Simple Icons CDN) and a website badge with a title;
- banner upload through `POST /api/profile/banner`, reusing `auth/api/avatar.ts`;
- `/u/[name]` drawn in the owner's `profile_palette`.

**Cloudinary:** the code is wired. Carlos adds `CLOUDINARY_CLOUD_NAME`, `_API_KEY`
and `_API_SECRET` to `.env.local` and Vercel.

**Meta Graph API:** link-only for now. Write notes in EXTERNAL_SERVICES.md from the
vault clips ("Graph API Developer Documentation", "Access Tokens for Meta
Technologies").

### Landing page follow-ups

- Swap the CSS MacBook and iPhone frames for free mockup PNGs. This needs Carlos's
  OK to download: file, source and size named first.
- Paldo the mascot: still waiting on Higgsfield sign-in (`higgsfield auth login`)
  and the carabao-or-bull pick.

### Marketing video (Carlos decides whether to keep it)

- The ten real-app device clips in `public/landing/clips/` are no longer used by
  `/`.
- Use them for the promo or a future "See all features" page.
- Re-render with `cd marketing/video && node scripts/render-clips.mjs`.
- The 1-minute real-component promo (`PapaldoPromo`) still plays only the four
  scenes that exist.
