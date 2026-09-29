import { redirect } from 'next/navigation'

import { getProfile, isSetupComplete } from '@/app/features/auth/api/profile'
import { getBenchmarks } from '@/app/features/benchmarks/api/benchmarks'
import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { T } from '@/app/features/preferences/copy'

import {
  BenchmarkToolCard,
  ProfileToolCard,
  QuizToolCard,
  SimpleToolCard,
  WalkthroughToolCard,
  type BenchmarkPreview,
} from '../components/ToolCards'

/**
 * Tools (Carlos, 2026-09-26): the things that shape how someone invests, as
 * cards. The quiz lives here for good -- take it, view the results, retake
 * it -- alongside the profile, the index benchmarker, the calculators and the
 * export tool (2026-09-29), and the first-trade walkthrough.
 */
export async function ToolsPage() {
  const [profile, risk, benchmarks] = await Promise.all([getProfile(), getCurrentRiskProfile(), getBenchmarks()])
  if (!profile) redirect('/login')

  // Each index's total gain over the whole window: the last normalised value
  // is growth from 100, so gain = last - 100 (in percent).
  const latest = benchmarks.growth.at(-1)
  const preview: BenchmarkPreview[] = benchmarks.indexes.flatMap((index) => {
    const last = latest?.[index.key]
    return typeof last === 'number'
      ? [{ key: index.key, label: index.isProxy ? `${index.label} (EPHE)` : index.label, totalGainPct: last - 100 }]
      : []
  })
  const since = benchmarks.growth[0]?.date.slice(0, 4) ?? null

  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        <T k="tools.subtitle" />
      </p>
      <div className="grid items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <QuizToolCard risk={risk ? { band: risk.band, score: risk.score, takenAt: risk.computed_at } : null} />
        <BenchmarkToolCard preview={preview} since={since} />
        <ProfileToolCard profile={profile} complete={isSetupComplete(profile)} />
        <SimpleToolCard
          icon="returns"
          title="Returns calculator"
          body="Replay real prices: what money in an index, fund or stock would be worth today, and what that buys."
          badge="Indices · 50 stocks"
          href="/tools/returns"
          action="Run the numbers"
        />
        <SimpleToolCard
          icon="savings"
          title="Savings goal"
          body="How much to put away each week, fortnight or month to reach a target by a date."
          href="/tools/savings"
          action="Plan a goal"
        />
        <SimpleToolCard
          icon="export"
          title="Export my data"
          body="Download your trades, holdings, performance and profile as CSV or an HTML report. Nothing leaves your browser."
          badge="CSV · HTML"
          href="/tools/export"
          action="Build a report"
        />
        <WalkthroughToolCard quizDone={Boolean(risk)} />
      </div>
    </>
  )
}
