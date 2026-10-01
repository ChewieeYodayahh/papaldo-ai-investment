import { getValuation } from '@/app/features/dashboard/api/valuation'
import { getPortfolio } from '@/app/features/trading/api/portfolio'

import { getCpi } from '../api/cpi'
import { PurchasingPowerCalculator } from '../components/PurchasingPowerCalculator'
import { ToolIntro } from '../components/lesson'

/**
 * `/tools/purchasing-power` -- open to guests. Signed-in users can start
 * from their simulated balance (cash plus holdings at live prices).
 */
export async function PurchasingPowerPage() {
  const [cpi, portfolio] = await Promise.all([getCpi(), getPortfolio()])
  const portfolioUsd = portfolio ? (await getValuation(portfolio)).valuation.total : null

  return (
    <>
      <ToolIntro tour="purchasing" question="What is money from back then worth today?">
        Prices rise, so the same money buys less every year. Compare any two years from 1960 to the latest World Bank data.
      </ToolIntro>
      <PurchasingPowerCalculator cpi={cpi} portfolioUsd={portfolioUsd} />
    </>
  )
}
