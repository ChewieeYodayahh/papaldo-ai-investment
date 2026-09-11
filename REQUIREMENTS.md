# Requirements — Phase 2

Home Dashboard, dark mode, and the MVP stock engine. Newest phase at the top,
same as `PROGRESS.md`. Domain vocabulary lives in `CONTEXT.md`.

Sources: `raw/Papaldo Partial System Architecture Diagram.docx` (Pages 3–4,
Annex A), the Investopedia Simulator portfolio screen (`assets/Papaldo-08.png`),
and the OKX markets table (`assets/Papaldo-43.png`).

---

## Decisions locked 2026-08-29

| Decision | Choice | Why |
|---|---|---|
| Exchanges | **NASDAQ + NYSE only** | Alpha Vantage has no PSE coverage. PSEi survives as a benchmark line, not as tradeable tickers. |
| UIT funds | **Cut from MVP** | No API publishes Philippine UITF NAVPU. Marked optional in the brief; revisit when there is a real source. |
| Top 10 ranking | **Market cap over a hand-curated universe** | Deterministic, one `COMPANY_OVERVIEW` per symbol, and a cap-ranked list does not read as a buy recommendation. |
| Filter tiers | **Descriptive only** | Matches Annex A's beginner state. God-mode toggle ships visibly grayed out. |

### The constraint that shapes everything

**Alpha Vantage has no screener endpoint.** There is no "filter by market cap or
P/E" call. Every filter in Annex A must run as a Postgres query against data we
have already ingested. The stock engine is therefore an *ingestion and caching*
system first and a UI second — which is what the docx's note about "aggregation
functions via Supabase" was reaching for.

### MCP is a development tool, not a runtime dependency

The Alpha Vantage **MCP server** is for Claude to explore data while building —
sanity-checking payload shapes, discovering which fields are populated. The
**running app must not call MCP.** Ingestion calls the plain REST API
(`https://www.alphavantage.co/query?function=…`) from a server-side job. Putting
an MCP client in the request path would add a protocol layer for no gain.

---

## Part 1 — Home Dashboard

Reference: `assets/Papaldo-08.png`. Adopt its information hierarchy; drop its
leaderboard framing (Papaldo is a teaching simulator, not a ranked game).

### Blocking dependency

Phase 1 shipped `users`, `isq_responses`, `risk_profiles`. **None of them hold a
portfolio.** The dashboard cannot show an account value, cash balance, or
allocation-vs-actual until `portfolios` and `holdings` exist. Build the tables
before the UI, or the page stays a placeholder.

### Layout

**Overview card** (top-left)
- Account Value
- Today's Change — peso/dollar amount and percent, colored
- Annual Return
- Buying Power
- Cash
- **Inflation-adjusted Cash** — the one element Investopedia does not have, and
  worth keeping: it is the teaching point. Uses Alpha Vantage `CPI` (US series,
  consistent with the US-only decision). Show the real value beside the nominal
  one, with a tooltip naming the index and base period.

**Performance chart** (top-right, dominant)
- Range tabs: 1W · 1M · 3M · 6M · 1Y
- Benchmark overlay toggle — S&P 500 live via `TIME_SERIES_DAILY_ADJUSTED` on
  `SPY`; PSEi from a hand-seeded monthly table, clearly labelled as such
- `$` / `%` display toggle
- Recharts (already in the stated stack, not yet installed)

**Asset Allocation** (below overview)
- Current actual allocation vs. the ISQ's recommended allocation from
  `risk_profiles.recommended_allocation`. The gap between the two is the product.

**Setup Progress** (right rail, new users only)
- 8 steps, per the docx. Hidden once complete or dismissed.

**Search** — symbol lookup, routes into the Markets page.

### Not in this phase
Order placement, holdings editing, news. Trading is a separate assignment.

---

## Part 2 — Dark Mode

**This is closer than PROGRESS.md suggests.** `src/app/globals.css` already
defines a complete `.dark` OKLCH palette — every token (`--background`,
`--card`, `--primary`, `--sidebar-*`, `--chart-1..5`) has a dark value, and the
`@custom-variant dark (&:is(.dark *))` hook is in place. Nothing needs designing.

