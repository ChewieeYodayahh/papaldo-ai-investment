---
paths:
  - "src/app/features/onboarding/**"
---

# ISQ rules

- ISQ scoring is a reconstruction, not from source data. It is isolated to
  `features/onboarding/questions.ts` and `scoring.ts` for that reason —
  change both together and update the tests. Since 2026-09-26 the wording is
  our own plain-language rewrite, exactly three choices per question
  (0/10/20).
