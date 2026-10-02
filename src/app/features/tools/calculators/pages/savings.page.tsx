import { getHistory, INDEX_OPTIONS } from '../api/history'
import { ToolIntro } from '../components/lesson'
import type { RatePreset } from '../components/SavingsGoalCalculator'
import { SavingsGoalCalculator } from '../components/SavingsGoalCalculator'
import { lastYears, seriesCagr } from '../math'

/** Ten years is the window the presets quote, like the benchmarker's middle range. */
const PRESET_YEARS = 10

/**
 * `/tools/savings` -- the Savings & Investment Goal calculator, with the
 * emergency fund in a bank deposit on the same chart (2026-10-01). The return
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
      <ToolIntro tour="savings" question="tool.savings.q">
        Set a goal and a date to see the monthly amount. Keep an emergency fund safe in a bank deposit while you
        invest the rest: both show on one chart.
      </ToolIntro>
      <SavingsGoalCalculator presets={presets} emergencyFund />
    </>
  )
}
