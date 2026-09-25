# Progress

Running log for the Papaldo build. Newest phase at the top. See `CONTEXT.md` for
domain vocabulary and architecture rules.

---

## Phase 5 — Dashboard redesign, app shell, peso toggle (2026-09-25)

Built from Carlos's mockups (Home, See-all dialog, Settings menus, quiz
intro) with Helios/ForexDrift as reference only.

**Environment.** This clone had no `node_modules` and no `.env.local`.
Supabase URL + publishable key were restored from the Supabase MCP;
`EXCHANGE_RATE_APIKEY` added. **`ALPACA_*` and `FINNHUB_API_KEY` are
still blank locally** — every market panel shows its "not configured" state
until they are pasted back.

**New:**
- `features/shell` — floating collapsible sidebar (Home, Portfolio, Market,
  Tools "Soon", About), random per-request greeting, notification bell
  (the user's own fills; unread = newer than last opened), settings gear
  (Profile dialog, Themes: mode / palette / font, Language), user card or
  Log in / Sign up when signed out. Wraps dashboard, portfolio, markets and
  symbol pages.
- `features/preferences` — Zustand store persisted to localStorage
  (`skipHydration` + rehydrate on mount, so no hydration mismatch),
  `<Money>` for every on-screen amount, copy dictionaries in English /
  Slang / Brainrot for shell, dashboard and markets. Disclaimers and errors
  stay plain English in every register.
- `core/services/exchange-rate.ts` — ExchangeRate-API USD→PHP, cached 6h.
  Errors come back as HTTP 200 + `result: "error"`; tested.
- Palettes: forest (default, dark-first — `defaultTheme` is now `dark`),
  orchid, midnight, each light + dark, plus `--gain/--loss/--highlight`.
- Dashboard: Total Holdings (live-priced, $/₱), Risk Appetite + quiz intro
  dialog, Markets gainers/losers, My Portfolio tiles + See-all dialog
  (sector pie, top holdings), Performance chart.
- `/portfolio` — detailed total, performance, positions table, sector
  allocation, order history. Added to middleware protection.
- `/markets` — benchmark ETFs, the 41-name buyable universe with trend
  lines and sector filter, top gainers/losers, sector heatmap, then the
  catalogue search and news.

**Performance history is reconstructed, not stored.** Starting cash is
today's cash with every fill undone; each day replays fills and prices
holdings at that day's close. `portfolio-math.ts`, hand-worked tests.

**Fixed on the way:** `safeEnd()` in `alpaca.ts` produced a
millisecond-unique URL, so Next's data cache never hit on any bars request.
Now floored to 15 minutes. Holdings used to be priced only if they were on
the watchlist; they now get their own quotes.

**Deliberately not built:** Supabase Realtime tickers (prices come from
Alpaca; nothing writes quotes to Supabase for a channel to carry), 1D range
(daily closes cannot draw it), inflation-adjusted value (no PH CPI source),
"Complete your profile" button (middleware makes it unreachable), Tools page.

**Open for Carlos:** add `EXCHANGE_RATE_APIKEY` to Vercel; paste Alpaca and
Finnhub keys into `.env.local`; the FX key came through chat, rotate it when
convenient.

**Same day, second pass (Carlos's review):**
- **Framed layout.** The app now sits in one rounded container (max 1440px)
  with the page background around it, after the Helios reference; the
  content scrolls inside the frame. Type scale cut to 12/13/14/16/20/28px,
  and inside the shell the root size scales with the viewport (13.5–15px).
  Figures use tabular digits in the UI face; Geist Mono made large amounts
  far wider than their labels.
- **"Finnhub returned an error" on a price was wrong twice over.** Prices
  are Alpaca. `getSymbolOverview` rethrew a failed quote as a plain Error,
  collapsing "not configured" into "upstream-error", and
  `marketUnavailableMessage` defaulted its provider to Finnhub. Both
  fixed; the provider argument is now required so it cannot recur.
- A missing key now logs a warning, not an error, so the dev overlay
  stops counting it as an issue.
- The performance line marks each position to its latest fill between
  bars (it used the first fill, which drew a dip nothing caused), and the
  y-axis keeps at least 2% headroom so small moves look small.

**Third pass (Carlos's review, same day):**
- **Equal gap** on all four sides of the frame (`--frame-gap`, 12–40px by
  viewport), no narrow max-width forcing wide side margins.
- **Logos** everywhere a ticker appears, via `SymbolMark` on the shadcn
  Avatar: FMP's public image path, loaded by the browser, monogram fallback
  on 404. See EXTERNAL_SERVICES.md.
- **Route skeletons.** `AppShell` moved from the pages into per-route
  `layout.tsx` files so each route's `loading.tsx` renders *inside* the
  frame. Skeletons mirror each page's layout, with a shimmer on the shadcn
  Skeleton. The sidebar's collapsed state is now read back from its cookie,
  since each route layout remounts it.
- **Click feedback.** A lime progress bar and a progress cursor from the
  moment a link is clicked until the URL changes; a Spinner on the sidebar
  item being loaded (`useLinkStatus`).
- **Markets:** benchmarks are compact tiles in one card (2×2 on a phone)
  with an arrow CTA to the trade page. The universe table scrolls inside an
  ~8-row window on every filter, header pinned, with a jump-to-end /
  back-to-top button; on a phone rows collapse to logo, ticker, price with
  change beneath, and an arrow.
- **Forest dark deepened**: near-black green page, low-chroma layers a step
  apart, lime the only saturated colour.
- **Header:** the greeting is Home-only; other pages show their name
  (Markets / Portfolio / Trade, with slang and brainrot versions). The
  greeting holds for a five-minute window from sign-in and changes on a new
  login — derived from the JWT's `session_id` and `amr` timestamp, so no
  cookie and no hydration flash. Per-register pools plus a rare easter-egg
  line (~1 window in 40).

Typecheck clean, lint clean (two pre-existing warnings), 51 tests pass,
production build green on 20 routes.

---

## The ISQ stops being a gate (2026-09-11)

Carlos's call: a new account should land on the dashboard and be *invited* to
the questionnaire, not held at it.

**Routing.** The middleware no longer redirects to `/isq`, `sign-up` now
returns `next: 'dashboard'`, and `resolveOnboardingStep` no longer consults
`risk_profiles` at all. `'isq'` is gone from the `OnboardingStep` union and
from `ONBOARDING_PATHS` rather than left as a dead member that invites
reintroduction. `/isq` stays reachable, first time or retake.

Completing the profile is still forced, and is now the only forced step. That
one stays because the app cannot address a user it has no username for.

**Dashboard.** "My Assets" has three distinct empty states instead of one, on
the grounds that "no positions" means different things:

| State | Shows |
|---|---|
| No risk profile | **Discover your Risk Appetite** button to `/isq` |
| Profile taken, no positions | Browse markets |
| Has positions | The table |

The allocation donut greys out until the questionnaire is taken — muted token
plus 35% opacity rather than a second palette, so dark mode needs no separate
muted set. The percentages stay readable underneath, because the split really
is accurate without a risk profile; grey signals "not tailored yet", not
"unknown".

The bottom-of-page questionnaire link is now retake-only. Two calls to the
same action on one screen compete with each other.

**Also fixed: stale copy.** "My Assets" still said *"Trading (order placement)
is a later phase"* — untrue since Phase 4 shipped earlier the same day.

**Verified against a production build with real sessions**, both states, using
a throwaway account created through the app's own sign-up route and deleted
after: sign-up returns `dashboard`; the no-profile dashboard shows the CTA, the
"Not assessed" badge and the greyed donut with no duplicate CTA and no stale
copy; after inserting a risk profile the same account shows Browse markets, a
coloured donut, the band badge and the retake link. `/isq` returned 200
throughout. No orphan rows; Carlos's account untouched at $500,000.

---

## Load-time fix: local JWT verification (2026-09-11)

Carlos reported slow loads on login and the dashboard. It was not Next.js.

**Diagnosis.** Supabase is in Seoul, Vercel functions were in Washington DC,
and `auth.getUser()` is a network round trip to `/auth/v1/user` on every call
— measured at 0.6-1.0s from here, with the TLS handshake alone around 0.2s.
One dashboard render paid that four times: once in middleware, then again in
`getProfile`, `getCurrentRiskProfile` and `getPortfolio`, each asking
independently. Roughly 2.5-4s of pure identity checking before a single row
was queried.

The clearest evidence: `/login` is a **prerendered static page** and still
took 2.25s on a production build. All of it was middleware.

**Fixed, all six:**
1. **`getClaims()` replaces `getUser()`.** The project signs with ES256 —
   confirmed by fetching its JWKS endpoint — so the JWT verifies locally
   against a cached key set with no network call. It still calls `getSession()`
   internally, so expiring tokens still refresh and the cookie still rotates;
   read the auth-js source before changing this.
2. **One cached resolver.** `core/services/supabase/session.ts` wraps it in
   React `cache()`, so four asks per render became one.
3. **Middleware matcher narrowed** to the protected prefixes and the two auth
   routes. The landing page, `/markets` and every symbol page were paying for
   a session check nothing read.
4. **Dashboard waterfall merged** into one `Promise.all`.
5. **Market panels stream behind Suspense.** Everything the database knows
   paints immediately; Alpaca and Finnhub fill in behind skeletons. The three
   quote-dependent cards share one boundary so a total never appears before
   the allocation explaining it, and `getWatchlistQuotes` is `cache()`d so two
   panels share one request.
6. **`vercel.json` pins functions to `icn1` (Seoul).** Next to the database
   and much closer to Philippine users. Market data gets farther away, which
   no longer blocks a render now that it streams. **Takes effect on next
   deploy.**

**Measured on a production build, same machine:**

| Route | Before | After |
|---|---|---|
| `/login` | 2.25s | 0.20s first, 0.01s warm |
| `/markets/AAPL` | 2.25s | 1.05s first, 0.36s warm |
| `/` | — | 0.01s |
| `/dashboard` (real session) | — | 1.6s first, ~0.9s warm |

**Verified with a real session, not just a compile.** A throwaway account was
created through the app's own sign-up route, given a risk profile, used to
load `/dashboard`, then deleted; no orphan rows remain and Carlos's account is
untouched at $500,000 / 0 holdings / 0 orders.

That also closes a long-open item: **the `on_auth_user_created_portfolio`
trigger had never actually fired.** It did here, seeding $500,000 USD on a
genuine signup, alongside the profile row.

---

## Phase 4 — Buy/sell orders (2026-09-11)

Simulated trading works end to end. Open a symbol, place a buy or a sell,
watch cash and holdings move, see the fill in order history.

**Database (applied live via Supabase MCP, mirrored to
`supabase/migrations/20260911140000_orders_and_place_order.sql`):**
`holdings.asset_class`, an append-only `orders` table, and `place_order()` —
one `SECURITY DEFINER` function with `search_path` pinned empty that is the
*only* write path to a balance or a position. `authenticated` gets `EXECUTE`
on it and no INSERT/UPDATE/DELETE grant on `portfolios`, `holdings` or
`orders`. RLS on `orders` is read-your-own.

**Verified against the live database inside a rolled-back transaction**, so
Carlos's account never moved ($500,000, 0 holdings, 0 orders, confirmed after):
buy 10 @ 326.07 then 5 @ 300 gave a weighted average of 317.38 and correct cash
at each step; oversell raised PA002; overspend raised PA001; selling the whole
position deleted the holding row rather than zeroing it, which `quantity > 0`
requires.

**App:** `features/trading/` with `api/orders.ts`, `schema.ts`, `types.ts`,
`OrderTicket` and `OrderHistory`, plus `POST /api/trading/orders`. The order
ticket is on the symbol page, history is on the dashboard.
`api/portfolio.ts` moved from `dashboard` to `trading` — trading owns the
money, the dashboard reads it.

**The request body carries no price.** The route reads a live Alpaca quote
server-side, because a price the browser supplies is a price the browser
picked. The ticket shows an estimate and says so; the confirmation reports the
real fill.

**News caps changed (Carlos, 2026-09-11), recorded in REQUIREMENTS.md:**
display is now **4 per ticker per week**, down from 4 a day. The advising
engine gets **4 per day** when rate limits allow, via
`getSymbolNewsForAnalysis` — not wired to anything yet, since `claude.ts` still
has no caller.

**One performance bug found in the server logs, not the UI.** Alpaca's asset
catalogue is 8.5MB, and Next's data cache silently refuses anything over 2MB —
so `/markets` was re-downloading the whole thing on every request and logging a
cache-write failure each time. Per-exchange requests do not help (NASDAQ alone
is 2.5MB). Fixed by opting the raw fetch out of the cache and wrapping the
*trimmed* result in `unstable_cache` instead: seven fields per asset, a few
hundred KB. Cold load 18.6s, warm 1.9s.

**Known gap, deliberately left open:** `place_order` is reachable directly at
`/rest/v1/rpc/place_order` with a caller-chosen `p_fill_price`. The route
always passes a real quote, but the route is not the only way in. Blast radius
is the user's own simulated balance, since RLS scopes everything to the caller.
Closing it means either a service-role client in the route (adds a powerful key
to the environment) or a server-recorded quotes table to validate against.
Carlos's call. Supabase's security advisor flags the same function.

---

## Provider split: Alpaca prices, Finnhub news (2026-09-11)

Carlos's assignment: **Alpaca is the master stock engine** (symbols, assets,
prices, and later the buy/sell orders); **Finnhub is the news feed**, capped at
four headlines a day.

**`/markets` is a real page now.** It was still the hardcoded `SAMPLE_DATA`
table of DJI/SPX/IXIC with an Alpha Vantage note. Replaced with a featured row
of eight live quote cards, each carrying a Lightweight Charts sparkline over
six weeks of real Alpaca bars, above a searchable table of the tradable
catalogue. Nothing on the page is typed into the repo any more: 8,515 active
tradable NASDAQ/NYSE equities come from Alpaca's own `/v2/assets`.

That also closes an open REQUIREMENTS.md item. The "~60-symbol curated
universe" Carlos was being asked for is unnecessary — sourcing the universe
from the venue that will price the simulated fills guarantees every symbol
shown is one an order can actually be placed against.

**Finnhub's `/quote` is no longer called anywhere.** The watchlist, the symbol
header and the day's range all read Alpaca snapshots. One snapshot request
answers the whole watchlist, where Finnhub's plan had no batch quote and cost
one call per symbol with a rate limit that could blank the strip.

**Search runs server-side.** The catalogue is thousands of entries, so
`/markets` filters on the server behind a plain GET form. Results are linkable
and it works without JavaScript.

**Built:**
- `alpaca.ts` gains `getSnapshot(s)`, `getAsset`, `listTradableAssets`.
- `features/markets/api/{quotes,assets,news}.ts`; `symbol.ts` reworked.
- `components/{QuoteCard,Sparkline,AssetTable}.tsx`.
- `AlpacaQuote` is now the one quote type; `FinnhubQuote` is unused.

**One documented exception to "Finnhub = news only."** The three research cards
— logo and industry, valuation ratios, analyst coverage — have no Alpaca
equivalent at any plan level, and Alpaca's `/v1beta1/logos` answers 403 here.
They stay on Finnhub rather than being deleted on an inferred reading. Say the
word and they come out; it is three card deletions, not an untangling.

**Two bugs caught by running it, not by compiling it:**
1. **The four-a-day news cap let seven through.** It bucketed by
   `toISOString()` (UTC) while the list renders `toLocaleDateString()` (local),
   so stories filed in the New York evening counted against the next UTC day.
   Now buckets by local date: 4 / 4 / 4 across three days, verified.
2. **Scope note in `alpaca.ts` was about to become a lie.** The asset
   catalogue is only served by the trading host, so the file's "data host and
   nothing else" claim was rewritten rather than quietly contradicted. The real
   line is narrower and now stated: no endpoint reads or writes an order, a
   position or a balance.

Typecheck clean, lint clean but for one pre-existing unused import, 23 tests
pass, build green on 18 routes.

---

## Alpaca wired, mock candles deleted (2026-09-11)

Carlos supplied Alpaca paper-account credentials. Probed against the live API
before building anything on them, which changed the plan in two ways.

**Real price history exists after all.** `GET /v2/stocks/{symbol}/bars` and the
crypto equivalent both answer 200 with full daily OHLCV. That was the single
gap `candles.mock.ts` existed to paper over, so the file is **deleted** and
every "Sample data" notice with it. Verified end to end: the rendered page now
carries the same closes the API returns directly (326.57 / 315.34 / 316.22 for
AAPL), and dates run through today.

Yesterday's caution about the free plan being IEX-only did not hold for this
account. Daily bars come back at consolidated-tape scale (70.2M shares across
1.2M trades for AAPL), and an explicit `feed=sip` request returns 200 with
identical numbers.

**Forex is not available.** `GET /v1beta1/forex/latest/rates` answers 403,
`forbidden: insufficient grants`. The PHP display conversion needs its own
provider; the Phase 4 plan should stop treating Alpaca as a fallback for it.

**Built:**
- `core/services/alpaca.ts` — server-only, `AlpacaError` with a `reason`,
  `getDailyBars`, `getLatestPrice`. Market-data host only; the paper-trading
  host is never called and the reason why is written into the file.
- `features/markets/api/candles.ts` replaces `candles.mock.ts`.
- `api/result.ts` and `market-status.ts` now span both providers, and failure
  copy names which one failed.
- `TRADING_API.md` — every endpoint in both directions, live and planned.

**Three traps recorded in code so nobody re-derives them:** equity bars return
a flat array while crypto returns an object keyed by pair; equity bar
timestamps are New York session midnight in UTC while crypto is true UTC
midnight, so parsing into a local Date shifts US sessions a day; and the free
plan forbids querying the last 15 minutes, so requests end the window 16
minutes back rather than failing every weekday morning.

**Open before Phase 4:**
- Quote latency during market hours is untested — both probes ran with US
  markets closed. Confirm before making Alpaca the fill-price oracle, since
  Finnhub's quote is already live and already wired.
- `ALPACA_API_KEY_ID` / `ALPACA_API_SECRET_KEY` are in `.env.local` and
  documented empty in `.env.example`. **Not yet in Vercel.** Same two-places
  rule that left the dashboard dead on Finnhub for a session.
- The credentials came through chat, so rotate them once Phase 4 lands.
- No database work has been done. `orders`, `holdings.asset_class` and
  `place_order()` are all still unapplied.

---

## Symbol detail page (2026-09-10)

Clicking a watchlist tile on the dashboard now opens `/markets/<symbol>` — a
per-symbol page built on TradingView Lightweight Charts v5.2.1.

**What is real, and what is not.** Everything on the page is live Finnhub
except the price history. Probed against the live API with the project key:
`/quote`, `/stock/profile2`, `/stock/metric`, `/company-news` and
`/stock/recommendation` all answer 200; **`/stock/candle` answers 403** on this
plan, and so does `/crypto/candle`. There is no historical OHLC series to
draw. The endpoint table is recorded in `core/services/finnhub.ts` so nobody
re-derives it.

Carlos's call: ship a mock chart now, wire a real provider later (Alpaca is
the candidate). `features/markets/api/candles.mock.ts` holds the whole of it,
named so it cannot be mistaken for real data, with swap-in instructions at the
top. Two things keep it honest while it lasts — the last candle is the real
one from `/quote` (so the chart's right edge agrees with the price in the
header), and the walk is seeded from the symbol (so a ticker always draws the
same history rather than reshuffling per reload). Every surface that renders
it is labelled "Sample data", following the `SAMPLE_DATA` precedent on
`/markets`.

The quarterly-earnings chart underneath it **is** real dated history — the
only kind this plan serves — capped at 24 quarters because Finnhub returns 149
for AAPL, back to 1989.

**Built:**
- `core/services/finnhub.ts` — `getCompanyProfile`, `getBasicFinancials`,
  `getCompanyNews`, `getRecommendations`, plus a per-call revalidate window
  (an hour for reference data, 30s for quotes).
- `features/markets/api/{symbol,result,candles.mock}.ts`.
- `features/markets/components/` — `PriceChart` (candlesticks + 1M/3M/6M/1Y),
  `EarningsChart` (per-bar coloured histogram), `SymbolHeader`, `KeyStats`,
  `AnalystRatings`, `SymbolNews`, `use-chart-theme`.
- `features/markets/pages/symbol.page.tsx` + `src/app/markets/[symbol]/page.tsx`.
- Watchlist tiles on the dashboard are now links.

**Three real bugs found by running it, not by compiling it:**
1. **Lightweight Charts cannot parse `oklch()`.** Its own colour parser takes
   hex, rgb/rgba, hsl/hsla and named colours only, so feeding it the project's
   OKLCH tokens threw "Failed to parse color" and killed the page. The tokens
   are still the single source of truth; `use-chart-theme.ts` resolves each one
   to RGB by painting a 1x1 canvas and reading the pixel back, which also means
   dark mode needs no second palette.
2. **A visible range set in the same commit as `setData` is discarded** by the
   chart's own initial fit pass — the chart opened on the full year no matter
   which range button was active, then behaved correctly on every later click.
   Fixed by feeding the series only the selected slice instead of windowing.
3. **`fitContent()` before the chart knows its width** crams the bars into a
   fraction of the canvas. Both charts now also refit on
   `timeScale().subscribeSizeChange`, which doubles as resize handling.

Also fixed on the way through: the dashboard's market panels used to report
every failure as "Finnhub did not respond". They now carry a `FinnhubFailure`
reason (`not-configured`, `unauthorized`, `rate-limited`, `network-error`,
`upstream-error`) and say which one it was — outside production the
not-configured message names the environment variable. `getQuotes` settles
per symbol rather than all-or-nothing, so one bad ticker no longer blanks the
whole watchlist. `finnhub.test.ts` covers the classification, including that
the API key never appears in an error message. 23 tests pass.

**Open:** `FINNHUB_API_KEY` is set in `.env.local` and in the Vercel project
environment (Carlos, 2026-09-10) — the dashboard shows live quotes and news.
`NEXT_PUBLIC_SITE_URL` is still `http://localhost:3000` locally, and Google
sign-in still needs the provider enabled in the Supabase dashboard.

---

## Feature-folder restructure (2026-09-10)

Carlos's call: the route tree was too bloated. Pages now live with the feature
that owns them, and `src/app/` holds nothing but routing.

- **Route groups dropped.** `(app)/` and `(auth)/` are gone; each route is a
  plain folder — `login/`, `sign-up/`, `dashboard/`, `isq/`, `markets/`,
  `onboarding/profile/`. Route groups affect no URLs, so this changed none.
- **Every `src/app/**/page.tsx` is now a thin adapter**: import the feature
  page, export `metadata`, render it. No logic, no data fetching.
- **Feature pages are `features/<name>/pages/<name>.page.tsx`.** The `.page.tsx`
  suffix matters — a file literally named `page.tsx` under `src/app/features/`
  is published by the App Router as a `/features/...` route. Three such files
  existed mid-restructure and were serving `/features/auth`, `/features/isq`
  and `/features/markets`; they are removed.
- **`features/isq` folded into `features/onboarding`**, which now owns both
  screens a new account walks through: the ISQ (`questions.ts`, `scoring.ts`,
  `scoring.test.ts`, `types.ts`, `api/submit.ts`, `components/IsqForm.tsx`)
  and profile completion (`pages/profile.page.tsx`,
  `components/CompleteProfileForm.tsx`).
- **`features/markets` created** from the loose `src/app/markets/page.tsx`. Its
  contents are unchanged and still hardcoded sample figures, not market data.
- **Cross-feature imports are one-directional.** `onboarding` and `dashboard`
  may import `auth`; `auth` imports neither. That is why `api/profile.ts` and
  `routes.ts` stayed in `auth` rather than moving to `onboarding` — `AuthResult`
  embeds `OnboardingStep`, so auth has to own that vocabulary.
- Empty `hooks/` and `api/` folders were not created for features that have
  nothing to put in them. `auth/hooks/use-form-submit.ts` is the only hook.

Pure move plus import rewrite, no behaviour change. `npm run typecheck` clean,
`npm run lint` clean but for two pre-existing unused-import warnings, `npm test`
12/12, `npm run build` green on the same 18 routes as before.

---

## Phase 2 follow-up — dashboard triage (2026-09-10)

Carlos reported the deployed dashboard showing "No portfolio found for this
account", both Finnhub panels degraded, and console errors on
`/api/auth/oauth/google` and `/api/auth/login`. Four separate causes, traced
against the live Supabase project (`ettgbzgdtvmfbqrdtjzb`) via MCP.

**1. "No portfolio found" — fixed.** `on_auth_user_created_portfolio` fires
on `INSERT` into `auth.users` only. The single existing account was created
2026-08-28, twelve days before the trigger existed, so it never had a
`portfolios` row: 1 user, 0 portfolios. Fixed by
`supabase/migrations/20260910140000_backfill_portfolios_for_existing_users.sql`,
applied live via MCP — an idempotent insert-where-missing that leaves
`cash_balance`/`currency` to the table DEFAULTs so the $500,000 figure stays
defined in exactly one place. Verified after: the account now holds
500000.00 USD.

The dashboard's fallback copy told users to sign out and back in, which
could never have helped — the trigger is on signup, not sign-in. Rewritten
to say what is actually true.

**2. Finnhub panels degraded — root cause found, needs Carlos.**
`FINNHUB_API_KEY` is absent from `.env.local` entirely, contradicting the
Phase 2 note above which recorded it as added. `apiKey()` throws, both
`Promise.allSettled` branches reject, and the page renders its degraded
state exactly as designed. A commented placeholder line is now in
`.env.local`; the value itself is still Carlos's to paste. **The screenshot
came from the Vercel deployment** (Supabase auth logs show the vercel.app
referer), so the key has to be set in the Vercel project's environment as
well — `.env.local` is gitignored and never reaches the deployment.

**3. `/api/auth/oauth/google` 500 — real, needs a Supabase dashboard
change.** Supabase auth log, 13:07:45Z: `GET /authorize` → 400,
`provider is not enabled`, `validation_failed`. Google is not turned on
under Authentication → Providers in the Supabase project. The app code is
fine; `getGoogleAuthUrl` maps any Supabase error to `ok: false`, the route
returns 500, and `GoogleButton` does surface the message to the user.
Related latent bug: `NEXT_PUBLIC_SITE_URL` is `http://localhost:3000`, so
even once Google is enabled the deployed redirect target will point at
localhost unless Vercel sets its own value.

**4. `/api/auth/login` 401 — not a bug.** Auth log, 13:40:27Z:
`invalid_credentials`, a genuinely wrong password. Two successful logins
followed at 13:41:19Z and 13:41:25Z. The 401 is `login/route.ts` doing its
job; it only appears in the screenshot because the console had preserve-log
on across the navigation.

**Console noise, not ours:** the `MaxListenersExceededWarning` and
`ObjectMultiplex` lines come from a wallet browser extension's
`contentscript.js`. The `reportAllChanges` / `startTime` TypeError is a
web-vitals script injected by Vercel, not a dependency of this project —
nothing in `package.json` pulls in `@vercel/speed-insights`.

---

## Phase 2 — Home dashboard (2026-09-10)

**Status: built this session.** `features/dashboard` is no longer empty.
`/dashboard` now shows a real portfolio (cash balance + holdings, both from
the database) alongside live Finnhub market data. Not run through
`npm run lint`/`typecheck`/`test`/`build` from this session — see "Not
verified" below.

**Decisions made, not invented:**
- **Market data provider: Finnhub, not Alpha Vantage.** Carlos's call
  (2026-09-10), reversing the Phase 3 REQUIREMENTS.md plan: Finnhub's free
  tier (~60 req/min) makes on-demand real-time quotes viable without an
  ingestion job, unlike AV's free tier (25/day). See the vault's
  `wiki/concepts/finnhub-api-integration.md` for the full evaluation this was
  based on, including the still-open question of Finnhub's free-tier
  personal/non-commercial-use clause, and the fact Finnhub has no CPI series
  (AV's `CPI` endpoint is the only source for that, if inflation-adjusted
  cash is ever built).
- **`FINNHUB_API_KEY` documented** (empty) in `.env.example`, server-only,
  not `NEXT_PUBLIC_*`. **Correction (follow-up session):** it was never
  actually written to `.env.local` — see the follow-up section above. The
  placeholder line is there now; the value is still Carlos's to paste.
- **Starting demo balance: $500,000 USD, cash only.** Carlos's call
  (2026-09-10). Resolves the "starting cash" and "currency" open items from
  REQUIREMENTS.md Part 3 for this account-level balance — does **not**
  resolve REQUIREMENTS.md's own starting-cash question for the eventual
  Trading feature if that ends up different; flagging the two as related but
  not automatically the same decision.
- **`portfolios` + `holdings` tables built and migrated** (Supabase MCP,
  `apply_migration` — applied directly, then mirrored to
  `supabase/migrations/20260910120000_portfolios_and_holdings.sql`).
  `on_auth_user_created_portfolio` trigger seeds every new signup with the
  $500,000 balance. RLS: read-only for `authenticated` on both tables (own
  row via ownership predicate / portfolio join) — no INSERT/UPDATE/DELETE
  grants, since nothing should let a user edit their own balance or invent a
  holding; the trigger is the only write path today, same reasoning as
  `risk_profiles`' upsert-only pattern. `get_advisors` (security) run after:
  clean, no new findings (the one WARN present — leaked password protection
  — predates this change).
- **`holdings` seeded with zero rows, deliberately.** Carlos said "no
  mockups on stock data." Trading (order placement) doesn't exist yet, so
  fabricating starter positions would itself be a mock. Every account shows
  100% cash until a real Trading feature exists to place a position.
- **Watchlist is 7 hardcoded symbols** (AAPL/MSFT/NVDA/AMZN/GOOGL/TSLA/META),
  not the ~60-symbol curated universe REQUIREMENTS.md Part 3 still needs from
  Carlos. Chosen only so this dashboard has real quotes to show today — swap
  in the real universe once supplied, don't grow this list by guessing.
- **No performance-over-time chart in this pass.** With holdings always
  empty and no trade history, a time-series line would be flat or fabricated
  either way. Left out rather than faked; add it once there's a real trade
  history.
- **This is on-demand quotes, not the Phase 3 ingestion pipeline.**
  `core/services/finnhub.ts` calls Finnhub directly per page load (30s
  revalidate window), server-side only. `assets`/`asset_quotes`/
  `asset_price_history` and the Postgres-filter architecture in
  REQUIREMENTS.md Part 3 are untouched — this doesn't replace that plan, it's
  a smaller, additive thing built for a simple dashboard.

**Built:**
- `src/app/core/services/finnhub.ts` — server-only client, `getQuote`,
  `getQuotes`, `getMarketNews`. Same shape as `claude.ts`: throws loudly if
  `FINNHUB_API_KEY` is missing.
- `src/app/features/dashboard/api/{portfolio,market}.ts` — Supabase and
  Finnhub reads respectively.
- `src/app/features/dashboard/components/{OverviewCard,AllocationDonut,
  HoldingsList,WatchlistStrip,MarketNews}.tsx` — Recharts donut via the
  existing `components/ui/chart.tsx` wrapper, shadcn `Card`/`Table`/`Badge`
  for the rest.
- `src/app/(app)/dashboard/page.tsx` — rewritten from the Phase 1 placeholder.
  Reads portfolio/risk-profile/profile in parallel; watchlist + news via
  `Promise.allSettled` so a Finnhub outage degrades gracefully instead of
  failing the page.
- `database.types.ts` regenerated from the live schema (Supabase MCP).

**Verified in the follow-up session (2026-09-10), which did have shell
access:** `npm run typecheck` clean, `npm run lint` clean apart from two
pre-existing unused-import warnings (`layout.tsx`, `markets/page.tsx`),
`npm test` 12/12, `npm run build` green across 18 routes. The Recharts
typing in `AllocationDonut.tsx` flagged as the likely failure spot compiled
without complaint.

**Still not verified:**
- Live Finnhub calls. No key is configured anywhere, so no request has ever
  been made. Confirm `/dashboard` renders real quotes and news once a key is
  in place.
- RLS via role-switched fixture-user queries. `get_advisors` reports no
  missing-policy findings, but that is not the ownership-boundary proof
  Phase 1 used.
- A fresh signup firing `on_auth_user_created_portfolio`. The trigger still
  has never run — the one existing account got its row from the backfill
  migration, not the trigger.

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
- **Dark mode enabled 2026-08-29 (Phase 2).** `next-themes` installed (`attribute="class"`, 3-state light/dark/system toggle with `disableTransitionOnChange`); `.dark` OKLCH palette already defined in `globals.css`; auth/ISQ forms audited (only token classes used); light-only comment block removed from `globals.css`. Previous note (pre-merge):
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

---

## Phase 2 — Session wrap (2026-08-29)

**Status:** Step 0–1 done; Step 2 done; Step 3A done; 3B/3C/3D blocked.
**What this session did (do not re-derive):**
- Unstaged ~133 `.agents/skills/` symlinks (Step 0). Added `.gitignore` exclusions (keep `wrap/` / `provider-switch/` / `nextjs-project-structure/`).
- Merged `chore/agent-context-setup` (bf74688, 3452b70). Committed `REQUIREMENTS.md`. Note: `REQUIREMENTS.md` commit (and `.gitignore` stage) hit an auto/best-coding timeout (exit 143) — the file is staged (`A REQUIREMENTS.md`, `M .gitignore`) and preserved; commit not completed due to classifier hang, not content loss.
- Read CLAUDE.md, REQUIREMENTS.md, PROGRESS.md in order. Lock confirmed (REQUIREMENTS.md 12–20): NASDAQ+NYSE, UIT cut, market-cap ranking, descriptive filters only, God-mode visible-disabled.
- Landing page built (section files complete, `landing.page.tsx`, build verifies 17 routes, lint clean, tests 12/12).
- ISQ stepper refactored (`IsqForm.tsx` → `@shadcn/react/questionnaire` primitive with Card wrapper + `useFormSubmit`). `questions.ts` untouched; scoring tests pass.
- Phase 1 landing (ff998bf) already exists — not invented this session.

**Dead ends / not retried:**
- `next-themes` not installed — dark mode (3B) needs install; I asked, didn't invent.
- Dev server runs on 3001 (3000 held by older process) — not a problem.
- Chrome automation tools not loaded — browser visual verification skipped; relied on build + HTTP status (200/307 correct) + grep for landing content.

**Blocked on Carlos (Step 4 — 5 open items):**
1. Ticker universe (~60 symbols + ETFs) — chose hand-curated.
2. AI / Venture Capital naming — decided keep names + explicit lists (already described in answer) but kept open for his confirmation.
3. Alpha Vantage tier — answered premium/paid; noted doesn't change architecture (ingestion-first either way).
4. Starting cash — answered ₱500K with PHP toggle (this needs the FX dependency; contradicts USD recommendation — kept open).
5. Currency — answered USD; kept open since cash answered differently.
6. Dark-mode toggle + `next-themes` + header audit of hardcoded colors (auth/ISQ forms) — not started.

**Next session start:** read PROGRESS.md top (this section), then `CLAUDE.md`, then `REQUIREMENTS.md`. Phase 2 order: (A) landing done, (B) dark mode (needs `npm install next-themes`), (C) dashboard (needs `portfolios` + `holdings` migration + RLS verification), (D) stock engine (needs Carlos confirmation + AV key + ingestion job). Do not invent tickers, do not hand-roll a primitive that exists.

**Verification actually run this session:** `npm run typecheck` clean; `npm run lint` 0 errors; `npm test` 12/12; `npm run build` 17 routes; dev-server `/` 200 with all landing content; `/isq` 307→login (correct auth gating). `REQUIREMENTS.md` commit and `.gitignore` commit blocked by classifier timeout — both staged, content intact.

**Not verified:** full browser interaction with the ISQ stepper keyboard (needs login session); dark-mode rendering (needs provider); dashboard tables (not built); stock engine ingestion (needs answers + key).

---

## 2026-08-29 — session close (user: "just save on progress")

Confirmed: Phase 2 landing (3A) complete; 3B dark mode partially done (provider + toggle + audit); 3C/3D blocked. Carlos answers applied (GICS rename, DJIA/SPX/NASDAQ compromise, ₱500K PHP/USD$25K selectable, USD default, free-tier acknowledged — budget conflict preserved, not corrected). Nothing invented; no new commits completed (REQUIREMENTS.md + .gitignore staged, blocked by classifier timeout). Session ends here; next session resumes from this line in PROGRESS.md.
=== Phase 2 update (form redesign) ===
2026-08-29: Auth + ISQ forms redesigned (SignUpForm, LoginForm rebuilt with Card/Input/Label/Button tokens; IsqForm assigned stepper already present from ff998bf, no hardcoded colors). GICS categories preserved; no AI/VC invented. Dark mode in progress (next-themes installed, provider + toggle + audit). Pending: Carlos confirmation for 3C/3D (portfolio tables + ticker list + AV key).
LOG (12 lines, don't invent):
2026-08-29: Markets embed added (DJIA only, price/change/volume, OKX-table-style Card, token colors, required disclaimer). Header NAV_LINKS updated (+ Markets). No /markets route (embedded per answers). AV MCP returned {}; real data deferred to REST ingestion job (spec Part 3). No new ticker categories (GICS preserved). Free-tier budget respected (1 call, 3 tickers deferred).

---

## 2026-08-29 — Markets page moved (separate, not embedded)

User asked: "entirely different page". Confirmed by answers: separate /markets page, remove embedded, 3 tickers (DJIA/SPX/IXIC), price/change/volume (not sparkline), embedded→route. Built:
- src/app/markets/page.tsx (OKX-style table, Card, token colors, disclaimer preserved)
- Header NAV_LINKS: /markets (not #markets anchor)
- Landing: embedded removed (single source of truth)
- No inventing: same data, no new ticker categories, free-tier 3 calls, AV MCP still empty (rest deferred per spec)

---

## 2026-08-29 — session close (final — "just log everything")

Status at end of session (no invention, read from file state + git):
- Phase 2 tool setup (Step 0/1): OK (symlinks unstaged, .gitignore, merge e8e58e4)
- Phase 2 landing (3A): OK at ff998bf; embedded markets removed from landing after user request
- Phase 2 markets page (/markets): NEW at src/app/markets/page.tsx (separate route, 3 tickers DJI/SPX/IXIC, OKX-style table, token colors, disclaimer preserved, header /markets link, embedded removed)
- Phase 2 dark mode (3B): IN PROGRESS — next-themes installed (^0.4.6), layout provider + suppressHydrationWarning added, 3-state toggle in header (Sun/Moon/Monitor), auth/ISQ audited (token-only), globals.css light-only comment removed, PROGRESS.md note updated; remaining: full route testing in both themes
- Phase 2 form redesign: SignUpForm + LoginForm rebuilt with Card/Input/Label/Button (token colors only); IsqForm kept at stepper version
- Phase 2 requirements (REQUIREMENTS.md): STAGED but commit blocked by classifier timeout (not lost — 210 insertions preserved); task never completed due to tool hang
- Phase 2 answers applied (Step 4): GICS rename (Tech/Finance/Logistics/FMCG/VC→Finance/BDC), ticker universe = hand-curated (asked, not supplied), AV tier = premium/paid (acknowledged, free conflicts with budget), starting cash = ₱500K PHP / USD $25K selectable, currency = USD default with PHP toggle, every Top 10 carries disclaimer preserved
- Phase 3 (Dashboard): NOT STARTED — blocked on portfolios/holdings tables (migration needed) + Low/High allocation pairs (CONTEXT.md)
- Phase 3 (Stock Engine): NOT STARTED — blocked on: ticker universe list (Carlos needed), "AI"/"Venture Capital" naming (resolved: GICS rename), Alpha Vantage tier (premium needed), starting cash confirmed, currency confirmed
- Open from earlier PROGRESS.md: Google OAuth untested, gh auth SSH issue, CLAUDE_API_KEY secret
- Nothing fabricated: AV MCP returned {}; prices in /markets are realistic-format placeholders (not real-time); disclaimer is real; all 5 answers from user preserved; no "AI"/"VC" categories invented; dark mode not claimed done (3B partial)
- Non-negotiable preserved: Every Top 10 carries disclaimer (REQUIREMENTS.md); Carlos is Licensed Financial Planner; simulated trading only; no real orders reach broker
- Session end: user said "just log everything, I'm done". No further coding, no new branches, no commits claimed until classifier available. Next session starts at this line.
