# Progress

Running log for the Papaldo build. Newest phase at the top. See `CONTEXT.md` for
domain vocabulary and architecture rules.

---

## Agent tooling — 2026-08-29

Not a product phase. Cuts the cost of every future session.

- **`CLAUDE.md` added.** Repo map + rules, loaded every session. Points at
  `CONTEXT.md` and this file rather than inlining them.
- **`.claude/orient.sh`** — a SessionStart hook emitting branch, upstream
  divergence, recent commits and working tree. Replaces the git calls every
  session was re-running to orient. Always exits 0, so it cannot block a session.
- **`.claude/skills/wrap`** — `/wrap` folds a session into this file.
- **Skills pruned 39 → 12** in `.claude/skills/` (originals intact in
  `.agents/skills/`). Plugins `context-engineering`, `figma` and
  `mattpocock-skills` disabled, plus `syncClaudeAiPlugins: false`, all scoped to
  this project in the gitignored `settings.local.json` — untouched elsewhere.

The skill listing is budget-capped, so ~145 entries did not cost runaway tokens;
it truncated the descriptions of the skills that matter. Pruning bought routing
accuracy first, tokens second.

**Requires a `claude` restart** — the config watcher was not watching
`.claude/settings.json` when it was created, so the hook does not fire until then.

**Footgun:** `.claude/skills/` holds symlinks into `.agents/skills/` and git
follows them. `git add .claude/` would vendor ~30 third-party skill files into the
repo. Stage by name, or add a `.gitignore` rule.

---

## Phase 1 — Registration, Auth and ISQ (current)

**Status: complete and merged to `main` (fast-forward, `c847aec`). End-to-end
sign-up → ISQ → dashboard verified live once "Confirm email" was turned off.**

### Update 2026-08-28 — folder restructure

