---
paths:
  - "python/**"
  - ".github/workflows/**"
---

# Pipeline rules

- `python/` pipelines (Python 3.12, `python/.venv`) write market data with the
  service-role key; `.github/workflows/market-data.yml` runs them weekly.
- Never script past a site's bot or browser check (Stooq's included). A
  pipeline that meets one logs it and falls back to the next source.
- Commands:
  `python/.venv/Scripts/python -m unittest discover -s python` ·
  `python/.venv/Scripts/python python/benchmarks.py --dry-run`.
  Create the venv with `uv venv python/.venv --python 3.12` and
  `uv pip install --python python/.venv/Scripts/python.exe -r python/requirements.txt`.
