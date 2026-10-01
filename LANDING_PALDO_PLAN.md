# Skills, Higgsfield, landing redesign and "Paldo" (plan, 2026-10-02)

Carlos's brief, 2026-10-02:

1. Install three design skills globally and set up Higgsfield (CLI, sign-in,
   companion skills).
2. Redesign the landing page around real Papaldo components, animated on both
   desktop and phone frames, with Higgsfield helping on the visuals.
3. Add a mascot, **Paldo**, who appears in tutorials and next to the Papaldo Ka
   name.

Status (2026-10-02):
- **Part 1 is done, except your Higgsfield sign-in.** All design skills are
  installed and current. The Higgsfield CLI 1.1.26 and its 8 skills are installed
  (scripts read first).
- **Parts 2 and 3** wait on the Vibe Discovery answers (Q1–Q4) and Q7.

**Decisions so far (Carlos, 2026-10-02):**
- Installs approved.
- **Paldo is a cute, friendly carabao, or a bull for "bull run".** I sketch both
  in the character sheet and you pick one.
- Paldo sits beside the header wordmark.
- Higgsfield budget is **moderate**: a character sheet, about 6 poses and 1 short
  loop.

**Vibe answers (Carlos, 2026-10-02):**
- Q1, the place: a stock market.
- Q2, the feeling: calm and welcomed.
- Q3, the influences: Makati / BGC.
- Q4, never: a casino or gambling app.
- Q7: Paldo may talk later; for now Paldo stays silent.

---

## Vibe spec (landing-page-design) and design plan (frontend-design)

```
VIBE NAME: High Street Blue Hour
REFERENCE: A trading floor high in a BGC tower at blue hour. The glass towers turn
           navy, office windows light up one by one, and the night shift settles in
           for the US market open at 9:30 PM Manila time.
EMOTION:   Calm first, then welcomed (warm windows: someone is home).
COLLISION: Makati / BGC glass-tower district  x  the exchange ticker board.
ANTI-PATTERNS: Anything casino-like:
           - gold, jackpots, confetti or flashing red and green;
           - countdown pressure;
           - the words "bet", "win" or "jackpot". The slang hero copy says "bet a
             single peso" today and gets rewritten.
           Also no crypto hype and no stiff bank brochure.

COLORS (scene tokens; the theme decides the time of day):
  Dark = blue hour ("Glass & Sodium")
  - Sky top     #0D2231  deep blue-hour sky over Fifth Avenue
  - Horizon     #24485B  the teal glow behind the towers
  - Glass       #132B3B  tower silhouettes, with #2C5366 edges catching the last light
  - Window      #F2B45F  sodium-warm office lights: the "welcomed"
  - Street      #0F1D27  the page below the hero (deep slate, not the app's near-black)
  Light = morning on High Street
  - Sky #D3E5EE, horizon #F2F6F5, glass #8EA9B7, facet #E6EFF2, sun #F4C98B, street #F4F7F7
  Actions keep the brand --primary (lime in dark, near-black in light): real Buttons.

TYPOGRAPHY:
  - Display: Archivo, variable width. Expanded (wdth ~118) for headlines, like the
    lettering on Ayala towers. Condensed (wdth ~78) with tabular figures for the
    ticker.
  - Body: Figtree, the app's own face, so the landing and the app read as one product.
  - Character: plain, steady, kind; no hype words.

LAYOUT:
  - Density: balanced, with generous air.
  - Shapes: rectangular towers, rounded devices.
  - Signature element: the real app on a laptop and a phone stands in front of a
    drawn BGC skyline. A street-level LED ticker band (real prices) runs along the
    skyline's base and is the hero's floor.

MOTION: subtle.
  - Signature: windows light up one by one across the skyline (in light mode,
    sunlight slides across the glass). It is the one orchestrated page-load moment.
  - Otherwise only: the ticker drifting slowly, device clips playing while on
    screen, and the How-it-works screens swapping as you scroll.
  - No fade-up entrance on every section.
  - Reduced motion: windows already lit, ticker still, video posters only.

WILDCARD: A calm Manila clock: "It's 7:42 PM in Manila. US markets open at 9:30 PM."
          This is the BGC night-shift rhythm, computed live, DST-aware, and calm (no
          seconds ticking). Paldo, a carabao in a business district, arrives later as
          the second wildcard.
```

