"""What is inside each ETF Papaldo trades, for the "Top holdings" dialog.

Reads Alpha Vantage's ETF_PROFILE for every active ETF in
public.tradable_assets and writes public.etf_profiles: net assets, expense
ratio, dividend yield, sector weights, the ten largest holdings and how many
holdings there are in all. An official API with a key, no scraping.

    python python/etf_profiles.py                 # upsert into Supabase
    python python/etf_profiles.py --dry-run       # JSON under python/out/ only
    python python/etf_profiles.py --emit-sql x.sql

Needs ALPHAVANTAGE_API_KEY (and, to write, SUPABASE_URL plus
SUPABASE_SERVICE_ROLE_KEY). The free tier allows 25 requests a day and 5 a
minute; 15 ETFs once a week fits, with a pause between calls.
"""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.parse
import urllib.request
from typing import Any

from pipeline_common import add_output_flags, sql_literal, supabase_client, write_json

API = "https://www.alphavantage.co/query"
TOP = 10
PAUSE_SECONDS = 13  # 5 calls a minute on the free tier

# Each fund issuer's own page: the full holdings list and the prospectus.
SOURCE_URL = {
    "VOO": "https://investor.vanguard.com/investment-products/etfs/profile/voo",
    "VTI": "https://investor.vanguard.com/investment-products/etfs/profile/vti",
    "VIG": "https://investor.vanguard.com/investment-products/etfs/profile/vig",
    "VYM": "https://investor.vanguard.com/investment-products/etfs/profile/vym",
    "VUG": "https://investor.vanguard.com/investment-products/etfs/profile/vug",
    "VGT": "https://investor.vanguard.com/investment-products/etfs/profile/vgt",
    "VXUS": "https://investor.vanguard.com/investment-products/etfs/profile/vxus",
    "QQQ": "https://www.invesco.com/qqq-etf/en/home.html",
    "SPMO": "https://www.invesco.com/us/financial-products/etfs/product-detail?audienceType=Investor&ticker=SPMO",
    "SCHD": "https://www.schwabassetmanagement.com/products/schd",
    "DGRO": "https://www.ishares.com/us/products/264623/ishares-core-dividend-growth-etf",
    "USMV": "https://www.ishares.com/us/products/239695/ishares-msci-usa-minimum-volatility-etf",
    "IEMG": "https://www.ishares.com/us/products/244050/ishares-core-msci-emerging-markets-etf",
    "IBIT": "https://www.ishares.com/us/products/333011/ishares-bitcoin-trust-etf",
    "SMH": "https://www.vaneck.com/us/en/investments/semiconductor-etf-smh/",
}


def number(value: Any) -> float | None:
    """Alpha Vantage sends numbers as strings, and "n/a" or "None" when it has none."""
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    return result if result == result else None  # NaN -> None


def fetch(symbol: str, key: str) -> Any:
    query = urllib.parse.urlencode({"function": "ETF_PROFILE", "symbol": symbol, "apikey": key})
    request = urllib.request.Request(f"{API}?{query}", headers={"User-Agent": "papaldo-pipeline/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def parse(symbol: str, payload: Any) -> dict[str, Any]:
    """One ETF_PROFILE response -> one etf_profiles row."""
    if not isinstance(payload, dict) or "holdings" not in payload:
        note = payload.get("Note") or payload.get("Information") or payload.get("Error Message") if isinstance(payload, dict) else None
        raise ValueError(f"{symbol}: unexpected Alpha Vantage response: {note or payload!r}"[:300])

    holdings = []
    for item in payload.get("holdings") or []:
        weight = number(item.get("weight"))
        ticker = (item.get("symbol") or "").strip()
        name = (item.get("description") or "").strip()
        # Cash lines, swaps and rights come back as "n/a": not a company to show.
        if weight is None or weight <= 0 or ticker in ("", "n/a"):
            continue
        holdings.append({"symbol": ticker.replace("-", "."), "name": name if name != "n/a" else ticker, "weight": weight})
    holdings.sort(key=lambda h: h["weight"], reverse=True)

    sectors = [
        {"sector": (s.get("sector") or "").strip().title(), "weight": number(s.get("weight"))}
        for s in payload.get("sectors") or []
    ]
    sectors = sorted((s for s in sectors if s["sector"] and s["weight"]), key=lambda s: s["weight"], reverse=True)

    as_of = (payload.get("last_updated") or "").replace(" UTC", "+00:00") or None
    inception = payload.get("inception_date")
    return {
        "symbol": symbol,
        "net_assets": number(payload.get("net_assets")),
        "expense_ratio": number(payload.get("net_expense_ratio")),
        "dividend_yield": number(payload.get("dividend_yield")),
        "inception_date": inception if inception and inception != "n/a" else None,
        "holdings_count": len(holdings),
        "top_holdings": holdings[:TOP],
        "sectors": sectors,
        "source_url": SOURCE_URL[symbol],
        "as_of": as_of or time.strftime("%Y-%m-%dT%H:%M:%S+00:00", time.gmtime()),
    }


def etf_symbols() -> list[str]:
    client = supabase_client()
    rows = client.table("tradable_assets").select("symbol").eq("active", True).eq("sector", "ETF").order("symbol").execute()
    return [row["symbol"] for row in rows.data]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    add_output_flags(parser)
    args = parser.parse_args()

    key = os.environ.get("ALPHAVANTAGE_API_KEY")
    if not key:
        raise SystemExit("ALPHAVANTAGE_API_KEY is not set; nothing fetched.")

    symbols = sorted(SOURCE_URL) if args.dry_run or args.emit_sql else etf_symbols()
    unknown = [s for s in symbols if s not in SOURCE_URL]
    if unknown:
        raise SystemExit(f"No issuer page for {', '.join(unknown)}: add it to SOURCE_URL first.")

    rows = []
    for i, symbol in enumerate(symbols):
        if i:
            time.sleep(PAUSE_SECONDS)
        row = parse(symbol, fetch(symbol, key))
        print(f"{symbol}: {row['holdings_count']} holdings, top {row['top_holdings'][0]['symbol'] if row['top_holdings'] else '-'}")
        rows.append(row)

    if args.dry_run:
        print("wrote", write_json("etf_profiles.json", rows))
    elif args.emit_sql:
        columns = list(rows[0].keys())
        values = ",\n".join(
            "(" + ", ".join(sql_literal(json.dumps(r[c]) if isinstance(r[c], list) else r[c]) for c in columns) + ")" for r in rows
        )
        updates = ", ".join(f"{c} = excluded.{c}" for c in columns if c != "symbol")
        with open(args.emit_sql, "w", encoding="utf-8") as handle:
            handle.write(
                f"insert into public.etf_profiles ({', '.join(columns)}) values\n{values}\n"
                f"on conflict (symbol) do update set {updates}, updated_at = now();\n"
            )
        print("wrote", args.emit_sql)
    else:
        supabase_client().table("etf_profiles").upsert(rows, on_conflict="symbol").execute()
        print(f"upserted {len(rows)} ETFs")


if __name__ == "__main__":
    main()
