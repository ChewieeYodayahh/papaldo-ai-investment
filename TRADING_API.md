# Trading API surface

Every HTTP endpoint the trading feature touches, in both directions: the
Alpaca endpoints Papaldo calls, and the Papaldo routes the browser calls.

Status key: **live** = built and running · **planned** = Phase 4, not built yet.

`features/trading/` is built as of 2026-09-11: order ticket, order history,
`POST /api/trading/orders`, and the `place_order()` function behind them.

**Provider split (Carlos, 2026-09-11).** Alpaca is the pricing and asset
engine: the tradable universe, symbol identity, live prices and daily history.
Finnhub is the news feed, capped at four headlines per calendar day. One
documented exception — the three research cards on the symbol page (logo and
industry, valuation ratios, analyst coverage) have no Alpaca equivalent at any
plan level and Alpaca's logo endpoint answers 403 here, so they stay on
Finnhub. Dropping Finnhub to news-only later means deleting three cards, not
untangling the page.

---

## 1. Alpaca — outbound, server-side only

Two hosts. Prices, bars and snapshots come from `data.alpaca.markets`; the
asset catalogue is only served by `paper-api.alpaca.markets`. Credentials go in
the `APCA-API-KEY-ID` and `APCA-API-SECRET-KEY` headers, never the query
string. Wrapped by `core/services/alpaca.ts`; nothing else in the codebase may
call Alpaca.

All rows below were probed against the live API with this project's key on
2026-09-11.

| Endpoint | Status | Used by | Returns |
|---|---|---|---|
| `GET /v2/stocks/snapshots` | 200 · live | `getSnapshots` | snapshots keyed at top level, **no wrapper** |
| `GET /v2/stocks/{symbol}/bars` | 200 · live | `getDailyBars` | `{bars:[{t,o,h,l,c,v,vw,n}]}` flat array |
| `GET /v2/assets` | 200 · live | `listTradableAssets` | 14,307 active US equities; 8,515 tradable on NASDAQ/NYSE |
| `GET /v2/assets/{symbol}` | 200 · live | `getAsset` | name, exchange, `tradable`, `fractionable`, `shortable` |
| `GET /v2/stocks/{symbol}/trades/latest` | 200 · live | `getLatestPrice` | `{symbol,trade:{p,t,s,x,z}}` |
| `GET /v1beta3/crypto/us/snapshots` | 200 · planned | `getSnapshots` | nested under a `snapshots` key |
| `GET /v1beta3/crypto/us/bars` | 200 · planned | `getDailyBars` | `{bars:{"BTC/USD":[...]}}` keyed by symbol |
| `GET /v1beta3/crypto/us/latest/quotes` | 200 · planned | `getLatestPrice` | `{quotes:{"BTC/USD":{ap,as,bp,bs,t}}}` |
| `GET /v1beta1/forex/latest/rates` | **403** | nothing | `forbidden: insufficient grants` |
| `GET /v1beta1/logos/{symbol}` | **403** | nothing | `Subscription does not permit querying logos` |

`/v2/assets` is served by the **trading host** (`paper-api.alpaca.markets`),
not the data host. It is a read of a public reference catalogue, not a touch of
the account. The hard line still holds: no code here reads or writes an order,
a position or a balance.

Four things this table is meant to stop someone re-deriving:

- **Equity and crypto responses are shaped differently.** Equities return a
  flat `bars` array; crypto returns an object keyed by pair symbol. That is the
  only reason `getDailyBars` takes an `assetClass` argument.
- **Bar timestamps differ in meaning.** Equity `t` is session midnight in New
  York expressed as UTC (`04:00:00Z` under EDT, `05:00:00Z` under EST); crypto
  `t` is true UTC midnight. Slicing the date off is correct for both. Parsing
  into a local `Date` first shifts US sessions a day earlier west of UTC.
- **Crypto has no last-trade endpoint**, so `getLatestPrice` returns the
  bid/ask midpoint for crypto and an actual last trade for equities. Anything
  that displays a fill price should not pretend those are the same thing.
- **The free plan forbids querying the last 15 minutes.** Requests end the
  window 16 minutes back so daily bars do not start failing every weekday
  morning.
- **Multi-symbol snapshot responses are asymmetric too.** The equity endpoint
  keys snapshots at the top level with no wrapper; crypto nests them under
  `snapshots`.

### Deliberately never called

`/v2/orders`, `/v2/positions`, `/v2/account` — every endpoint that would place,
cancel or read an order, a position or a balance on Alpaca's side.

The trading host is read for `/v2/assets` and nothing else. That distinction is
the whole line: reading a public catalogue of what exists is not the same as
touching an account. Every user's cash, holdings and order history live in
Papaldo's own Supabase tables, and simulated fills are priced from
`getLatestPrice`. Calling an order endpoint from `alpaca.ts` would quietly turn
a simulation into a brokerage integration.

### Still unresolved

- **Quote latency during market hours is untested.** Both probe runs happened
  with US markets closed. Confirm the latest-trade timestamp is current before
  committing Alpaca as the fill-price oracle, since Finnhub's quote is already
  live and already wired.
