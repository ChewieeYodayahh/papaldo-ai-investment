# Tools as lessons, plus mobile fixes (plan, 2026-10-01)

Carlos's brief, 2026-10-01: the tools are for **simulation and education**. Every
tool should say what it answers, show the result in plain words, and leave
the user with one lesson. On top of that come mobile fixes for the tutorial
cards, oversized components, the header avatar and both profile pages.

Status: **built 2026-10-01** (steps A–G; see PROGRESS.md). The ❓ marks
point to the decision each item depends on.

---

## 1. One lesson shape for every tool

Every tool page uses the same five parts, top to bottom:

| Part | What it is | Example (DCA vs lump sum) |
|---|---|---|
| **Question** | The page description: one line, the question the tool answers. | "Should you invest all at once, or a little every month?" |
| **Inputs** | Each field gets a **[?]** that opens a one-line meaning. | Monthly amount [?] · Index [?] · Period [?] |
| **Result** | One sentence in second person ("you"), with real numbers, no jargon. | "You put $1,200 into the S&P 500 from Oct 2025 to Sep 2026." |
| **Verdict** | One bold line. | "All at once ended **$59 ahead**." |
| **The lesson** | 2–3 short sentences, plus key terms with [?]. Same card on every tool. | See §3 |

**Shared pieces to build once** (in `tools/calculators/components/`):

- **`TermHelp`:** the [?] popover. It generalises `markets/components/StatHelp.tsx`,
  which already has the en/slang/brainrot copy and a "Learn more" link to
  Investopedia, opening in a new tab with `rel="noopener noreferrer"`. It works by
  tap on phones.
- **`LessonCard`:** the "What this teaches" card: an icon, 2–3 sentences, and term
  chips with [?].
- **`ResultHeadline`:** the result sentence plus the verdict line.
- **`CurrencySwitch`:** a $ / ₱ segmented toggle in each tool's header. It flips the
  same display-currency preference as Settings, so every figure, input and chart
  switches together. `AmountField` already types in the display currency. ❓Q4

Fine print stays at the bottom in `text-xs`: "real prices, no dividends or fees,
not financial advice".

## 2. Tools hub (`/tools`) — item [2]

- **Section titles** (Basics 7, Accounting 1, …):
  - add inner padding `px-4 sm:px-5` to the `AccordionTrigger` and the content, so
    the title and the hamburger no longer touch the border;
  - give the row a `min-h-14`.
- **3 per row:** `GRID` goes from `lg:grid-cols-2 2xl:grid-cols-3` to
  `sm:grid-cols-2 lg:grid-cols-3`.
- **Remove the corner badges** ("10 & 15 years", "Time deposits", "World Bank CPI",
  "Excel · CSV · HTML", …) on every card. The tool icon tile stays.
- **Card bodies** become the one-line question from §3. They're shorter, so a
  3-column row stays even.

## 3. Per-tool rewrite (text and lesson)

The copy below is the proposal. Figures in it are examples; the real ones come
from the calculation.

### DCA vs lump sum (`/tools/dca`) — item [4]
- **Title:** "Cost averaging vs lump sum".
- **Question:** "Should you invest all at once, or a little every month?"
- **Inputs:**
  - Index or stock [?];
  - Monthly amount [?] "What you'd put in each month";
  - Period [?].
- **Result:** "You put **$1,200** into the **S&P 500** between **Oct 2025** and
  **Sep 2026**: either **$100 every month**, or **all $1,200 on day one**."
- **Verdict:** "All at once ended **$59 ahead**." (or "Monthly ended … ahead")
- **Stats** are renamed for plain reading: "Monthly: $1.3K", "All at once: $1.4K",
  "Avg price paid, monthly", "Price paid, all at once".
- **The lesson** (replaces the "170 1-year windows" paragraph):
  > Markets rise more often than they fall, so money invested sooner usually ends
  > ahead — it did in **83%** of past 1-year periods. Investing monthly wins when
  > prices drop first, and it's how most people invest from a salary.
  > **Starting matters more than timing.**
- **Terms:**
  - **Cost averaging (DCA) [?]:** "Investing the same amount on a schedule. You
    buy more shares when prices are low and fewer when they're high."
  - **Lump sum [?]:** "Investing all your money at once."

### The cost of waiting (`/tools/cost-of-waiting`) — item [3] (new model)
The tool flips from "what you'd end up with" to **"what you must save each month
to retire on the income you want"**: the later you start, the more you need.

- **Inputs, each with [?]:**
  - **Your age**: "How old you are today."
  - **Retirement age**: "When you want to stop working."
  - **Retirement income**: "What you want to live on each month once you stop
    working, in today's money." It's prefilled from the profile when set (❓Q3).
  - **Expected return**: "7% is a common planning figure for an index fund. Not
    guaranteed."