Phase 1 disabled dark mode because components used a fixed light palette, which
produced dark-on-dark. The fix is those components, not the theme.

### Work

1. **Theme provider** — `next-themes` with `attribute="class"`,
   `defaultTheme="system"`, and `disableTransitionOnChange`. Wrap in
   `src/app/layout.tsx` with `suppressHydrationWarning` on `<html>`.
2. **Audit for hardcoded colors.** Every `bg-gray-*`, `text-black`,
   `border-gray-300`, and hex literal becomes a token: `bg-card`,
   `text-foreground`, `border-border`. This is the actual work. Start with
   `features/auth/components/*` and `features/onboarding/components/IsqForm.tsx` — Phase 1
   wrote those before shadcn landed.
3. **Toggle** in the dashboard header — light / dark / system, three states not two.
4. **Chart theming** — Recharts does not read CSS variables. Pass
   `--chart-1..5` through explicitly, resolved per theme.
5. **Remove the light-only comment block** in `globals.css` once this lands, and
   update the PROGRESS.md note that calls dark mode deliberate.

### Acceptance
Every route legible in both themes at default and 200% zoom; no flash of wrong
theme on load; the choice survives a refresh.

---

## Part 3 — MVP Stock Engine

### Shape

```
Alpha Vantage REST  →  ingestion job  →  Supabase  →  API routes  →  UI
                       (scheduled)       (cached)     (Postgres      (filters,
                                                       filters)       Top 10)
```

Nothing in the request path calls Alpha Vantage. The UI reads only Supabase, so
page loads stay fast and are unaffected by rate limits or upstream downtime.

### Tables

| Table | Holds | Notes |
|---|---|---|
| `assets` | symbol, name, exchange, asset_type, sector, industry, market_cap, currency | One row per tracked symbol. Fed by `COMPANY_OVERVIEW`. This is what Descriptive filters query. |
| `asset_quotes` | asset_id, price, change, change_pct, volume, as_of | Latest snapshot per symbol. Overwritten each refresh. |
| `asset_price_history` | asset_id, date, open, high, low, close, adj_close, volume | Daily bars for sparklines and the benchmark chart. Append-only. |
| `industry_universe` | industry_key, symbol, rank, curated_by, curated_at | **The hand-curated list.** Carlos supplies the tickers; `rank` is recomputed from `assets.market_cap`. |
| `benchmark_series` | benchmark_key, date, value | SPY live; PSEi hand-seeded. |

RLS: `users`-scoped tables keep the Phase 1 pattern. **Market data tables are
reference data** — readable by `authenticated`, writable only by the service role
that runs ingestion. Do not let a user write to `assets`.

### Rate-limit budget

Free tier is 25 requests/day, 5/minute — not enough. Assuming a premium key:

| Job | Calls | Cadence |
|---|---|---|
| Quote refresh | 1 (`REALTIME_BULK_QUOTES`, 100 symbols/call) | Every 15 min during market hours |
| Fundamentals | 1 `COMPANY_OVERVIEW` per symbol (~70) | Weekly — market cap and sector barely move |
| Daily bars | 1 `TIME_SERIES_DAILY_ADJUSTED` per symbol | Nightly after close |
| Benchmark | 1 (`SPY`) | Nightly |
| CPI | 1 | Monthly |

`REALTIME_BULK_QUOTES` batching 100 symbols is what makes this affordable — one
call covers the entire universe. Design the universe to stay under 100 symbols.

Every job writes an ingestion-run row (started, finished, symbols, errors) so a
silent failure is visible rather than showing stale prices as if they were live.

### Descriptive filters (Annex A, beginner tier)

Straight Postgres `WHERE` clauses over `assets`:
- **Symbol / name** — text search
- **Asset type** — Stock · ETF · Fixed Income · Commodity *(UIT dropped)*
- **Exchange** — NASDAQ · NYSE *(PSE dropped)*
- **Sector / industry**
- **Market-cap band** — Mega / Large / Mid / Small

