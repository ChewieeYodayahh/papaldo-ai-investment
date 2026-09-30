import { getValuation } from '@/app/features/dashboard/api/valuation'
import { getPortfolio } from '@/app/features/trading/api/portfolio'
import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'

import { getCpi } from '../api/cpi'
import { PurchasingPowerCalculator } from '../components/PurchasingPowerCalculator'

/**
 * `/tools/purchasing-power` -- open to guests. Signed-in users can start
 * from their simulated balance (cash plus holdings at live prices).
 */
export async function PurchasingPowerPage() {
  const [cpi, portfolio] = await Promise.all([getCpi(), getPortfolio()])
  const portfolioUsd = portfolio ? (await getValuation(portfolio)).valuation.total : null

  return (
    <>
      <TutorialTrigger tour="purchasing" className="mb-2" />
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Prices rise, so the same money buys less every year. See what an amount from one year is worth in another,
        from 1960 to the latest year the World Bank has published.
      </p>
      <PurchasingPowerCalculator cpi={cpi} portfolioUsd={portfolioUsd} />
    </>
  )
}