- **The maths** (new `requiredMonthly()` in `strategies.ts`, with unit tests):
  - **target** = monthly retirement income × 12 × 25 (the "4% rule") ❓Q1;
  - **monthly saving needed** = target × r / ((1+r)^n − 1), where r is the monthly
    return and n is the months from the start age to retirement.
- **Result cards:** "Start at **22**: **$310/mo**" · "Start at 27: $470/mo" ·
  "Start at 32: $730/mo" · "Start at 37: $1,190/mo".
- **Chart:** monthly saving needed by start age (a rising line), not the balance.
- **Verdict:** "Waiting 10 years means saving about **2×** as much every month." (At 7%,
  22→60 against 32→60 is 2.2×, compounded monthly.)
- **The lesson:**
  > Money saved early has more years to grow, so it does more of the work. Every
  > year you wait, each month has to carry more.
- **Terms:**
  - **Compound growth [?]**;
  - **4% rule [?]:** "A planning rule: you can spend about 4% of your savings a year
    in retirement."
- **Profile:** the label "Ideal income" becomes **"Retirement income"** with a [?],
  on `/profile` (`ProfileCards.tsx:239`) and in the setup journey
  (`ProfileSetupJourney.tsx:217`). The column stays `ideal_income`, so there's no
  migration. ❓Q3
- **Fix the legend order** in the current chart (it reads Start, 10, 15, 5).

### Returns calculator (`/tools/returns`) — item [6]
- **Question:** "What if you had invested back then?"
- **Description:** "Pick an index, fund or stock and an amount. See what it would be
  worth today on real prices, and where it could go if the trend held."
- **Result:** "You put **$1,000** into the **S&P 500** in **Oct 2015**."
- **Verdict:** "Today it's worth **$3,100**: about **3×** your money."
- **The lesson:**
  > The dips along the way recovered; staying invested did most of the work.
  > A projection is only the past trend, not a promise.
- **Terms:**
  - **Index fund [?]**;
  - **Average yearly growth (CAGR) [?]**;
  - **Projection [?]**.

### Savings planner (`/tools/savings`) — item [6]
- **Question:** "How much should I save each month to reach my goal?"
- **Description:** "Set a goal and a date. See the monthly amount, and keep an
  emergency fund in a bank deposit while you invest the rest."
- **One chart instead of two:**
  - The goal calculator's chart shows the investing balance and the goal line.
  - A checkbox, **"Include an emergency fund"**, adds the time-deposit line to the
    same chart and opens the fund inputs (months of expenses, bank) inline.
  - `EmergencyFundPlanner` becomes a section of `SavingsGoalCalculator`; its own
    chart is removed.
- **Bank picker with logos** (Maya, CIMB, MariBank, GoTyme), each showing its rate
  and term, from a CDN (❓Q5). `deposit-rates.ts` gains a `domain` per bank; the
  picker shows initials if the image fails.
- **Result:** "Save **$210 a month** for 5 years to reach **$15,000**."
- **The lesson:**
  > Keep 3–6 months of expenses somewhere safe and easy to reach first, then invest
  > for the goal. A deposit is steady; investing grows faster but moves.
- **Terms:**
  - **Emergency fund [?]**;
  - **Time deposit [?]**;
  - **20% withholding tax [?]**;
  - **PDIC insurance [?]**: "up to ₱1M per depositor, per bank".

### Purchasing power (`/tools/purchasing-power`)
- **Question:** "What is money from back then worth today?"
- **Result:** "**₱1,000** in **2010** buys what **₱1,640** buys today."
- **Verdict:** "Cash lost **39%** of its value."
- **The lesson:**
  > Prices rise every year, so money that sits still quietly shrinks. Investing aims
  > to grow faster than prices do.
- **Terms:**
  - **Inflation [?]**;
  - **CPI [?]**.

### Budget 50/30/20 (`/tools/budget`)
- **Question:** "Where should my pay go each month?"
- **Result:** "Needs take **58%** of your pay, **8% over** the 50% guide."
- **The lesson:**
  > Needs first, a little fun, and pay yourself next. Even 10% saved every month
  > builds the habit; raise it when you can.
- **Terms:**
  - **Needs / Wants / Savings [?]**;
  - **Take-home pay [?]**.

### Financial statements (`/tools/statements`)
- **Question:** "What do the three financial statements say about an organisation?"
- **Result:** "Profit this year: ₱42,000 · Cash went up ₱18,000 · The books
  balance ✓".
- **The lesson:**
  > Three views of one story: the income statement shows profit, the balance sheet
  > shows what you own and owe, and cash flow shows where the cash actually went.
