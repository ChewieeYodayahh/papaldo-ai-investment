import { getValuation } from '@/app/features/dashboard/api/valuation'
import { getPortfolio } from '@/app/features/trading/api/portfolio'

import { getCpi } from '../api/cpi'
import { PurchasingPowerCalculator } from '../components/PurchasingPowerCalculator'
import { ToolIntro } from '../components/lesson'
import { T } from '@/app/features/userData/preferences/copy'

/**
 * `/tools/purchasing-power` -- open to guests. Signed-in users can start
 * from their simulated balance (cash plus holdings at live prices).
 */
export async function PurchasingPowerPage() {
  const [cpi, portfolio] = await Promise.all([getCpi(), getPortfolio()])
  const portfolioUsd = portfolio ? (await getValuation(portfolio)).valuation.total : null

  return (
    <>
      <ToolIntro tour="purchasing" question="tool.purchasing.q">
        <T k="tool.purchasing.intro" />
      </ToolIntro>
      <PurchasingPowerCalculator cpi={cpi} portfolioUsd={portfolioUsd} />
    </>
  )
}
