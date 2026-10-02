"""Offline tests for etf_profiles.parse -- a trimmed ETF_PROFILE response, no network.

    python -m unittest discover -s python
"""

import unittest

from etf_profiles import SOURCE_URL, TOP, parse

SAMPLE = {
    "net_assets": "1800000000000",
    "net_expense_ratio": "0.0003",
    "dividend_yield": "0.0098",
    "inception_date": "2010-09-07",
    "last_updated": "2026-10-02 00:01 UTC",
    "sectors": [
        {"sector": "FINANCIALS", "weight": "0.107"},
        {"sector": "INFORMATION TECHNOLOGY", "weight": "0.377"},
        {"sector": "REAL ESTATE", "weight": "0.00"},
    ],
    "holdings": [
        {"symbol": "AAPL", "description": "APPLE INC", "weight": "0.0703"},
        {"symbol": "NVDA", "description": "NVIDIA CORP", "weight": "0.0808"},
        {"symbol": "BRK-B", "description": "BERKSHIRE HATHAWAY INC CLASS B", "weight": "0.014"},
        {"symbol": "PLTR", "description": "n/a", "weight": "0.0065"},
        {"symbol": "n/a", "description": "US DOLLAR", "weight": "0.0003"},
        {"symbol": "n/a", "description": "HOLOGIC INC CVR", "weight": "0.0"},
    ]
    + [{"symbol": f"X{i}", "description": f"COMPANY {i}", "weight": "0.001"} for i in range(12)],
}


class ParseTest(unittest.TestCase):
    def test_keeps_the_ten_largest_real_holdings(self) -> None:
        row = parse("VOO", SAMPLE)
        self.assertEqual(len(row["top_holdings"]), TOP)
        self.assertEqual([h["symbol"] for h in row["top_holdings"][:3]], ["NVDA", "AAPL", "BRK.B"])
        # Cash and contingent rights are not companies; the count leaves them out too.
        self.assertEqual(row["holdings_count"], 16)
        # A holding without a name keeps its ticker as the name.
        self.assertEqual(next(h for h in row["top_holdings"] if h["symbol"] == "PLTR")["name"], "PLTR")

    def test_reads_the_fund_facts(self) -> None:
        row = parse("VOO", SAMPLE)
        self.assertAlmostEqual(row["expense_ratio"], 0.0003)
        self.assertAlmostEqual(row["dividend_yield"], 0.0098)
        self.assertEqual(row["inception_date"], "2010-09-07")
        self.assertEqual(row["as_of"], "2026-10-02 00:01+00:00")
        self.assertEqual(row["source_url"], SOURCE_URL["VOO"])

    def test_sectors_are_sorted_and_empty_ones_dropped(self) -> None:
        row = parse("VOO", SAMPLE)
        self.assertEqual([s["sector"] for s in row["sectors"]], ["Information Technology", "Financials"])

    def test_a_rate_limit_note_is_raised(self) -> None:
        with self.assertRaises(ValueError) as caught:
            parse("VOO", {"Note": "Thank you for using Alpha Vantage! Our standard API rate limit is 25 requests per day."})
        self.assertIn("rate limit", str(caught.exception))

    def test_every_etf_has_an_issuer_page(self) -> None:
        self.assertEqual(len(SOURCE_URL), 15)
        self.assertTrue(all(url.startswith("https://") for url in SOURCE_URL.values()))


if __name__ == "__main__":
    unittest.main()