God-mode checkbox ("Are you the God of Asset Management?") ships **visible but
disabled**, with Financials and Technicals shown grayed. It signals the roadmap
and matches Annex A's beginner state without building either tier.

### Top 10 per industry

Six industry keys: **Tech · AI · Finance · Venture Capital · Logistics · FMCG**,
plus **Top 10 ETFs**.

Ranking is `ORDER BY market_cap DESC LIMIT 10` within `industry_universe`, as a
materialized view or a cached query — recomputed when fundamentals refresh, not
per request.

**Every Top 10 surface carries a disclaimer**: ranked by market capitalisation,
not a recommendation, simulated trading only. This matters more than usual given
Carlos is a Licensed Financial Planner — a ranked equity list from a licensed
professional's app invites being read as advice.

---

## News budget — locked 2026-09-11

Two caps, because two different readers consume the same feed and want
opposite things. Finnhub is the only news source (Alpaca supplies prices,
symbols and assets).

| Consumer | Cap | Window |
|---|---|---|
| Symbol page, dashboard — what a person reads | **4 per ticker per week** | 28 days |
| Advising engine — what the model summarises | **4 per ticker per day**, when rate limits allow | 7 days |

Carlos's reasoning: a person on a symbol page wants the week's signal, not a
feed — four a day was still too much to look at. The advising engine is not
reading, it is summarising, so more input is better input and the only real
ceiling is what the API permits.

Both live in `features/markets/api/news.ts` as `getSymbolNews` (display) and
`getSymbolNewsForAnalysis` (engine). They are kept in one module on purpose:
the numbers are a product decision, and splitting them across files is how they
drift apart.

**Implementation note that cost a bug.** Buckets key on the *local* date, not
`toISOString()`. Those look equivalent and are not: the list renders
`toLocaleDateString()`, so a story filed in the New York evening lands on the
next UTC day. Bucketing by UTC let seven headlines through a cap of four under
a single visible date, observed on AAPL 2026-09-11. The week bucket is
Monday-anchored so a cap cannot reset mid-week.

---

## Resolved since this document was written

- **Item 1, the ticker universe, is no longer needed.** `/markets` browses
  Alpaca's own catalogue — 8,515 active tradable NASDAQ/NYSE equities as of
  2026-09-11 — with server-side search. Sourcing the universe from the venue
  that prices the simulated fills guarantees every symbol shown is one an order
  can actually be placed against, which a hand-curated list cannot.
- **Item 3, the Alpha Vantage tier, is moot.** Alpha Vantage was never
  adopted. Finnhub replaced it on 2026-09-10, and Alpaca replaced Finnhub for
  prices and history on 2026-09-11.
- **Item 4, starting cash: $500,000 USD**, seeded at signup by
  `on_auth_user_created_portfolio`.
- **Item 5, currency: USD throughout.** A PHP display toggle needs an FX rate
  from somewhere other than Alpaca — `/v1beta1/forex/latest/rates` answers 403
  on this account.

Items 2 (the "AI" and "Venture Capital" pseudo-sectors) stays open, and is now
purely a question about the Top 10 per industry surface.

---

## Open — needed before build

1. **The ticker universe.** ~60 symbols across six industries, plus ~10 ETFs.
   Only Carlos can supply this; it is the editorial core of the product.
2. **"AI" and "Venture Capital" are not sectors.** `COMPANY_OVERVIEW` returns
   GICS-style sectors, and neither exists there. AI companies classify as
   Technology; VC has no clean public-equity analogue (BDCs and asset managers
   are the closest). These two need either an explicit ticker list or a rename.
3. **Alpha Vantage tier.** Which premium plan? It sets the refresh cadence, and
   the free tier cannot run this.
4. **Starting cash** for a new simulated portfolio. Investopedia uses $100,000.
5. **Currency.** Docx says USD *or* PHP. US-only equities means USD throughout
   is simplest; a PHP display toggle needs an FX rate (`CURRENCY_EXCHANGE_RATE`).
