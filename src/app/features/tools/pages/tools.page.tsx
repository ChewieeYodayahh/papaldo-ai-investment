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

const GRID = "grid items-stretch gap-3 pb-2 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3";

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

  const basics = (
    <div className={GRID}>
      <SimpleToolCard
        icon="returns"
        title="tool.returns.title"
        body="tool.returns.body"
        href="/tools/returns"
        action="tool.returns.action"
      />
      <SimpleToolCard
        icon="savings"
        title="tool.savings.title"
        body="tool.savings.body"
        href="/tools/savings"
        action="tool.savings.action"
      />
      <SimpleToolCard
        icon="purchasing"
        title="tool.purchasing.title"
        body="tool.purchasing.body"
        href="/tools/purchasing-power"
        action="tool.purchasing.action"
      />
      <SimpleToolCard
        icon="budget"
        title="tool.budget.title"
        body="tool.budget.body"
        href="/tools/budget"
        action="tool.budget.action"
      />
      <SimpleToolCard
        icon="dca"
        title="tool.dca.title"
        body="tool.dca.body"
        href="/tools/dca"
        action="tool.dca.action"
      />
      <SimpleToolCard
        icon="waiting"
        title="tool.waiting.title"
        body="tool.waiting.body"
        href="/tools/cost-of-waiting"
        action="tool.waiting.action"
      />
      <BenchmarkToolCard preview={preview} />
    </div>
  );
  const accounting = (
    <div className={GRID}>
      <SimpleToolCard
        icon="statements"
        title="tool.statements.title"
        body="tool.statements.body"
        href="/tools/statements"
        action="tool.statements.action"
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
                title="tool.tourAccount.title"
                body="tool.tourAccount.body"
                steps={["Getting around", "Notifications", "Settings", "Your account"]}
              />
              <TourToolCard
                tour="markets"
                title="tool.tourMarkets.title"
                body="tool.tourMarkets.body"
                steps={["Search", "What you can buy", "Movers", "Heatmap", "Indices"]}
              />
              <SimpleToolCard
                icon="export"
                title="tool.export.title"
                body="tool.export.body"
                href="/tools/export"
                action="tool.export.action"
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
            <AccordionTrigger className="group/toggle min-h-14 items-center rounded-none px-4 py-4 text-base font-semibold sm:px-5 hover:no-underline [&_[data-slot=accordion-trigger-icon]]:hidden!">
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
