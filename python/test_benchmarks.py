"""Offline tests for benchmarks.transform -- synthetic series, no network.

    python -m unittest discover -s python
"""

import unittest

import pandas as pd

from benchmarks import transform


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
