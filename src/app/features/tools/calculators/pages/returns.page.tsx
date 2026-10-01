import { getAssetOptions } from '../api/history'
import { ReturnsCalculator } from '../components/ReturnsCalculator'
import { ToolIntro } from '../components/lesson'

/** `/tools/returns` -- the historical returns calculator. */
export async function ReturnsPage() {
  const options = await getAssetOptions()
  return (
    <>
      <ToolIntro tour="returns" question="What if you had invested back then?">
        Pick an index, fund or stock and an amount. See what it would be worth today on real prices, and where it could go if the trend held.
      </ToolIntro>
      <ReturnsCalculator options={options} defaultAsset="SP500" />
    </>
  )
}
