# features/dashboard

Home (`/dashboard`) and `/portfolio`. Redesigned 2026-09-25 from Carlos's
mockups; the previous single-column dashboard is in git history.

## What's real

Everything. Nothing on either page is sample data.

- **Total Holdings** — cash from `portfolios` plus every holding priced at its
  own live Alpaca quote (`api/valuation.ts`). Positions without a quote are
  carried at cost and the card says why. The percentage is today's move.
- **Risk Appetite** — `risk_profiles.band`, shown as Conservative / Moderate /
  Aggressive. The quiz opens behind an intro dialog; "Maybe later" is allowed.
- **Markets** — today's gainers and losers from the 41-name buyable universe
  (`markets/api/movers.ts`), so every name shown can be bought.
- **My Portfolio** — the four largest positions; "See all" opens the sector
  pie and top holdings.
- **Performance** — rebuilt from the account's own fills and daily closes
  (`portfolio-math.ts#reconstructHistory`). No history is stored, so none is
  invented: the line starts on the day the account opened. There is no 1D
  range, since daily closes cannot draw an intraday line.

## Not built

- Inflation-adjusted value (mockup, Portfolio page): needs a Philippine CPI
  series and no wired provider has one.
- "Complete your user profile" button: the middleware makes a complete
  profile a precondition for reaching the dashboard, so it could never show.

## Layout

```
features/dashboard/
  portfolio-math.ts       pure valuation, allocation, history reconstruction (tested)
  api/valuation.ts        live pricing + fills/bars fetch for the above
  components/
    panels.tsx            async server wrappers streamed behind Suspense
    TotalHoldingsCard  RiskAppetiteCard  MarketMoversCard
    PortfolioPreview   AllocationPie     PerformanceChart   PositionsTable
  pages/
    dashboard.page.tsx
    portfolio.page.tsx
```
