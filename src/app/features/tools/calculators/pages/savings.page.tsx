import { getHistory, INDEX_OPTIONS } from '../api/history'
import type { RatePreset } from '../components/SavingsGoalCalculator'
import { EmergencyFundPlanner } from '../components/EmergencyFundPlanner'
import { SavingsGoalCalculator } from '../components/SavingsGoalCalculator'
import { lastYears, seriesCagr } from '../math'

/** Ten years is the window the presets quote, like the benchmarker's middle range. */
const PRESET_YEARS = 10

/**
 * `/tools/savings` -- the Savings & Investment Goal calculator. The return
 * presets are each index's real CAGR over the last ten years.
 */
export async function SavingsPage() {
  const histories = await Promise.all(INDEX_OPTIONS.map((option) => getHistory(option.value)))
  const presets: RatePreset[] = histories.flatMap((history) => {
    if (!history.ok) return []
    const cagr = seriesCagr(lastYears(history.points, PRESET_YEARS))
    return cagr === null ? [] : [{ label: `${history.label} 10Y`, ratePct: cagr }]
  })

  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Work out how much to save for a goal. Start from a steady yearly return, or tap an index to use its real
        growth over the last ten years.
      </p>
      <SavingsGoalCalculator presets={presets} />
      <h2 className="mt-8 mb-1 text-lg font-semibold tracking-tight">Emergency fund</h2>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Before investing for a goal, most planners keep three to six months of expenses in cash. See what that
        fund earns in a Philippine time deposit, after tax, next to investing it.
      </p>
      <EmergencyFundPlanner />
    </>
  )
}
