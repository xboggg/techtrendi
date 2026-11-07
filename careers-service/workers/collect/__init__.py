"""Job collection from approved sources (D-010, D-024 step 3).

  model.py        the Job record every adapter produces
  http.py         polite, budgeted HTTP client (one per run)
  text.py         HTML to plain text, short summaries
  eligibility.py  Ghana / Nigeria eligibility from explicit evidence only (D-007)
  quality.py      reasons a job must wait for a human (scam signs, stale)
  adapters.py     one function per source system
  runner.py       the `source_fetch` work handler: fetch, check, store, expire
"""
