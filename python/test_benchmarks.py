"""Offline tests for benchmarks.transform -- synthetic series, no network.

    python -m unittest discover -s python
"""

import tempfile
import unittest
from pathlib import Path
from unittest import mock

import pandas as pd

from benchmarks import extend_with_latest, parse_stooq_csv, read_cache, stooq_closes, transform, write_cache

STOOQ_SAMPLE = """Date,Open,High,Low,Close,Volume
2026-07-31,6100,6250,6010,6200.5,1000
2026-08-29,6200,6300,5900,5950.25,1200
2026-09-25,5950,6000,5800,5825.97,900
"""


class StooqTest(unittest.TestCase):
    def test_month_end_rows_become_calendar_months(self) -> None:
        closes = parse_stooq_csv(STOOQ_SAMPLE)
        self.assertEqual([d.date().isoformat() for d in closes.index], ["2026-07-01", "2026-08-01", "2026-09-01"])
        self.assertEqual(closes.iloc[-1], 5825.97)

    def test_a_daily_file_keeps_each_months_last_close_even_unsorted(self) -> None:
        daily = "Date,Open,High,Low,Close,Volume\n2026-09-25,1,1,1,5825.97,1\n2026-08-29,1,1,1,5950.25,1\n2026-09-01,1,1,1,6000,1\n2026-08-01,1,1,1,6100,1\n"
        closes = parse_stooq_csv(daily)
        self.assertEqual([d.date().isoformat() for d in closes.index], ["2026-08-01", "2026-09-01"])
        self.assertEqual(list(closes), [5950.25, 5825.97])

    def browser_check(self):
        page = b"<!DOCTYPE html><html><body>This site requires JavaScript to verify your browser.</body></html>"
        response = mock.MagicMock()
        response.__enter__.return_value.read.return_value = page
        return mock.patch("urllib.request.urlopen", return_value=response)

    def test_a_browser_check_with_no_cache_is_treated_as_no_data(self) -> None:
        with tempfile.TemporaryDirectory() as tmp, self.browser_check(), \
                mock.patch("benchmarks.STOOQ_CACHE", Path(tmp) / "none.csv"):
            self.assertTrue(stooq_closes("^psei", None).empty)

    def test_a_browser_check_falls_back_to_the_cache_topped_up_from_yahoo(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            cache = Path(tmp) / "psei.csv"
            write_cache(parse_stooq_csv(STOOQ_SAMPLE), cache)
            yahoo = pd.Series([5900.0], index=pd.DatetimeIndex(["2026-10-01"]))
            with self.browser_check(), mock.patch("benchmarks.STOOQ_CACHE", cache), \
                    mock.patch("benchmarks.yahoo_closes", return_value=yahoo):
                closes = stooq_closes("^psei", None)
        self.assertEqual(closes.index.max().date().isoformat(), "2026-10-01")
        self.assertEqual(closes.iloc[-1], 5900.0)
        self.assertEqual(len(closes), 4)

    def test_a_hand_downloaded_file_refreshes_the_cache(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            source, cache = Path(tmp) / "psei_d.csv", Path(tmp) / "cache.csv"
            source.write_text(STOOQ_SAMPLE, encoding="utf-8")
            with mock.patch("benchmarks.STOOQ_CACHE", cache):
                stooq_closes("^psei", str(source))
            self.assertEqual(list(read_cache(cache)), [6200.5, 5950.25, 5825.97])


class ExtendTest(unittest.TestCase):
    cached = pd.Series([1.0, 2.0], index=pd.DatetimeIndex(["2026-08-01", "2026-09-01"]))

    def test_adds_only_the_month_right_after_the_cache(self) -> None:
        next_month = pd.Series([3.0], index=pd.DatetimeIndex(["2026-10-01"]))
        self.assertEqual(list(extend_with_latest(self.cached, next_month)), [1.0, 2.0, 3.0])

    def test_never_bridges_a_gap(self) -> None:
        two_ahead = pd.Series([3.0], index=pd.DatetimeIndex(["2026-11-01"]))
        self.assertEqual(list(extend_with_latest(self.cached, two_ahead)), [1.0, 2.0])

    def test_never_overwrites_a_cached_month(self) -> None:
        same = pd.Series([9.0], index=pd.DatetimeIndex(["2026-09-01"]))
        self.assertEqual(list(extend_with_latest(self.cached, same)), [1.0, 2.0])


def monthly(start: str, values: list[float]) -> pd.Series:
    return pd.Series(values, index=pd.date_range(start, periods=len(values), freq="MS"), dtype=float)


class TransformTest(unittest.TestCase):
    def setUp(self) -> None:
        # A doubles steadily; B is flat; B starts 13 months later than A.
        self.a = monthly("2020-01-01", [100 * 1.05**i for i in range(40)])
        self.b = monthly("2021-02-01", [7000.0] * 27)
        self.rows = transform({"A": self.a, "B": self.b}, {"A": "^A", "B": "^B"})

    def by(self, key: str) -> list[dict]:
        return [row for row in self.rows if row["ticker"] == key]

    def test_every_index_starts_at_100_on_the_first_common_month(self) -> None:
        for key in ("A", "B"):
            first = self.by(key)[0]
            self.assertEqual(first["price_date"], "2021-02-01")
            self.assertEqual(first["normalized_growth_value"], 100.0)

    def test_normalised_value_is_growth_since_the_window_start(self) -> None:
        last_a = self.by("A")[-1]
        start_close = self.a.loc["2021-02-01"]
        self.assertAlmostEqual(last_a["normalized_growth_value"], round(last_a["raw_close_price"] / start_close * 100, 4), places=3)
        self.assertEqual(self.by("B")[-1]["normalized_growth_value"], 100.0)

    def test_yoy_uses_history_from_before_the_window(self) -> None:
        # A's first window month already has a twelve-months-back close.
        self.assertAlmostEqual(self.by("A")[0]["yoy_return_pct"], (1.05**12 - 1) * 100, places=3)
        # B has none until it has a year of its own history.
        self.assertIsNone(self.by("B")[0]["yoy_return_pct"])
        self.assertEqual(self.by("B")[12]["yoy_return_pct"], 0.0)

    def test_only_months_where_every_index_has_a_close(self) -> None:
        dates_a = [row["price_date"] for row in self.by("A")]
        dates_b = [row["price_date"] for row in self.by("B")]
        self.assertEqual(dates_a, dates_b)
        self.assertEqual(len(dates_a), 27)

    def test_a_gap_does_not_turn_twelve_rows_into_twelve_months(self) -> None:
        gappy = self.a.drop(pd.Timestamp("2021-06-01"))
        rows = transform({"A": gappy}, {"A": "^A"})
        july_2022 = next(row for row in rows if row["price_date"] == "2022-07-01")
        self.assertAlmostEqual(july_2022["yoy_return_pct"], (1.05**12 - 1) * 100, places=3)


if __name__ == "__main__":
    unittest.main()