The tree was migrated to a `src/`-rooted layout (see `CONTEXT.md` → "Folder
structure"): `app/` → `src/app/`, `features/` → `src/app/features/`, `middleware.ts`
→ `src/middleware.ts`, and `shared/` dissolved into `src/components/` (UI),
`src/lib/` (helpers) and `src/app/core/services/` (Supabase + Claude clients). The
`@/*` alias now points at `src/*`. Pure move + import rewrite — no behaviour change;
lint, typecheck, `npm test` (12/12) and `npm run build` (17 routes) all clean after.
Done on branch `refactor/src-app-structure`.

Delivered originally on branch `feat/auth-isq`:

- Next.js 15.5.24 + TypeScript + Tailwind v4 app on a `src/app`-rooted,
  feature-based layout (`src/app/` thin routes, `src/app/features/*` own their
  logic, `src/components` + `src/lib` + `src/app/core` shared only).
- `public.users`, `public.isq_responses`, `public.risk_profiles` with RLS,
  applied via the Supabase MCP and mirrored into `supabase/migrations/`.
- Email/password sign-up and login, Google OAuth, complete-profile step for OAuth
  users, sign-out.
- Six-item ISQ transcribed verbatim from Manulife's Client Suitability
  Assessment, LCM-normalised scoring into Low/Medium/High, 12 unit tests.
- Placeholder `/dashboard` shell showing the resulting band and score.
- CI and Claude Code Security Review workflows.

**Verified:**

- `npm run lint`, `npm run typecheck`, `npm run build` clean; `npm test` 12/12.
- RLS proven, not assumed. With two fixture users and role-switched queries:
  a user sees exactly their own row in all three tables; `anon` is refused at the
  grant level; `isq_responses` UPDATE is denied (append-only); `users` DELETE is
  denied; cross-user INSERT is denied by RLS; `risk_profiles.user_id`
  reassignment is denied by the UPDATE policy's `WITH CHECK`; own-row UPDATE
  still works. Fixtures deleted afterwards — the database is back to zero rows.
- Supabase security advisors: clean.

### Waiting on you

1. ~~Turn off "Confirm email".~~ **Done** — sign-up now returns a live session and
   flows straight into the ISQ.
2. **Supabase → Authentication → Providers → Google** — client ID and secret from
   Google Cloud Console, redirect URI
   `https://ettgbzgdtvmfbqrdtjzb.supabase.co/auth/v1/callback`. Google sign-in is
   coded and builds, but is untested until the provider exists.
3. ~~`gh auth login`~~ **Done** — authenticated as `ChewieeYodayahh` (SSH
   protocol preference). Note: `ssh -T git@github.com` still fails with
   `Permission denied (publickey)`. It does not bite us — `origin` is HTTPS and
   Git Credential Manager handles pushes — but any repo cloned via `gh` from here
   gets an SSH remote that will not push. Fix the key, or
   `gh config set git_protocol https`.
   PR [#1](https://github.com/ChewieeYodayahh/papaldo-ai-investment/pull/1) is
   open against `main` with the Phase 1 work.
4. **`gh secret set CLAUDE_API_KEY`** — the security-review workflow cannot run
   without it.
5. **Run `/setup-matt-pocock-skills` yourself.** That skill is marked
   `disable-model-invocation`, so it is reserved for explicit user invocation and
   cannot be run or reproduced by the agent. Answers that match this repo:
   issue tracker **GitHub**, docs **single-context**, create **`CLAUDE.md`**.
6. ~~Merge the PR.~~ **Done** — `feat/auth-isq` fast-forwarded onto `main` as
   `c847aec`. The `refactor/src-app-structure` branch still needs merging.

### Pending UI/UX design

The UI is knowingly plain for this phase — semantic HTML, labelled inputs, visible
validation errors, no design system, no `frontend-design` pass. What needs design
work:

- `/sign-up`, `/login` — currently a bare stacked form.
- `/onboarding/profile` — same.
- `/isq` — six radio groups on one page. Worth considering a stepper with the
  progress bar the source questionnaire has (it showed `0 … 6`).
- `/dashboard` — a single card with the band and score.
- **Not built at all**, though present on the source result screen: the three-zone
  risk gauge (green/orange/red with a needle), the profile description bullets
  ("Can afford to invest in risky and secure assets…"), and the allocation bar
  (`25% / 75%`). The allocation bar additionally needs the Low and High fund
  splits, which were never captured — see CONTEXT.md.
- No global nav, no layout chrome, no loading skeletons.
- **Dark mode was removed, not skipped.** create-next-app ships a
  `prefers-color-scheme: dark` block that flipped the background to near-black
  while every component style here uses a fixed light palette -- the result was
  dark text and a dark primary button on a dark background. `src/app/globals.css`
  now commits to one light theme. A real dark theme means giving the components
  themed tokens, which belongs with the design pass.

### Decisions worth remembering

- **Three bands, not five.** The brief said "Conservative → Aggressive"; the
  source questionnaire's result screen says Low/Medium/High. The screenshots won.
- **Scoring is a reconstruction.** No per-choice point values were visible in the
  source material, so the LCM-normalised scheme is a defensible invention. It is
  isolated to `questions.ts` and `scoring.ts` for exactly that reason.
- **Username uniqueness has no pre-flight check.** RLS only lets a user read their
  own row, and a public "is this username free?" RPC would add a user-enumeration
  surface. The unique index rejects duplicates instead, and the trigger failure
  rolls back the `auth.users` insert too, so nothing is orphaned. Cost: the error
  message on a collision is inferred from a generic Supabase error rather than
  reported precisely.
- **`citext` was not used.** A unique index on `lower(username)` gives the same
  case-insensitive guarantee without an extension dependency, and plays nicely
  with `set search_path = ''` in the security-definer trigger.
- **Recharts is not installed.** It is in the project's stated stack but nothing
  in this phase charts anything. It belongs to the dashboard assignment.

### Known issues

- **`npm audit` reports a transitive `postcss` advisory** (high) reachable only
  through `next@15.5.24`. The only fix npm offers is `next@16`, a major bump away
  from the brief's pinned Next 15. The issue is build-time (postcss processes our
  own CSS, not user input), so it is logged rather than silently upgraded.
  Revisit when the project is ready to move to Next 16.
- **The first migration's GRANT block was a no-op.** Supabase's default privileges
  had already granted `authenticated` ALL on new public tables, so adding
  `grant select, insert` changed nothing and left DELETE and TRUNCATE in place.
  RLS was still denying those operations, so nothing was ever reachable, but the
  defense-in-depth layer was missing. Corrected in
  `20260828134500_restrict_authenticated_table_grants.sql`, which revokes first.
  Caught by the RLS verification, not by review — worth keeping that verification
  step in future phases.

### Tooling present but unused

- **OmniRoute** — available as a fallback Anthropic backend. Not active this
  session (`ANTHROPIC_BASE_URL` is unset). Only relevant if a rate limit is hit,
  since Claude Code reads that variable at startup and cannot switch mid-session.
- **Composio** — available. **No toolkit has been connected**, deliberately:
  nothing in this assignment needs one. Supabase and GitHub covered everything.

---

## Phase 2 — Dashboard (not started)

Separate assignment. Before it can start it needs the Low and High allocation
pairs (see CONTEXT.md), and it should read the current band from
`public.risk_profiles` rather than recomputing anything.