**Design review against the brief (frontend-design's second pass):**
- Changed: the sections below the hero would have fallen back to the app's
  near-black + lime, which frontend-design names as a generic look. They now
  continue the scene: the street-level slate in dark mode, morning mist in light
  mode. Lime stays only on actions.
- Dropped from the current page:
  - the pill eyebrow badge;
  - the arrow icons in buttons;
  - the per-section fade-up entrances;
  - the identical icon-card grid.
- Kept numbered steps only in "How it works", because that content really is a
  sequence.

### Copy strategy

```
TOP 3 OBJECTIONS:
1. "Investing is gambling; I'll lose my money"
   -> headline hook, plus a "practice floor, not a casino" band
2. "I don't know where to start"
   -> How it works: the 6-question quiz, then guided tutorials
3. "It's not for someone like me / my small amounts"
   -> Learn step: cost averaging with small monthly amounts, the budget tool, pesos

HEADLINE: "Practice the stock market before you put in a peso."
  - Value prop: a practice stock market. Hook: the objection addressed (no money
    at risk).
  - Litmus test (would someone know what we sell from this alone?): yes.
SUBHEADLINE: "Start with $100,000 in practice money and real US market prices. Find
  your risk level in six questions, then learn by doing."
CTA: "Start practicing" (primary) / "See how it works" (secondary)
AUDIENCE: single persona, a first-time Filipino investor.
```

### Real components on two devices (how the clips are made)

- The app's real client components are rendered with sample data in
  `marketing/video` (Remotion), at true device viewports: a laptop at 1280×800 and
  a phone at 390×844. The phone clips therefore show the real phone layout,
  breakpoints included.
- They are encoded as short `webm` + `mp4` loops with a poster image, in
  `public/landing/`.
- On the page, each clip loads lazily and plays only while on screen.
- The renders are pure sample data: no Alpaca, Supabase or AI calls, and no real
  order is ever placed.
- **Scenes** (laptop + phone each):
  1. **Dashboard:** the performance line draws in.
  2. **Quiz result:** the score meter fills.
  3. **Trade:** quantity, then Review, then the confirm dialog.
  4. **Learn:** Tutorial Mode on Cost of Waiting.
  5. **Markets:** the heatmap colours fill in as the market opens.

---

## Part 1 — Skills and Higgsfield (machine setup, not the repo)

### What is already there (checked 2026-10-02 in `~/.claude/skills/`)

| Skill | State | Action |
|---|---|---|
| `frontend-design` (anthropics/skills) | Installed | Diff it against the GitHub `main` copy; update only if it changed. |
| `ui-ux-pro-max` | Installed | The vault has the source clip (`raw/nextlevelbuilderui-ux-pro-max-skill…md`). Compare versions; update from the original repo if newer. The vault's `raw/` is never edited. |
| `landing-page-design` (2389-research) | **Missing** | Install as `~/.claude/skills/landing-page-design/SKILL.md` from the repo's `skills/SKILL.md`. |

**Before any skill is installed,** I read the whole `SKILL.md` and anything it
ships (scripts, data). A skill runs with my permissions, so nothing goes in that I
have not read. The landing-page skill is a single Markdown file, which is low risk.

### Higgsfield (all three steps need your yes; they download and run code)

1. **The CLI.** `npm i -g @higgsfield/cli` (checked: v1.1.26, published by
   Higgsfield staff, source `github.com/higgsfield-ai/cli`). Before running it,
   I look at the package's install scripts.
2. **Sign-in.** `higgsfield auth login` opens a browser, and **you** sign in there.
   I never type the credentials. The token stays wherever the CLI keeps it
   (outside the repo), and I never print or copy it.
3. **The companion skills.** `npx skills add higgsfield-ai/skills`. I read what it
   installs before using it, the same rule as above.
4. **Check:** `higgsfield --version` and one tiny test image, run **only after you
   say how many credits it may use**. Generation costs credits on your account.

**Rules for Higgsfield output:**
- It never includes a real person's face or likeness, or a brand's logo (no bank
  or Alpaca marks).
- Every asset is saved under `public/brand/` with a note of the prompt and model,
  so it can be regenerated.

## Part 2 — Landing page redesign

### Direction (the landing-page skill's "Vibe Discovery" comes first)

The `landing-page-design` skill requires four answers before any design (Q1–Q4
below). I combine them with the brand we already have:
- the Midnight palette and the lime highlight;
- the Figtree typeface;
- the "test your instincts before you risk a peso" voice;

and turn the result into one written direction (type scale, colour roles, motion
style, what we avoid). `frontend-design` and `ui-ux-pro-max` check that direction
for contrast, spacing and accessibility.

### Real components, not screenshots or mockups

The current hero already renders the real `MockDashboard`. The redesign goes
further. Each feature section shows a **live, self-playing component** inside a
device frame:

| Section | Real component | What plays |
|---|---|---|
| Hero | Dashboard: balance, chart, holdings | The balance ticks up and a buy appears in Activity. |
| Know your risk | `QuizToolCard` | The score meter fills to a band. |
| Trade | Order ticket, then the confirm dialog | Typing a quantity, Review, Execute. |
| Markets | Sector heatmap, from the cached snapshot | Tiles recolour. |
| Learn by doing | Cost of Waiting / cost averaging with `LessonCard` | The lines draw in, then the lesson appears. |
| Community | Chat with friend request | The messages arrive one by one. |

**How it plays:**
- A small `DemoPlayer` wrapper drives each component with timed steps. It reuses
  the Tutorial Mode `runDemo` hooks that already exist, so the demos are the
  app's own behaviour and not separate fakes.
- Everything uses **sample data in the browser**. The landing page makes no
  Supabase, Alpaca or AI calls, so it stays fast and free for guests.
- **Desktop and phone:** each section shows the same component twice, in a
  laptop frame and a phone frame (375 px wide, the phone layout). Side by side on
  desktop; on a phone, a swipeable pair with dots.
- **Motion** uses `motion` (already installed), plus `gsap` only for one
  scroll-linked hero sequence if the direction calls for it.
- `prefers-reduced-motion` shows the final frame, with no animation.
- Animation starts only when a section is on screen and pauses when it leaves,
  using `IntersectionObserver`.

**Where Higgsfield helps:**
- Paldo's poses and short loops (Part 3).
- An optional hero background loop (abstract, on-brand, no stock-photo people)
  and the Open Graph image.
- The product itself is never AI-generated: every UI on the page is the real
  component.

**Performance budget:**
- Largest Contentful Paint under 2.5 s on a mid-range phone.
- Videos are `webm`/`mp4` under 1.5 MB each, lazy-loaded, with a poster frame.
- Device frames are CSS, not images.

**Sections:** Hero → How it works (3 steps) → the feature sections above → Trust
and FAQ (existing, restyled) → CTA → Footer. Each new section gets its loading
state, and the page keeps its `loading.tsx`.

## Part 3 — Paldo, the mascot

**Design:**
- Generated with Higgsfield from one locked character sheet (front, ¾, side), so
  every pose matches.
- Then the poses: wave, point, think, cheer, sad (for a loss), plus a small head
  for the avatar.
- Then 2–4 s loops for the hero and the tutorial intro, if video is wanted.

**Files:**
- `public/brand/paldo/*.webp` (transparent);
- `paldo-head.png` at 64 and 128 px;
- optional `*.webm` loops with alpha, or a Lottie export if you prefer vector.

**Where Paldo appears:**
- **Tutorial Mode card** (desktop popover and the phone panel): Paldo's head
  beside the step title, and the pose changes with the step: question → think,
  result → point, lesson → cheer.
- **Next to the Papaldo Ka name** in the app header, the public nav, and
  optionally the browser-tab icon (favicon). ❓ Q6
- **Welcome dialog and Get Started dock:** Paldo introduces the first steps.
- **Landing hero:** Paldo waving beside the headline.

**Implementation:**
- One `<Paldo pose="wave" size="sm|md|lg" />` component in `src/components/brand/`,
  with an image and a decorative `alt=""` (the words around it carry the meaning).
- Reduced motion shows a still pose.
- Tutorial copy can say "Paldo:" in slang and brainrot only if you want a voice.
  ❓ Q7

## Order of work

| Step | What | Needs |
|---|---|---|
| 1 | Install `landing-page-design`; check the other two are current | Your OK to download |
| 2 | Install the Higgsfield CLI; **you** sign in; add its skills | Your OK; your browser sign-in |
| 3 | Vibe Discovery answers, then a written direction | Q1–Q4 |
| 4 | Paldo character sheet in Higgsfield, then your pick | Q5, credit budget |
| 5 | `DemoPlayer` and device frames, plus 2 sections end to end (hero + quiz) | — |
| 6 | Remaining sections, Paldo in tutorials and the header, favicon | Q6 |
| 7 | Checks: `verify:full`, `ui-checker` at 375 / 768 / 1440 in dark and light, Lighthouse on mobile, reduced-motion pass | — |

The page is redesigned in a branch-free working copy as usual, and nothing is
committed until you say so.

## Open questions

**Vibe Discovery** (the landing-page skill asks these word for word):

1. **Q1:** What real place or object would Papaldo be? (e.g. "a jeepney dashboard
   at dawn", "a sari-sari store ledger", "a trading floor in a comic book")
2. **Q2:** The one emotion in the first 3 seconds: Confident, Curious, Calm,
   Energized, Welcomed…?
3. **Q3:** Two unexpected influences to collide (e.g. "Pinoy street signage +
   Bloomberg terminal").
4. **Q4:** What it must never be mistaken for (e.g. "a crypto casino", "a bank
   app", "an AI slop template").

**Paldo:**

5. **Q5:** What Paldo is and looks like:
   - a character (he, she, or deliberately neither), an animal (carabao? owl?), or
     a small robot;
   - the style: 3D-rendered, flat illustration, or pixel.
6. **Q6:** "Beside the Papaldo Ka tab page": the header wordmark, the browser-tab
   favicon, or both?
7. **Q7:** Does Paldo talk in the tutorials, in the first person ("Paldo: tap
   here…"), or stay a silent face?

**Budget:**

8. **Q8:** How many Higgsfield credits may Paldo and the hero visuals use?