- **Terms:**
  - **Assets [?]**;
  - **Liabilities [?]**;
  - **Equity / net assets [?]**;
  - **Net income [?]**.

### Benchmarks and the quiz
- **Benchmarks question:** "How did the PSEi do against US markets?"
- **Benchmarks lesson:**
  > Spreading money across markets smooths the ride.
- **Quiz results** get one lesson line for each band, e.g. Medium:
  > You can ride some ups and downs. A mix of stock and bond funds fits.

## 4. Tutorials — concise and specific

Each tool's tour is cut to **4 steps or fewer**, each body **20 words or fewer**,
always in this order:

1. **The question:** what this tool answers.
2. **Your inputs:** what to fill in, and why.
3. **The result:** how to read the headline and the chart.
4. **The lesson:** the one takeaway.

- "Show me" demos stay.
- Copy goes in `tutorials/copy.ts`. The existing test checks every step has a
  title and body.
- **Example** (DCA, step 4): "The lesson — money in sooner usually wins, but
  monthly investing protects you from bad timing."

## 5. Mobile — items [1] and [5]

- **Tutorial card ("the modal") on phones:**
  - below 640 px it becomes a **bottom sheet**: full width, `max-h-[45vh]`, smaller
    padding and text-sm;
  - the highlighted target scrolls into the **upper half**, so the card never
    covers it (today it sits on top of the target);
  - desktop keeps the anchored popover;
  - checked at 375 px on every tour.
- **Components too big:**
  - Phase 3 set the phone root to 16 px, which made everything about 18% bigger.
    Bring it to **15 px**.
  - Under 640 px only:
    - card padding `p-4`;
    - page titles `text-xl`;
    - stat figures `text-lg`;
    - tool-card buttons `size="sm"`;
    - chart height 220 px.
  - Desktop is unchanged.
  - Checked at 375 and 400 px with `ui-checker`.
- **Header avatar [5]:** on phones the avatar wraps under a long title
  ("PAPALDO KA, David"). The fix:
  - row 1 is sidebar toggle · spacer · **bell · settings · avatar** (all 40 px
    icons);
  - row 2 is the page title, truncated to one line;
  - desktop stays one row.

## 6. Profile pages — item [7]

- **`/profile` header card:**
  - avatar with "+", the name, `@username` and the risk badge, all on one line on
    desktop and stacked on phones;
  - **remove** "Simulated account · no real money";
  - **remove** the email from the header (it stays in the email field below).
- **Links become a tidy list** under the header, settings-style rows with ›:
  - Member profile & friends ›
  - Export my data ›
  - Sign out (destructive tone, last)
- **`/u/[username]` (member profile):**
  - the friend action moves to its own full-width row under the name on phones;
  - the "Request sent" label and "Cancel request" become **one** button,
    "Requested ✓", with a menu offering **Cancel request**;
  - the balance card tightens: label, amount, then allocation;
  - holdings list rows are 48 px.

## 7. Order of work

| Step | What | Needs answers? |
|---|---|---|
| A | Tools hub padding, 3 per row, badges removed; Cost of Waiting legend order | no |
| B | Header avatar row; profile and member-profile cleanup; mobile size scale; tutorial bottom sheet | no |
| C | Shared `TermHelp`, `LessonCard`, `ResultHeadline`, `CurrencySwitch` | Q4 |
| D | Copy rewrite for DCA, Returns, Purchasing power, Budget, Statements, Benchmarks, Quiz | no |
| E | Cost of Waiting new model, with tests; "Retirement income" rename | Q1–Q3 |
| F | Savings planner single chart, emergency-fund toggle, bank logos | Q5 |
| G | Tutorials rewritten to the 4-step shape | after D–F |

**Each step ends with:**
- `npm run verify`;
- `ui-checker` at 375 px, 768 px and desktop, in dark and light;
- a PROGRESS.md entry.

`verify:full` runs at the end.

## 8. Decisions (Carlos, 2026-10-01)

1. **Retirement target:** the 4% rule. Target = 25 × yearly retirement income.
2. **Inflation:** retirement income is typed in today's money and grown to
   retirement by long-run inflation: PH about 4%, from the World Bank CPI already
   in `cpi_annual`, and the USA figure when the display currency is $.
3. **Profile field:** "Ideal income" is relabelled **"Retirement income"** (yearly)
   everywhere, with a [?]. The tool asks monthly and prefills yearly ÷ 12. There's
   no migration.
4. **$ / ₱ toggle:** it flips the site-wide display currency (recommended default;
   not asked).
5. **Bank logos:** Google's favicon CDN,
   `https://www.google.com/s2/favicons?domain=<bank domain>&sz=128`, with initials as the fallback.
6. **Languages:** English first; slang and brainrot fall back to it (recommended
   default; not asked).
