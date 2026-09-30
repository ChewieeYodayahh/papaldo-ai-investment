"""Offline tests for cpi.parse -- a trimmed World Bank response, no network.

    python -m unittest discover -s python
"""

import unittest

from cpi import SOURCE, parse

SAMPLE = [
    {"page": 1, "pages": 1, "per_page": 1000, "total": 5},
    [
        {"countryiso3code": "PHL", "date": "2025", "value": 162.309740706683},
        {"countryiso3code": "USA", "date": "2025", "value": None},
        {"countryiso3code": "USA", "date": "2024", "value": 143.857336014608},
        {"countryiso3code": "PHL", "date": "1960", "value": 1.1289570744394},
        {"countryiso3code": "JPN", "date": "2024", "value": 110.0},
    ],
]


class ParseTest(unittest.TestCase):
    def test_keeps_published_years_for_the_two_countries_sorted(self) -> None:
        rows = parse(SAMPLE)
        self.assertEqual([(r["country"], r["year"]) for r in rows], [("PHL", 1960), ("PHL", 2025), ("USA", 2024)])
        self.assertAlmostEqual(rows[1]["cpi"], 162.309740706683)
        self.assertTrue(all(r["source"] == SOURCE for r in rows))

    def test_an_error_message_instead_of_data_is_raised(self) -> None:
        with self.assertRaises(ValueError) as caught:
            parse([{"message": [{"id": "120", "value": "Invalid value"}]}])
        self.assertIn("Unexpected World Bank response", str(caught.exception))


if __name__ == "__main__":
    unittest.main()
