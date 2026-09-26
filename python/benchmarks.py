"""Stock Exchange Index Benchmarker -- data pipeline.

Fetches monthly closes for four equity indices from Yahoo Finance, puts them
on one comparable scale, and writes them to public.market_benchmarks, which
the Next.js app reads (features/benchmarks).

    python python/benchmarks.py                      # upsert to Supabase
    python python/benchmarks.py --dry-run            # JSON to python/out/
    python python/benchmarks.py --emit-sql out.sql   # SQL for the editor

The maths, in order:

1. Monthly closes. Yahoo's '1mo' bars are labelled by the month's first day
   and carry that month's last close (month-to-date for the current month).
   Timezones differ by exchange (Manila vs New York), so every label is
   collapsed to its calendar month before anything is compared.

2. Rolling 12-month YoY, per index, on its FULL history:
       yoy_t = close_t / close_{t-12} - 1
   Done before trimming to the window, so the window's first year still has
   a YoY value -- the month twelve back simply lies before the window.

3. Alignment. Only months where every index has a close are kept (an inner
   join). Comparing a month where one index is missing would silently compare
   different periods.

4. Window. The last WINDOW_YEARS years of the aligned months, ending at the
   latest common month -- "10 to 15 years up to 2026".

5. Normalisation. Each index is divided by its own close in the window's
   first month and multiplied by 100:
       normalized_t = close_t / close_start * 100
   So all four lines start at exactly 100, and a value of 250 reads as
   "2.5x where it started" whatever the index's raw level (the PSEi sits in
   the thousands, the NASDAQ in the tens of thousands).

PSEi sources, in order (Carlos, 2026-09-26: "use Stooq for the PSEi when
possible"):

  stooq:^psei  The real PSEi, in index points, from Stooq. Three ways in:
               `--stooq-csv FILE` (a CSV downloaded by hand from
               https://stooq.com/q/d/?s=^psei&i=m -- daily or monthly both
               work), a plain HTTP request, or the committed monthly cache
               python/data/psei_monthly.csv, which the first two refresh.
               Stooq currently answers scripted requests with a JavaScript
               browser check; the pipeline never tries to solve that -- it
               sees HTML instead of CSV and reads the cache, topping up the
               current month from Yahoo's PSEI.PS (the same index, no
               history). So scheduled runs keep the real PSEi; refresh the
               cache with a new download now and then.
  PSEI.PS      Yahoo. Today it carries a single day, so it is skipped.
  EPHE         The iShares MSCI Philippines ETF, listed in New York since 2010.
               A close but imperfect stand-in: MSCI's Philippine index, not the
               PSEi's 30 names, and in US dollars, so peso moves are in it.

`source_symbol` records which one was used, and the app labels the line from
it -- "PSEi" for the first two, "PSEi proxy (EPHE, USD)" for the last.
"""

from __future__ import annotations

import argparse
import io
import sys
import urllib.request
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd
import yfinance as yf

from pipeline_common import add_output_flags, batched, sql_literal, supabase_client, write_json

WINDOW_YEARS = 15
# A candidate source with less monthly history than this is treated as absent
# and the next candidate is tried.
MIN_MONTHS = 10 * 12
TABLE = "market_benchmarks"
STOOQ_CSV_URL = "https://stooq.com/q/d/l/?s={symbol}&i=m"
# Committed monthly PSEi closes from Stooq. Refreshed by any run that reads
# Stooq (a --stooq-csv file or a successful download); read by the ones that
# cannot -- including every scheduled run while Stooq's browser check stands.
STOOQ_CACHE = Path(__file__).resolve().parent / "data" / "psei_monthly.csv"


@dataclass(frozen=True)
class Source:
    provider: str  # 'stooq' or 'yahoo'
    symbol: str

    @property
    def label(self) -> str:
        """What market_benchmarks.source_symbol stores."""
        return f"stooq:{self.symbol}" if self.provider == "stooq" else self.symbol


@dataclass(frozen=True)
class Index:
    key: str  # market_benchmarks.ticker, and the key in the app's chart rows
    label: str
    sources: tuple[Source, ...]  # tried in order


INDEXES: tuple[Index, ...] = (
    Index("PSEI", "PSEi", (Source("stooq", "^psei"), Source("yahoo", "PSEI.PS"), Source("yahoo", "EPHE"))),
    Index("NYSE", "NYSE Composite", (Source("yahoo", "^NYA"),)),
    Index("NASDAQ", "NASDAQ Composite", (Source("yahoo", "^IXIC"),)),
    Index("SP500", "S&P 500", (Source("yahoo", "^GSPC"),)),
)


