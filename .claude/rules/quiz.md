---
paths:
  - "src/app/features/tools/quiz/**"
---

# ISQ (investing quiz) rules

- ISQ scoring is a reconstruction, not from source data. It is isolated to
  `features/tools/quiz/questions.ts` and `scoring.ts` for that reason —
  change both together and update the tests. Since 2026-09-26 the wording is
  our own plain-language rewrite, exactly three choices per question
  (0/10/20).
- A person's band is `Low | Medium | High` (`risk_profiles`); an asset's tier
  is `conservative | moderate | aggressive` (`tradable_assets.risk_tier`).
  They are different axes: map between them explicitly, never compare them.
