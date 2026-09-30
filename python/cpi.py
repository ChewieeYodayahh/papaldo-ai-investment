"""Consumer price index by year for the Purchasing Power calculator (Tools).

Reads the World Bank's indicator FP.CPI.TOTL (consumer prices, 2010 = 100)
for the United States and the Philippines from its public API -- an official
open-data API, no key and no scraping -- and writes public.cpi_annual.

    python python/cpi.py                       # upsert into Supabase
    python python/cpi.py --dry-run             # JSON under python/out/ only
    python python/cpi.py --emit-sql cpi.sql    # SQL for the Supabase SQL editor

Years the World Bank has not published yet (the latest year often lags) are
simply absent; the app offers the years that exist.
"""

from __future__ import annotations

import argparse
import json
import urllib.request
from typing import Any

from pipeline_common import add_output_flags, batched, sql_literal, supabase_client, write_json

INDICATOR = "FP.CPI.TOTL"
COUNTRIES = ("USA", "PHL")
SOURCE = f"World Bank {INDICATOR}"
API = "https://api.worldbank.org/v2/country/{countries}/indicator/{indicator}?format=json&per_page=1000&date=1960:2100"


def fetch() -> Any:
    url = API.format(countries=";".join(COUNTRIES), indicator=INDICATOR)
    request = urllib.request.Request(url, headers={"User-Agent": "papaldo-pipeline/1.0"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return json.loads(response.read().decode("utf-8"))


def parse(payload: Any) -> list[dict[str, Any]]:
    """World Bank JSON ([meta, rows]) -> one row per country and year with a value."""
    if not isinstance(payload, list) or len(payload) < 2 or not isinstance(payload[1], list):
        message = payload[0].get("message") if isinstance(payload, list) and payload and isinstance(payload[0], dict) else None
        raise ValueError(f"Unexpected World Bank response: {message or payload!r}"[:300])
    rows = []
    for item in payload[1]:
        country = item.get("countryiso3code")
        value = item.get("value")
        if country not in COUNTRIES or value is None:
            continue
        rows.append({"country": country, "year": int(item["date"]), "cpi": float(value), "source": SOURCE})
    rows.sort(key=lambda row: (row["country"], row["year"]))
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    add_output_flags(parser)
    args = parser.parse_args()

    rows = parse(fetch())
    for country in COUNTRIES:
        years = [row["year"] for row in rows if row["country"] == country]
        print(f"{country}: {len(years)} years" + (f", {min(years)}-{max(years)}" if years else ""))
    if not rows:
        raise SystemExit("No CPI rows came back; nothing written.")

    if args.dry_run:
        print("wrote", write_json("cpi_annual.json", rows))
    elif args.emit_sql:
        values = ",\n".join(
            f"({sql_literal(r['country'])}, {r['year']}, {sql_literal(r['cpi'])}, {sql_literal(r['source'])})" for r in rows
        )
        with open(args.emit_sql, "w", encoding="utf-8") as handle:
            handle.write(
                "insert into public.cpi_annual (country, year, cpi, source) values\n"
                f"{values}\n"
                "on conflict (country, year) do update set cpi = excluded.cpi, source = excluded.source, updated_at = now();\n"
            )
        print("wrote", args.emit_sql)
    else:
        client = supabase_client()
        for batch in batched(rows, 500):
            client.table("cpi_annual").upsert(batch, on_conflict="country,year").execute()
        print(f"upserted {len(rows)} rows")


if __name__ == "__main__":
    main()
