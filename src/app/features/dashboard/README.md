# features/dashboard

Home dashboard, built 2026-09-10. Reads a real (always-empty-for-now)
portfolio from `portfolios`/`holdings`, plus live Finnhub quotes and market
news.

## What's real vs. what's placeholder

- **Portfolio (`api/portfolio.ts`)** — real. Every account has exactly one
  `portfolios` row, seeded with a $500,000 USD demo cash balance by the
  `on_auth_user_created_portfolio` trigger at signup (see
  `supabase/migrations/*_portfolios_and_holdings.sql`). `holdings` is a real
  table, currently always empty: there is no order-placement feature yet to
  write to it. Nothing in this feature fabricates a position — the empty
  state is shown honestly in `HoldingsList`.
- **Market data (`api/market.ts`, `core/services/finnhub.ts`)** — real,
  live Finnhub calls (`quote`, `news`), not cached/ingested. `WATCHLIST_SYMBOLS`
  is a starter 7-symbol list (AAPL/MSFT/NVDA/AMZN/GOOGL/TSLA/META), **not**
  the ~60-symbol curated universe REQUIREMENTS.md's Phase 3 stock engine
  calls for — that list is still Carlos's editorial call
  (REQUIREMENTS.md "Open — needed before build," item 1). This is a
  deliberately smaller, simpler thing: on-demand Finnhub `quote()` calls per
  page load, not the ingestion-job/Supabase-cache architecture REQUIREMENTS.md
  Part 3 specs for the Markets page's full universe and filters. The two are
  additive, not in conflict — this dashboard doesn't block that pipeline
  from being built later, and shouldn't be treated as having replaced it.

## Not built here

- Trading / order placement — still non-MVP, per the original scope.
- The Phase 3 ingestion pipeline, `assets`/`asset_quotes`/`asset_price_history`
  tables, and Descriptive/Financials/Technicals filters — untouched.
- A "Performance chart" over time was deliberately left out of this pass:
  with holdings always empty and no trade history, a time-series chart would
  either be flat (uninformative) or fabricated. Add it once there's a real
  trade history to plot.

## Layout

```
features/dashboard/
  api/
    portfolio.ts   Supabase reads: portfolio + holdings for the signed-in user
    market.ts      Finnhub reads: watchlist quotes, general market news
  components/
    OverviewCard.tsx      account value / cash / buying power / positions
    AllocationDonut.tsx   cash vs. holdings, Recharts pie via components/ui/chart
    HoldingsList.tsx      table or honest empty state
    WatchlistStrip.tsx    live quotes for the 7-symbol starter watchlist
    MarketNews.tsx        live general market news
  types.ts         re-exports for component props
```

Rendered from `src/app/features/dashboard/pages/dashboard.page.tsx`, an async Server Component
that calls these `api/` modules directly (not via `fetch()` to `src/app/api/*`
— that indirection is for Client Components; Server Components importing a
server-only feature module directly is the established pattern here, same as
the Phase 1 dashboard placeholder and `/isq`).