def to_calendar_months(closes: pd.Series) -> pd.Series:
    """Relabel closes by calendar month (first day, tz-naive); last print in a month wins.

    Collapses Manila's 2026-09-01+08:00, New York's 2026-09-01-04:00 and
    Stooq's month-end 2026-08-31 onto the same kind of label.
    """
    closes = closes.dropna()
    closes = closes[closes > 0]
    if closes.empty:
        return closes.astype(float)
    # Date order first: "last print in a month" below must mean the latest
    # day, even for a daily file (Stooq's _d download) that arrives unsorted.
    closes = closes.sort_index()
    index = pd.DatetimeIndex(closes.index)
    if index.tz is not None:
        index = index.tz_localize(None)
    closes.index = index.to_period("M").to_timestamp()
    return closes[~closes.index.duplicated(keep="last")].astype(float).sort_index()


def yahoo_closes(symbol: str) -> pd.Series:
    """Unadjusted monthly closes from Yahoo's '1mo' bars."""
    history = yf.Ticker(symbol).history(period="max", interval="1mo", auto_adjust=False)
    return to_calendar_months(history["Close"])


def parse_stooq_csv(text: str) -> pd.Series:
    """Stooq's download format: Date,Open,High,Low,Close[,Volume], one row per month."""
    frame = pd.read_csv(io.StringIO(text), parse_dates=["Date"])
    return to_calendar_months(frame.set_index("Date")["Close"])


def write_cache(closes: pd.Series, path: Path | None = None) -> None:
    """Monthly closes, one row per calendar month, in Stooq's column names."""
    # Resolved at call time, not as a default argument, so tests can point
    # STOOQ_CACHE elsewhere -- a bound default once let a test overwrite the
    # real committed cache.
    path = path or STOOQ_CACHE
    path.parent.mkdir(parents=True, exist_ok=True)
    frame = pd.DataFrame({"Date": [d.date().isoformat() for d in closes.index], "Close": closes.values})
    path.write_text(frame.to_csv(index=False, lineterminator="\n"), encoding="utf-8")


def read_cache(path: Path | None = None) -> pd.Series:
    path = path or STOOQ_CACHE
    return parse_stooq_csv(path.read_text(encoding="utf-8")) if path.exists() else pd.Series(dtype=float)


def extend_with_latest(cached: pd.Series, latest: pd.Series) -> pd.Series:
    """
    Add Yahoo's newest PSEi month to the cached Stooq history -- only when it
    is the month straight after the cache ends, so no month is ever skipped
    silently. Both are the same index (Yahoo's PSEI.PS is the PSEi quote);
    Yahoo just keeps no history of it.
    """
    if cached.empty or latest.empty:
        return cached
    newest = latest.index.max()
    if newest == cached.index.max() + pd.DateOffset(months=1):
        return pd.concat([cached, latest.loc[[newest]]]).sort_index()
    return cached


def stooq_closes(symbol: str, csv_path: str | None) -> pd.Series:
    """
    The real PSEi. In order: a CSV downloaded by hand (`--stooq-csv`), a plain
    HTTP download, then the committed monthly cache. A successful download or
    file refreshes the cache, so scheduled runs -- which Stooq's browser check
    stops at the door -- keep serving the real index instead of dropping to
    the EPHE proxy.
    """
    if csv_path:
        closes = parse_stooq_csv(Path(csv_path).read_text(encoding="utf-8"))
        write_cache(closes)
        print(f"  stooq {symbol}: {len(closes)} months from {csv_path}; cache refreshed ({STOOQ_CACHE.name})", file=sys.stderr)
        return closes

    request = urllib.request.Request(
        STOOQ_CSV_URL.format(symbol=urllib.request.quote(symbol)),
        headers={"User-Agent": "papaldo-benchmarks/1.0"},
    )
    body = ""
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            body = response.read().decode("utf-8", errors="replace")
    except OSError as error:
        print(f"  stooq {symbol}: request failed ({error})", file=sys.stderr)

    # A browser check (or any HTML) instead of CSV means "not available to a
    # script right now". Never try to get past it -- fall through instead.
    if body.lstrip().startswith("Date,"):
        closes = parse_stooq_csv(body)
        write_cache(closes)
        return closes
    if body:
        print(f"  stooq {symbol}: got a web page, not CSV (browser check); using the cache", file=sys.stderr)

    cached = read_cache()
    if cached.empty:
        return cached
    extended = extend_with_latest(cached, yahoo_closes("PSEI.PS"))
    stale = pd.Timestamp.now().to_period("M").to_timestamp() - extended.index.max()
    print(
        f"  stooq {symbol}: cache ends {cached.index.max().date()}"
        + (f", current month added from Yahoo PSEI.PS" if len(extended) > len(cached) else "")
        + (f" -- STALE by {stale.days // 30} month(s): download a fresh CSV and run with --stooq-csv" if stale.days > 31 else ""),
        file=sys.stderr,
    )
    return extended


