import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MenuToggleIcon } from "@/components/menu-toggle-icon";
import { getProfile, isSetupComplete } from "@/app/features/auth/api/profile";
import { getBenchmarks } from "@/app/features/markets/benchmarks/api/benchmarks";
import { getCurrentRiskProfile } from "@/app/features/tools/quiz/api/submit";
import { MANULIFE_TOOLS_URL } from "@/app/features/userData/frame/nav";
import { T, type CopyKey } from "@/app/features/userData/preferences/copy";

import {
  BenchmarkToolCard,
  LifeInsuranceToolCard,
  ProfileToolCard,
  QuizToolCard,
  SimpleToolCard,
  TourToolCard,
  WalkthroughToolCard,
  type BenchmarkPreview,
} from "../components/ToolCards";

const GRID = "grid items-stretch gap-4 pb-2 lg:grid-cols-2 2xl:grid-cols-3";

/**
 * Tools (Carlos, 2026-09-26; sections 2026-09-30): every tool as a card,
 * grouped into drop-down sections the sidebar mirrors -- Let's get started,
 * Basics, Accounting, Life insurance and Tutorials.
 *
 * Guests get the sections that need no account: Basics, Accounting and Life
 * insurance. The quiz, profile, export and walkthroughs appear once signed in.
 */
const SECTIONS = ["started", "basics", "accounting", "insurance", "tutorials"] as const;

export async function ToolsPage({ open }: { open?: string }) {
  const [profile, risk, benchmarks] = await Promise.all([
    getProfile(),
    getCurrentRiskProfile(),
    getBenchmarks(),
  ]);

  // Each index's total gain over the whole window: the last normalised value
  // is growth from 100, so gain = last - 100 (in percent).
  const latest = benchmarks.growth.at(-1);
  const preview: BenchmarkPreview[] = benchmarks.indexes.flatMap((index) => {
    const last = latest?.[index.key];
    return typeof last === "number"
      ? [
          {
            key: index.key,
            label: index.isProxy ? `${index.label} (EPHE)` : index.label,
            totalGainPct: last - 100,
          },
        ]
      : [];
  });
  const since = benchmarks.growth[0]?.date.slice(0, 4) ?? null;

  const basics = (
    <div className={GRID}>
      <SimpleToolCard
        icon="returns"
        title="Returns calculator"
        body="Replay real prices: what money in an index, fund or stock would be worth today, and where it could go next."
        badge="10 & 15 years"
        href="/tools/returns"
        action="Run the numbers"
      />
      <SimpleToolCard
        icon="savings"
        title="Savings planner"
        body="How much to put away for a goal, plus an emergency fund in a Maya, CIMB, MariBank or GoTyme deposit, after tax."
        badge="Time deposits"
        href="/tools/savings"
        action="Plan a goal"
      />
      <SimpleToolCard
        icon="purchasing"
        title="Purchasing power"
        body="What a peso or dollar from any year since 1960 is worth today, and how fast cash loses value."
        badge="World Bank CPI"
        href="/tools/purchasing-power"
        action="Compare the years"
      />
      <SimpleToolCard
        icon="budget"
        title="Budget 50/30/20"
        body="Split take-home pay into needs, wants and savings, with Philippine or international presets."
        badge="Needs · wants · savings"
        href="/tools/budget"
        action="Plan my month"
      />
      <SimpleToolCard
        icon="dca"
        title="DCA vs lump sum"
        body="A little every month or all at once? Replay both on real prices and see which won, and how often."
        badge="Real history"
        href="/tools/dca"
        action="Compare the two"
      />
      <SimpleToolCard
        icon="waiting"
        title="The cost of waiting"
        body="The same monthly savings started today or 5, 10 or 15 years from now, side by side at retirement."
        badge="Start now vs later"
        href="/tools/cost-of-waiting"
        action="See the gap"
      />
      <BenchmarkToolCard preview={preview} since={since} />
    </div>
  );
  const accounting = (
    <div className={GRID}>
      <SimpleToolCard
        icon="statements"
        title="Financial statements"
        body="Income statement, balance sheet and cash flow that check each other. Kept only in this browser."
        badge="Excel · CSV · HTML"
        href="/tools/statements"
        action="Build statements"
      />
    </div>
  );
  const insurance = (
    <div className={GRID}>
      <LifeInsuranceToolCard href={MANULIFE_TOOLS_URL} />
    </div>
  );

  const sections: Array<{ value: string; label: CopyKey; count: number; content: React.ReactNode }> = profile
    ? [
        {
          value: "started",
          label: "tools.section.started",
          count: 2,
          content: (
            <div className={GRID}>
              <QuizToolCard
                risk={risk ? { band: risk.band, score: risk.score, takenAt: risk.computed_at } : null}
              />
              <ProfileToolCard profile={profile} complete={isSetupComplete(profile)} />
            </div>
          ),
        },
        { value: "basics", label: "nav.tools.basics", count: 7, content: basics },
        { value: "accounting", label: "nav.tools.accounting", count: 1, content: accounting },
        { value: "insurance", label: "nav.tools.lifeInsurance", count: 1, content: insurance },
        {
          value: "tutorials",
          label: "nav.tools.tutorials",
          count: 4,
          content: (
            <div className={GRID}>
              <WalkthroughToolCard quizDone={Boolean(risk)} />
              <TourToolCard
                tour="account"
                title="Navigate your account"
                body="The sidebar, notifications, settings and your account menu, one at a time."
                steps={["Getting around", "Notifications", "Settings", "Your account"]}
              />
              <TourToolCard
                tour="markets"
                title="Navigate the markets"
                body="Search, the buyable list, today’s movers, the heatmap and the index comparison."
                steps={["Search", "What you can buy", "Movers", "Heatmap", "Indices"]}
              />
              <SimpleToolCard
                icon="export"
                title="Export my data"
                body="Download your trades, holdings, performance and profile as CSV or an HTML report. Nothing leaves your browser."
                badge="CSV · HTML"
                href="/tools/export"
                action="Build a report"
              />
            </div>
          ),
        },
      ]
    : [
        { value: "basics", label: "nav.tools.basics", count: 7, content: basics },
        { value: "accounting", label: "nav.tools.accounting", count: 1, content: accounting },
        { value: "insurance", label: "nav.tools.lifeInsurance", count: 1, content: insurance },
      ];

  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        <T k="tools.subtitle" />
      </p>
      {/* No boxes (Carlos, 2026-09-30): a divider between sections and a
          hamburger that becomes an X when a section is open. `?open=` (the
          sidebar's Basics → and Life insurance →) opens that section. */}
      <Accordion
        multiple
        defaultValue={
          SECTIONS.includes(open as (typeof SECTIONS)[number]) ? [open as string] : profile ? ["started", "basics"] : ["basics"]
        }
        className="border-y border-border"
      >
        {sections.map((section) => (
          <AccordionItem key={section.value} value={section.value} id={section.value} className="scroll-mt-24">
            <AccordionTrigger className="group/toggle items-center rounded-none py-4 text-base font-semibold hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden!">
              <span className="flex items-baseline gap-2">
                <T k={section.label} />
                <span className="figure text-xs font-normal text-muted-foreground">{section.count}</span>
              </span>
              <MenuToggleIcon className="ml-auto" />
            </AccordionTrigger>
            <AccordionContent className="pb-5 [&_a]:no-underline">{section.content}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </>
  );
}
