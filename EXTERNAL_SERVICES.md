# External services

Every third-party API and MCP server this project touches, and which of two
very different categories each one falls in: called by the **running app**,
or used only while **building** it. Conflating the two is exactly how
`AGENTS.md` ended up claiming this project calls a "Codex API" that does not
exist — see "Corrections made in this pass" at the bottom.

## Runtime APIs — called by the deployed app

| Service | Called from | Auth | Notes |
|---|---|---|---|
| **Supabase** — Postgres + Auth | `core/services/supabase/{client,server,middleware}.ts` | `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable, RLS-gated) | Project `ettgbzgdtvmfbqrdtjzb`. Every user-scoped table has RLS; the anon/publishable key is safe client-side because of it. `database.types.ts` is generated from live schema via Supabase MCP, not hand-written. |
| **Google OAuth** | `features/auth/api/google.ts` | n/a — brokered | Not called directly. `getGoogleAuthUrl()` calls `supabase.auth.signInWithOAuth({ provider: 'google' })`; Supabase Auth holds the actual Google client ID/secret. Currently non-functional in production: Google is not yet enabled under Supabase → Authentication → Providers (PROGRESS.md, 2026-09-10 triage). |
| **Finnhub** | `core/services/finnhub.ts` | `FINNHUB_API_KEY` (server-only, no `NEXT_PUBLIC_` prefix) | Real-time US market data. Chosen 2026-09-10 over Alpha Vantage specifically because its free tier (~60 req/min) supports on-demand quotes without an ingestion job — AV's free tier is 25 req/day. Seven functions in active use: `getQuote`, `getQuotes`, `getMarketNews`, `getCompanyProfile`, `getBasicFinancials`, `getCompanyNews`, `getRecommendations`. **Known gap: no historical OHLC.** `/stock/candle` and `/crypto/candle` both answer 403 on this plan — confirmed against the live API 2026-09-10. `features/markets/api/candles.mock.ts` fills that one gap with clearly-labeled synthetic data (Carlos's explicit call, 2026-09-10) pending a real provider; every other Finnhub-backed number on the site is live. |
| **ExchangeRate-API** (v6) | `core/services/exchange-rate.ts` — `getUsdToPhp()`, called once per page by `features/shell/api/shell.ts` | `EXCHANGE_RATE_APIKEY` (server-only, key in the URL path — never logged) | Added 2026-09-25 for the $ / ₱ display toggle, because Alpaca's forex endpoint answers 403. `GET /v6/{key}/pair/USD/PHP`. **Errors arrive as HTTP 200** with `result: "error"` and an `error-type` (`invalid-key`, `quota-reached`, …) — verified live. The provider publishes once a day, so responses are cached 6h. Display only: balances stay USD in the database. Supported codes: vault note *ExchangeRate-API - Supported Currency Codes and Countries*. |
| **Financial Modeling Prep — logo images** | `features/markets/logos.ts` → `SymbolMark` | none — public image path | Added 2026-09-25. **Loaded by the browser, never by the server**: `https://financialmodelingprep.com/image-stock/{SYMBOL}.png`. Covered all 41 buyable names when probed (ETFs get the issuer's mark); unknown symbols answer 404 and the Avatar falls back to the ticker monogram. Share classes use a hyphen (`BRK-B`). Chosen because Alpaca's logo endpoint is 403 on this plan and Finnhub is reserved for news. Sent with `referrerPolicy="no-referrer"`. |
| **Claude (Anthropic) API** | `core/services/claude.ts` — `createMessage()` | `ANTHROPIC_API_KEY` (not yet set anywhere — see Known gaps) | **Built, not called by anything yet.** Intentionally unused in this phase: ISQ risk scoring is fully deterministic (`features/onboarding/scoring.ts`), so the app runs with zero AI calls today. This module exists so a later phase (portfolio-recommendation reasoning, plain-language profile narratives) has one integration point instead of scattering `fetch` calls through route handlers. Default model `claude-sonnet-5`, endpoint `api.anthropic.com/v1/messages`. |

## CI-only — fires on GitHub, never in the running app

| Service | Where | Auth | Notes |
|---|---|---|---|
| **Claude Code Security Review** (`anthropics/claude-code-security-review` GitHub Action) | `.github/workflows/security-review.yml` | `CLAUDE_API_KEY` — a **GitHub Actions secret**, separate from the app's `ANTHROPIC_API_KEY` | Runs on every PR opened/synced from this repo (fork PRs are explicitly skipped by `if:` before the job touches the secret), posts a review comment. Same underlying Anthropic API as the row above, but a distinct credential with a distinct name — easy to conflate, worth keeping straight when rotating keys. |
| **npm registry** | `.github/workflows/ci.yml` | none | Lint, typecheck, `npm test`, `npm run build` on every push/PR. Build step feeds syntactically-valid placeholder Supabase values (`env:` block) — no real credentials needed to compile. |

