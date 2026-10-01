# Papaldo Ka — marketing video

A 40-second promo (1920 × 1080, 30 fps) built with [Remotion](https://www.remotion.dev),
following the official `remotion-best-practices` agent skill. It is its own package: the
Next app's typecheck, lint and build ignore `marketing/`.

## Scenes (`src/scenes/`)

| # | Scene | What it shows |
|---|-------|---------------|
| 1 | Hook | "Test your investing instincts before you risk a peso." |
| 2 | Problem | Investing feels scary with real money, plus three beginner questions |
| 3 | Brand | PAPALDO KA wordmark and the landing badge |
| 4 | Quiz | The app's real question 5, answered, then "You are a Moderate Investor" |
| 5 | Trade | $100,000 simulated cash: chart, green Buy, confirmation, filled |
| 6 | Markets | Search, then a heatmap (illustrative tiles) |
| 7 | Tools | Six tools, each with a figure the app produced (checked 2026-09-30) |
| 8 | Learn | Tutorial Mode spotlight, languages, themes |
| 9 | CTA | Get Started, papaldo-ka.vercel.app, "Simulated trading only…" |

Every scene is also registered on its own (folder `PapaldoPromo-Scenes`), so it can be
edited in Studio with its own timeline.

## Preview and render

```bash
npm run dev                      # Remotion Studio (the app's launch config uses port 3002)
npx remotion render PapaldoPromo out/papaldo-promo.mp4
```

## Version pin

All Remotion packages are pinned to **4.0.530**. 4.0.531 (published 2026-09-30) ships an
empty `@remotion/cli/dist/render-queue/queue.js`, and the Studio fails with
`getRenderQueue is not a function`. Upgrade only once a newer release fixes it.

Remotion is free for individuals and teams of up to 3; see remotion.pro/license.
