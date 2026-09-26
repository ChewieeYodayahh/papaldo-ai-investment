"""Shared plumbing for the market-data pipelines (benchmarks.py, market_caps.py).

Each pipeline computes rows, then does one of three things with them:

    default        upsert into Supabase with the service-role key
                   (SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY, as GitHub
                   Actions provides them)
    --dry-run      write the rows as JSON under python/out/ and touch nothing
    --emit-sql F   write an idempotent SQL file with the same effect, for
                   the Supabase SQL editor when no service key is at hand

The service-role key bypasses RLS, which is the point: these tables are
read-only to every client role and written only from here. Never ship that
key to the browser or a NEXT_PUBLIC_ variable.
"""

from __future__ import annotations

import argparse
import json
import math
import os
from pathlib import Path
from typing import Any, Iterable

OUT_DIR = Path(__file__).resolve().parent / "out"


def add_output_flags(parser: argparse.ArgumentParser) -> None:
    parser.add_argument("--dry-run", action="store_true", help="compute only; write JSON to python/out/")
    parser.add_argument("--emit-sql", metavar="FILE", help="write an idempotent SQL file instead of calling Supabase")


def supabase_client():
    """Service-role client. Imported lazily so --dry-run needs no credentials."""
    from supabase import create_client

    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        raise SystemExit(
            "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set (or pass --dry-run / --emit-sql)."
        )
    return create_client(url, key)


def batched(rows: list[dict[str, Any]], size: int) -> Iterable[list[dict[str, Any]]]:
    for start in range(0, len(rows), size):
        yield rows[start : start + size]


def write_json(name: str, payload: Any) -> Path:
    OUT_DIR.mkdir(exist_ok=True)
    path = OUT_DIR / name
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return path


def sql_literal(value: Any) -> str:
    """A value as a SQL literal. Numbers stay numbers; NaN/None become null."""
    if value is None or (isinstance(value, float) and math.isnan(value)):
        return "null"
    if isinstance(value, (int, float)):
        return repr(value)
    return "'" + str(value).replace("'", "''") + "'"
