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

PSEi caveat: Yahoo Finance has no PSEi history. `^PSEI` does not exist and
`PSEI.PS` carries a single day. The pipeline tries it first and, when it is
too short, falls back to EPHE -- the iShares MSCI Philippines ETF, listed in
New York since 2010. EPHE is a close but imperfect stand-in: it tracks MSCI's
Philippine index (not the PSEi's 30 names), in US dollars, so peso moves are
in it. `source_symbol` records which was used and the app labels it.
"""

from __future__ import annotations

import argparse
import sys
from dataclasses import dataclass
from datetime import datetime, timezone

import pandas as pd
import yfinance as yf

from pipeline_common import add_output_flags, batched, sql_literal, supabase_client, write_json

WINDOW_YEARS = 15
# A candidate symbol with less monthly history than this is treated as absent
# and the next candidate is tried.
MIN_MONTHS = 10 * 12
TABLE = "market_benchmarks"


@dataclass(frozen=True)
class Index:
    key: str  # market_benchmarks.ticker, and the key in the app's chart rows
    label: str
    symbols: tuple[str, ...]  # Yahoo symbols, tried in order


INDEXES: tuple[Index, ...] = (
    Index("PSEI", "PSEi", ("PSEI.PS", "EPHE")),
    Index("NYSE", "NYSE Composite", ("^NYA",)),
    Index("NASDAQ", "NASDAQ Composite", ("^IXIC",)),
    Index("SP500", "S&P 500", ("^GSPC",)),
)


def monthly_closes(symbol: str) -> pd.Series:
    """Unadjusted monthly closes, indexed by calendar month (first day, tz-naive)."""
    history = yf.Ticker(symbol).history(period="max", interval="1mo", auto_adjust=False)
    closes = history["Close"].dropna()
    closes = closes[closes > 0]
    if closes.empty:
        return closes.astype(float)
    # Collapse timezone-aware labels to their calendar month, so Manila's
    # 2026-09-01+08:00 and New York's 2026-09-01-04:00 are the same row.
    months = pd.DatetimeIndex(closes.index).tz_localize(None).to_period("M").to_timestamp()
    closes.index = months
    # Yahoo occasionally repeats the current month; the last print wins.
    return closes[~closes.index.duplicated(keep="last")].astype(float).sort_index()


def fetch(index: Index) -> tuple[str, pd.Series]:
    for symbol in index.symbols:
        closes = monthly_closes(symbol)
        if len(closes) >= MIN_MONTHS:
            return symbol, closes
        print(f"  {index.key}: {symbol} has {len(closes)} months of history, trying the next source", file=sys.stderr)
    raise SystemExit(f"No source for {index.key} has {MIN_MONTHS} months of history: {index.symbols}")


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
    args = parser.parse_args()

    closes: dict[str, pd.Series] = {}
    sources: dict[str, str] = {}
    for index in INDEXES:
        symbol, series = fetch(index)
        closes[index.key], sources[index.key] = series, symbol
        print(f"{index.key:7} {symbol:8} {len(series)} months ({series.index.min().date()} .. {series.index.max().date()})")

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