## MCP servers

### Project-level — `.mcp.json`, checked into the repo

Available to any agent (Claude or otherwise) working in this repo, regardless
of session:

| Server | Transport | Purpose |
|---|---|---|
| `shadcn` | `npx shadcn@latest mcp` | Component scaffolding — pulling new shadcn/ui primitives into `src/components/ui/`. |
| `vercel` | `https://mcp.vercel.com` (http) | Deployment platform — the app's actual host. |

### Session/dev-time only — not in `.mcp.json`

Configured in Carlos's own Claude setup, not the repo. The running app never
calls these; they exist only for an agent to inspect or change things while
building.

| Server | Used for | Notes |
|---|---|---|
| **Supabase MCP** | Applying migrations, generating `database.types.ts`, running security/performance advisors, inspecting live tables | Used directly and heavily this session — e.g. `portfolios`/`holdings` were created live via `apply_migration`, then mirrored into `supabase/migrations/` for the repo's own record. Distinct from the `@supabase/supabase-js` client the app itself uses at runtime. |
| **Alpha Vantage MCP** | Sanity-checking AV payload shapes while exploring the (currently shelved) screener plan | Explicitly scoped as dev-only in `REQUIREMENTS.md`: *"The running app must not call MCP... Putting an MCP client in the request path would add a protocol layer for no gain."* If the AV-based screener in `REQUIREMENTS.md` Part 3 is ever built, ingestion hits AV's plain REST API directly, not this MCP server. |

### Present on this machine, not connected to this project

Not part of Papaldo's toolchain — noted here only so a future pass doesn't
mistake local tooling for a project dependency:

- **OmniRoute**, **Composio** — general-purpose connectors available in
  Carlos's environment. Standing rule for Composio specifically: connect
  individual toolkits only as a real need shows up, never the full catalog.
- **Codex CLI** (`~/.codex`) — a separate AI coding agent installed on this
  machine. `AGENTS.md` is the generic instructions-file convention it (and
  other non-Claude agents) read, the same role `CLAUDE.md` plays for Claude.
  Its presence on the machine is unrelated to — and does not justify —
  `AGENTS.md` describing a "Codex API" inside the app itself. See below.

## Corrections made in this pass

**`AGENTS.md` incorrectly described a `Codex.ts` service file and a "Codex
API"** that this project uses. Neither exists: a full recursive listing of
`src/` turned up no `Codex.ts` anywhere, and no OpenAI/Codex API call exists
in the codebase. The actual file is `core/services/claude.ts`, calling
Anthropic's Claude API (table above). Every other line in `AGENTS.md` was a
near-exact copy of `CLAUDE.md`, with "Claude" mechanically swapped for
"Codex" throughout — reading like an automated attempt to make the file
agent-agnostic that didn't distinguish real file/service names from prose.
`AGENTS.md` has been corrected to state the same facts `CLAUDE.md` does: the
codebase doesn't change depending on which agent's instructions file is
reading it.

## Known gaps

- **`ANTHROPIC_API_KEY`** is not in `.env.example` or `.env.local`. Harmless
  today — `claude.ts` has no caller — but add it once a phase starts using
  `createMessage()`.
- **No historical OHLC provider.** `features/markets/api/candles.mock.ts` is
  the placeholder; the named candidate to replace it is Alpaca.
- **AI Investment Advising Engine** - Use Claude Haiku 4.5 API, where it also reads monthly market insights of the ff allocations of the users, generates its own prospective outlooks from different authoritative sources (fund managers, hedge funds, banks, governments, research tanks), tailor-fits to the risk appetite of the user (e.g. Conservative, Moderate, Aggressive). So we should feature different asset classes for all kinds of risk appetites -> forex (USD, PHP, GBP), fixed-income (Conservative), stocks/equities, commodities, crypto (automatically aggressive),  
- **Google sign-in is coded but not live** — the provider isn't enabled yet
  under Supabase → Authentication → Providers, and `NEXT_PUBLIC_SITE_URL` is
  still `http://localhost:3000` (needs a real value in the Vercel project for
  the OAuth redirect to resolve correctly once Google is on).
- **The curated ~60-symbol/6-industry ticker universe** that `REQUIREMENTS.md`
  Part 3 calls for is still Carlos's open item — separate from the 7-symbol
  `WATCHLIST_SYMBOLS` the Finnhub dashboard uses today, which was chosen only
  to have something real to show, not as the intended final list.
