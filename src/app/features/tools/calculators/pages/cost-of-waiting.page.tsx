import { getProfile } from '@/app/features/auth/api/profile'

import { getCpi } from '../api/cpi'
import { CostOfWaiting } from '../components/CostOfWaiting'
import { ToolIntro } from '../components/lesson'
import { averageInflation, cpiAt, type CpiPoint } from '../inflation'

/** How far back the default inflation figure looks. */
const INFLATION_YEARS = 20

/**
 * `/tools/cost-of-waiting` -- the monthly saving a retirement income needs,
 * starting now or later. Open to guests; a signed-in user's retirement income
 * fills the field. Inflation defaults to each country's last 20 years.
 */
export async function CostOfWaitingPage() {
  const [profile, cpi] = await Promise.all([getProfile(), getCpi()])

  return (
    <>
      <ToolIntro tour="waiting" question="tool.waiting.q">
        Tell it the income you want in retirement. See what you would need to save each month starting now, or 5,
        10 or 15 years from now.
      </ToolIntro>
      <CostOfWaiting
        profileIncome={profile?.idealIncome ?? null}
        inflation={{ PHP: recentInflation(cpi.PHL, 4), USD: recentInflation(cpi.USA, 3) }}
      />
    </>
  )
}

/** Average yearly inflation over the last 20 published years, or `fallback` without data. */
function recentInflation(series: CpiPoint[], fallback: number): number {
  const last = series.at(-1)
  if (!last) return fallback
  const from = cpiAt(series, last.year - INFLATION_YEARS)
  return from ? averageInflation(from, last.cpi, INFLATION_YEARS) : fallback
}