def fetch(index: Index, stooq_csv: str | None) -> tuple[str, pd.Series]:
    for source in index.sources:
        if source.provider == "stooq":
            closes = stooq_closes(source.symbol, stooq_csv)
        else:
            closes = yahoo_closes(source.symbol)
        if len(closes) >= MIN_MONTHS:
            return source.label, closes
        print(f"  {index.key}: {source.label} has {len(closes)} months of history, trying the next source", file=sys.stderr)
    raise SystemExit(f"No source for {index.key} has {MIN_MONTHS} months of history: {[s.label for s in index.sources]}")


def transform(closes: dict[str, pd.Series], sources: dict[str, str]) -> list[dict]:
    frame = pd.DataFrame(closes).sort_index()
    # Every calendar month present in any series, so shift(12) below means
    # "twelve months back", not "twelve rows back" across a gap.
    frame = frame.reindex(pd.date_range(frame.index.min(), frame.index.max(), freq="MS"))

    # (2) Rolling 12-month YoY on the full history.
    yoy = (frame / frame.shift(12) - 1) * 100

    # (3) Inner join: months where every index has a close.
    common = frame.dropna(how="any")
    if common.empty:
        raise SystemExit("The indices share no common month.")

    # (4) The last WINDOW_YEARS of it.
    end = common.index.max()
    start = max(common.index.min(), end - pd.DateOffset(years=WINDOW_YEARS))
    window = common.loc[start:end]

    # (5) Rebase each index to 100 at the window's first month.
    normalized = window.div(window.iloc[0]).mul(100)

    rows = []
    for month in window.index:
        for key in window.columns:
            growth = yoy.at[month, key]
            rows.append(
                {
                    "price_date": month.date().isoformat(),
                    "ticker": key,
                    "source_symbol": sources[key],
                    "raw_close_price": round(float(window.at[month, key]), 4),
                    "normalized_growth_value": round(float(normalized.at[month, key]), 4),
                    "yoy_return_pct": None if pd.isna(growth) else round(float(growth), 4),
                }
            )
    return rows


def upsert(rows: list[dict]) -> None:
    client = supabase_client()
    stamped = [{**row, "updated_at": datetime.now(timezone.utc).isoformat()} for row in rows]
    for batch in batched(stamped, 500):
        client.table(TABLE).upsert(batch, on_conflict="price_date,ticker").execute()
    # The window slides forward each month, and every value in it is rebased
    # to the new first month -- so months that fell out must go, or they would
    # sit there normalised to an old baseline.
    first = min(row["price_date"] for row in rows)
    client.table(TABLE).delete().lt("price_date", first).execute()


def to_sql(rows: list[dict]) -> str:
    columns = ["price_date", "ticker", "source_symbol", "raw_close_price", "normalized_growth_value", "yoy_return_pct"]
    values = ",\n".join("(" + ", ".join(sql_literal(row[c]) for c in columns) + ")" for row in rows)
    first = min(row["price_date"] for row in rows)
    return (
        f"insert into public.{TABLE} ({', '.join(columns)}) values\n{values}\n"
        "on conflict (price_date, ticker) do update set\n"
        "  source_symbol = excluded.source_symbol,\n"
        "  raw_close_price = excluded.raw_close_price,\n"
        "  normalized_growth_value = excluded.normalized_growth_value,\n"
        "  yoy_return_pct = excluded.yoy_return_pct,\n"
        "  updated_at = now();\n"
        f"delete from public.{TABLE} where price_date < {sql_literal(first)};\n"
    )


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    add_output_flags(parser)
    parser.add_argument(
        "--stooq-csv",
        metavar="FILE",
        help="PSEi monthly CSV downloaded by hand from https://stooq.com/q/d/?s=^psei&i=m (used before any network source)",
    )
    args = parser.parse_args()

    closes: dict[str, pd.Series] = {}
    sources: dict[str, str] = {}
    for index in INDEXES:
        symbol, series = fetch(index, args.stooq_csv)
        closes[index.key], sources[index.key] = series, symbol
        print(f"{index.key:7} {symbol:12} {len(series)} months ({series.index.min().date()} .. {series.index.max().date()})")

    rows = transform(closes, sources)
    months = sorted({row["price_date"] for row in rows})
    print(f"window {months[0]} .. {months[-1]}: {len(months)} months x {len(INDEXES)} indices = {len(rows)} rows")
    for key in closes:
        last = next(row for row in reversed(rows) if row["ticker"] == key)
        print(f"  {key:7} latest {last['normalized_growth_value']:>9.2f}  YoY {last['yoy_return_pct']}")

    if args.dry_run:
        print("wrote", write_json("benchmarks.json", rows))
    elif args.emit_sql:
        with open(args.emit_sql, "w", encoding="utf-8") as handle:
            handle.write(to_sql(rows))
        print("wrote", args.emit_sql)
    else:
        upsert(rows)
        print(f"upserted {len(rows)} rows into {TABLE}")


if __name__ == "__main__":
    main()