- **PHP conversion needs a different provider.** The forex 403 above is
  definitive for this account.

---

## 2. Finnhub — outbound, server-side only

Unchanged by this work, listed so the split is legible. Wrapped by
`core/services/finnhub.ts`. See `EXTERNAL_SERVICES.md` for the full account.

| Endpoint | Used by |
|---|---|
| `GET /company-news`, `GET /news` | symbol and market headlines, capped 4/day |
| `GET /stock/profile2` | logo and industry only — the documented exception |
| `GET /stock/metric?metric=all` | key stats, quarterly earnings series |
| `GET /stock/recommendation` | analyst ratings |
| `GET /quote` | **no longer called** — Alpaca snapshots replaced it |
| `GET /stock/candle` | **403 on this plan** — why Alpaca serves history |

The per-day news cap buckets by **local** date, not `toISOString()`. Those look
equivalent and are not: the list renders `toLocaleDateString()`, so stories
filed in the New York evening land on the next UTC day and a cap of four let
seven through under one visible date. Observed on AAPL, 2026-09-11.

---

## 3. Papaldo's own routes — inbound, called by the browser

The UI never calls Supabase, Finnhub or Alpaca directly. It calls a route
under `src/app/api/*`, which validates and delegates to the matching
`features/*/api` module.

### Live today

| Route | Method | Delegates to |
|---|---|---|
| `/api/auth/sign-up` | POST | `features/auth/api/sign-up` |
| `/api/auth/login` | POST | `features/auth/api/sign-in` |
| `/api/auth/sign-out` | POST | `features/auth/api/sign-out` |
| `/api/auth/oauth/google` | POST | `features/auth/api/google` |
| `/api/auth/callback` | GET | `features/auth/api/google` |
| `/api/auth/profile` | POST | `features/auth/api/profile` |
| `/api/isq` | POST | `features/onboarding/api/submit` |

Market data has no route of its own. The symbol page is a server component, so
it calls `features/markets/api/*` directly without an HTTP hop.

### Trading — live

| Route | Method | Body | Returns |
|---|---|---|---|
| `/api/trading/orders` | POST | `{symbol, assetClass, side, quantity}` | `{ok, order, cashBalance}` |

Note what the body does **not** carry: a price. The handler:

1. Zod-validates the body.
2. Reads the live price itself via `alpaca.getLatestPrice`.
3. Calls `place_order()` with symbol, side, quantity and that price.
4. Returns the fill and the new cash balance.

Failures answer **422**, not 400 — the request was well-formed, the account
simply could not support it. The database's SQLSTATEs map to user-facing
wording in `features/trading/api/orders.ts`: `PA001` not enough cash, `PA002`
not enough held, `PA003` no portfolio, `PA004` not signed in, `PA005` invalid.

No `GET` for history: the dashboard is a server component and reads `orders`
through `features/trading/api/orders.ts`.

---

## 4. Supabase — the trading write path

Applied 2026-09-11.

| Object | Shape |
|---|---|
| `orders` table | `id, portfolio_id, symbol, asset_class, side, quantity, fill_price, filled_at, created_at` |
| `holdings` gains | `asset_class` (`equity` \| `crypto`) |
| `place_order()` | `SECURITY DEFINER`, `search_path` pinned empty |

`place_order()` locks the caller's portfolio row with `FOR UPDATE`, validates
cash on a buy or held quantity on a sell, then updates `cash_balance`, upserts
`holdings` and inserts into `orders` in one transaction. The lock is not
decoration: without it two overlapping buys can both read the same balance,
both pass the funds check, and overdraw an account that carries a non-negative
constraint.

Verified end to end against the live database inside a rolled-back
transaction: buy 10 at 326.07 then 5 at 300 produced a weighted average cost of
317.38 and the right cash at each step; overselling raised `PA002`;
overspending raised `PA001`; selling the full position deleted the holding row
rather than zeroing it, since `quantity` carries a `> 0` check.

### Known gap — the caller names the fill price

`place_order` is `SECURITY DEFINER` and `authenticated` holds `EXECUTE`, so it
is reachable directly at `/rest/v1/rpc/place_order` with any `p_fill_price` the
caller chooses. The route handler always passes a real Alpaca quote, but the
route is not the only way in. Supabase's security advisor flags the same thing.

The blast radius is one user's own simulated balance — RLS scopes every read
and the function only ever touches the caller's portfolio — so this is a
fairness problem in a learning tool, not a breach. Two ways to close it if that
matters: revoke `EXECUTE` from `authenticated` and call the function from the
route with a service-role client (adds a powerful key to the environment), or
have the function validate the price against a server-recorded quote (needs a
quotes table this project does not have).

`authenticated` gets `EXECUTE` on that function and nothing else. No direct
`INSERT` or `UPDATE` grant on `holdings` or `orders`, so the only way a balance
can change is through code that checks it first. This is the same
defence-in-depth shape as the existing signup trigger, and the reason RLS on
those tables is read-only.
