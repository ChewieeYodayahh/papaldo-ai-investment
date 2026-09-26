"""Market capitalisations for the buyable universe -- sizes the /markets heatmap.

Reads the active, non-ETF symbols from public.tradable_assets, asks Yahoo
Finance for each one's market cap, and writes tradable_assets.market_cap_usd.

    python python/market_caps.py                               # update Supabase
    python python/market_caps.py --dry-run --symbols AAPL MSFT # JSON only
    python python/market_caps.py --emit-sql caps.sql --symbols ...

ETFs are skipped: a fund has assets under management, not a market cap, and
the heatmap shows stocks only. Symbols Yahoo cannot price are reported and
left untouched rather than zeroed -- the heatmap falls back to the sector's
median for them.
"""

from __future__ import annotations

import argparse
import sys
from datetime import datetime, timezone

import yfinance as yf

from pipeline_common import add_output_flags, sql_literal, supabase_client, write_json


def yahoo_symbol(symbol: str) -> str:
    """Alpaca writes share classes with a dot (BRK.B); Yahoo with a dash (BRK-B)."""
    return symbol.replace(".", "-")


def market_cap(symbol: str) -> int | None:
    try:
        value = yf.Ticker(yahoo_symbol(symbol)).fast_info["marketCap"]
    except Exception as error:  # noqa: BLE001 -- one bad symbol must not stop the run
        print(f"  {symbol}: {type(error).__name__}: {error}", file=sys.stderr)
        return None
    return int(value) if value and value > 0 else None


def universe_symbols() -> list[str]:
    client = supabase_client()
    result = (
        client.table("tradable_assets").select("symbol").eq("active", True).neq("sector", "ETF").order("symbol").execute()
    )
    return [row["symbol"] for row in result.data]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    add_output_flags(parser)
    parser.add_argument("--symbols", nargs="+", help="symbols to price (default: the universe from Supabase)")
    args = parser.parse_args()

    symbols = args.symbols or universe_symbols()
    as_of = datetime.now(timezone.utc).isoformat(timespec="seconds")
    rows = []
    for symbol in symbols:
        cap = market_cap(symbol)
        print(f"{symbol:6} {cap if cap is not None else 'unavailable'}")
        if cap is not None:
            rows.append({"symbol": symbol, "market_cap_usd": cap, "market_cap_as_of": as_of})

    print(f"priced {len(rows)} of {len(symbols)}")
    if args.dry_run:
        print("wrote", write_json("market_caps.json", rows))
    elif args.emit_sql:
        values = ",\n".join(
            f"({sql_literal(r['symbol'])}, {sql_literal(r['market_cap_usd'])}, {sql_literal(r['market_cap_as_of'])}::timestamptz)"
            for r in rows
        )
        with open(args.emit_sql, "w", encoding="utf-8") as handle:
            handle.write(
                "update public.tradable_assets t set market_cap_usd = v.cap, market_cap_as_of = v.as_of\n"
                f"from (values\n{values}\n) as v(symbol, cap, as_of)\nwhere t.symbol = v.symbol;\n"
            )
        print("wrote", args.emit_sql)
    else:
        client = supabase_client()
        for row in rows:
            client.table("tradable_assets").update(
                {"market_cap_usd": row["market_cap_usd"], "market_cap_as_of": row["market_cap_as_of"]}
            ).eq("symbol", row["symbol"]).execute()
        print(f"updated {len(rows)} rows")


if __name__ == "__main__":
    main()
