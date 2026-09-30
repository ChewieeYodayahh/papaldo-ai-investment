---
paths:
  - "src/**/*.tsx"
  - "src/**/*.jsx"
  - "src/app/globals.css"
---

# UI rules

- Colors: Tailwind tokens only — `bg-primary`, `text-muted-foreground`,
  `border-border`. Never `bg-blue-500` or a hardcoded hex. Palette is OKLCH,
  defined at `:root` in `src/app/globals.css`.
- Light and dark themes both ship (`next-themes`, `attribute="class"`,
  light/dark/system); the `.dark` palette is in `globals.css`. Phase 1 had
  dark mode off because components used a fixed light palette — that is why
  the token rule is load-bearing: a hardcoded color renders dark-on-dark.
- Gains and losses use `text-gain` / `text-loss`. Palettes live in
  `globals.css` under `[data-palette=...]`; add a new token to every palette.
  Heatmap colours are the `--heat-*` tokens.
- Never hand-roll a primitive that exists in `src/components/ui/` (shadcn
  base-nova, built on Base UI: triggers take `render={<Button />}`, not
  `asChild`).
- Money on screen goes through `<Money usd={...} />`, which converts to PHP at
  render time. Never store or compute a converted figure server-side. One
  exception: self-reported incomes (`users.annual_income` / `ideal_income`)
  are shown in the currency they were entered in (`auth/income.ts`) and are
  never converted.
- Copy goes through `useCopy()` keys in
  `features/userData/preferences/copy.ts`; add the English key, the other
  dictionaries fall back to it.
- Chart lines get a dot on every data point: `pointDot()` from
  `src/lib/chart-dots.ts`.
- Every new route gets a `loading.tsx` skeleton built from
  `src/components/skeleton-blocks.tsx`, laid out like the page it replaces.
