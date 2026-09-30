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
| **Google OAuth** | `features/auth/api/google.ts` | n/a — brokered | Not called directly. `getGoogleAuthUrl()` calls `supabase.auth.signInWithOAuth({ provider: 'google' })` with `prompt=select_account`; Supabase Auth holds the actual Google client ID/secret. **Enabled** as of 2026-09-26: the consent redirect was observed reaching Google's account chooser from `localhost:3001`. `getGoogleLinkUrl()` (profile page → "Link Google") calls `linkIdentity`, which additionally needs **Enable manual linking** under Supabase → Authentication → Sign In / Providers; with it off, the page shows Supabase's "Manual linking is disabled". |
| **Supabase Auth emails** | `features/auth/api/password.ts` | n/a — Supabase's mailer | Added 2026-09-26. `resetPasswordForEmail` sends the password-change confirmation link; the callback trades it for a session whose `amr` records `recovery`, and only then does `changePassword` accept a new password. Uses Supabase's built-in SMTP, which is **rate-limited to a few emails per hour** — configure custom SMTP before real users rely on it. |
| **Finnhub** | `core/services/finnhub.ts` | `FINNHUB_API_KEY` (server-only, no `NEXT_PUBLIC_` prefix) | Real-time US market data. Chosen 2026-09-10 over Alpha Vantage specifically because its free tier (~60 req/min) supports on-demand quotes without an ingestion job — AV's free tier is 25 req/day. Seven functions in active use: `getQuote`, `getQuotes`, `getMarketNews`, `getCompanyProfile`, `getBasicFinancials`, `getCompanyNews`, `getRecommendations`. **Known gap: no historical OHLC.** `/stock/candle` and `/crypto/candle` both answer 403 on this plan — confirmed against the live API 2026-09-10. `features/markets/api/candles.mock.ts` fills that one gap with clearly-labeled synthetic data (Carlos's explicit call, 2026-09-10) pending a real provider; every other Finnhub-backed number on the site is live. |
| **ExchangeRate-API** (v6) | `core/services/exchange-rate.ts` — `getUsdToPhp()`, called once per page by `features/userData/frame/api/shell.ts` | `EXCHANGE_RATE_APIKEY` (server-only, key in the URL path — never logged) | Added 2026-09-25 for the $ / ₱ display toggle, because Alpaca's forex endpoint answers 403. `GET /v6/{key}/pair/USD/PHP`. **Errors arrive as HTTP 200** with `result: "error"` and an `error-type` (`invalid-key`, `quota-reached`, …) — verified live. The provider publishes once a day, so responses are cached 6h. Display only: balances stay USD in the database. Supported codes: vault note *ExchangeRate-API - Supported Currency Codes and Countries*. |
| **Financial Modeling Prep — logo images** | `lib/logos.ts` (moved from `features/markets/` 2026-09-29) → `SymbolMark` | none — public image path | Added 2026-09-25. **Loaded by the browser, never by the server**: `https://financialmodelingprep.com/image-stock/{SYMBOL}.png`. Covered all 41 buyable names when probed (ETFs get the issuer's mark); unknown symbols answer 404 and the Avatar falls back to the ticker monogram. Share classes use a hyphen (`BRK-B`). Chosen because Alpaca's logo endpoint is 403 on this plan and Finnhub is reserved for news. Sent with `referrerPolicy="no-referrer"`. |
| **Google Gemini API** (the "AI service") | `core/services/claude.ts` — `createMessage()`, despite the file name | `GEMINI_API_KEY` (server-only) | **Corrected 2026-09-29:** the module no longer calls Anthropic. `GeminiAdapter` uses `@google/genai` with `gemini-2.5-flash`, and its one caller is the advisory outlook (`features/advisory/api/outlook.ts`, `POST /api/advisory/outlook`). ISQ scoring stays deterministic. Each call is logged as target `gemini`, action `generate/<model>`. Renaming the file (or restoring a Claude adapter) is Carlos's call; `ANTHROPIC_API_KEY` is not read anywhere. |

**Integration logging (2026-09-29).** Every runtime call above except
Supabase itself goes through `core/services/integration-log.ts`
(`withIntegrationLog` / `logIntegration`), which writes one row per real
network call to `public.integration_logs` through the `log_integration` RPC,
after the response is sent. It records the target, a route *pattern*
(`routePattern`: symbols become `:symbol`, version prefixes drop), status,
duration, HTTP status and a transaction ID — never a URL, query string or
key. Calls answered in under 5 ms are treated as cache hits and skipped.
Rows are readable only by admins (`/admin/integrations`) and trim to 30
days. The Developer Dashboard's Resources page sets each service's 24-hour
call count beside its published free-tier limit.

## Pipeline sources — called by `python/`, never by the running app

Added 2026-09-26. The app only reads what these pipelines stored.

| Service | Called from | Auth | Notes |
|---|---|---|---|
| **Yahoo Finance** (via `yfinance`) | `python/benchmarks.py` (monthly index closes), `python/market_caps.py` (`fast_info.marketCap`) | none — unofficial endpoints | `^NYA`, `^IXIC`, `^GSPC` go back to 1985. **No PSEi history:** `^PSEI` does not exist and `PSEI.PS` returns a single day (checked daily/weekly/monthly and with explicit start dates). Share classes use a dash (`BRK-B`). Unofficial, so it can change without notice; the weekly job's log is the place to look. |
| **Stooq** | `python/benchmarks.py`, first PSEi source (`^psei`, monthly CSV at `/q/d/l/?s=^psei&i=m`) | none | Stooq has the real PSEi, but its CSV endpoint currently answers scripted requests with a JavaScript browser check (proof of work). **The pipeline never solves it**: it sees HTML instead of CSV and reads the committed cache `python/data/psei_monthly.csv` instead, adding the current month from Yahoo's `PSEI.PS`. The cache is refreshed whenever a run is given a hand-downloaded CSV (`--stooq-csv FILE`, daily or monthly, from https://stooq.com/q/d/?s=^psei&i=m). The first one was loaded 2026-09-26 (daily, 1986-01-02 → 2026-09-25). Refresh roughly monthly; the job log warns once the cache is over a month stale. |
| **EPHE** (iShares MSCI Philippines ETF, via Yahoo) | `python/benchmarks.py`, PSEi fallback | none | Monthly history since 2010-09. A proxy, labelled as one in the app: MSCI's Philippine index, not the PSEi's 30 names, priced in USD so peso moves are in it. `market_benchmarks.source_symbol` records which source each row came from. |

## CI-only — fires on GitHub, never in the running app

| Service | Where | Auth | Notes |
|---|---|---|---|
| **Claude Code Security Review** (`anthropics/claude-code-security-review` GitHub Action) | `.github/workflows/security-review.yml` | `CLAUDE_API_KEY` — a **GitHub Actions secret**, separate from the app's `ANTHROPIC_API_KEY` | Runs on every PR opened/synced from this repo (fork PRs are explicitly skipped by `if:` before the job touches the secret), posts a review comment. Same underlying Anthropic API as the row above, but a distinct credential with a distinct name — easy to conflate, worth keeping straight when rotating keys. |
| **npm registry** | `.github/workflows/ci.yml` | none | Lint, typecheck, `npm test`, `npm run build` on every push/PR. Build step feeds syntactically-valid placeholder Supabase values (`env:` block) — no real credentials needed to compile. |
| **Supabase (service role)** | `.github/workflows/market-data.yml` — weekly, Sunday 07:00 UTC, plus manual | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — **GitHub Actions secrets** (the same names `model-portfolios.yml` uses) | Runs the offline pipeline tests, then `market_caps.py` and `benchmarks.py`. The service key bypasses RLS by design: the two tables it writes are read-only to every client role. |
| — | `.github/workflows/model-portfolios.yml` | same secrets | **Cannot currently succeed:** it runs `python/model_portfolios.py`, which was never committed (found 2026-09-26). Left untouched on Carlos's instruction. |

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

- **`claude.ts` calls Gemini, not Claude** (see the table). `ANTHROPIC_API_KEY`
  is unused; the file name is kept until Carlos decides between renaming it
  and adding a Claude adapter back.
- **No historical OHLC provider.** `features/markets/api/candles.mock.ts` is
  the placeholder; the named candidate to replace it is Alpaca.
- **AI Investment Advising Engine** - Use Claude Haiku 4.5 API, where it also reads monthly market insights of the ff allocations of the users, generates its own prospective outlooks from different authoritative sources (fund managers, hedge funds, banks, governments, research tanks), tailor-fits to the risk appetite of the user (e.g. Conservative, Moderate, Aggressive). So we should feature different asset classes for all kinds of risk appetites -> forex (USD, PHP, GBP), fixed-income (Conservative), stocks/equities, commodities, crypto (automatically aggressive),  
- **Redirect allow list** — every Supabase redirect (Google sign-in, Google
  linking, the password email) returns to `${NEXT_PUBLIC_SITE_URL}/api/auth/callback`.
  Locally that is now `http://localhost:3001` (the dev port moved 2026-09-26), so
  Supabase → Authentication → URL Configuration must list
  `http://localhost:3001/**`, and the Vercel project needs its real origin in
  both `NEXT_PUBLIC_SITE_URL` and the allow list. Since 2026-09-30 that origin
  is `https://papaldo-ka.vercel.app`. A URL missing from the list
  makes Supabase fall back to the Site URL.
- **The curated ~60-symbol/6-industry ticker universe** that `REQUIREMENTS.md`
  Part 3 calls for is still Carlos's open item — separate from the 7-symbol
  `WATCHLIST_SYMBOLS` the Finnhub dashboard uses today, which was chosen only
  to have something real to show, not as the intended final list.
