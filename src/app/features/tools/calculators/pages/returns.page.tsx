import { getAssetOptions } from '../api/history'
import { ReturnsCalculator } from '../components/ReturnsCalculator'

/** `/tools/returns` -- the historical returns calculator. */
export async function ReturnsPage() {
  const options = await getAssetOptions()
  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Pick an index, a fund or one of Papaldo’s stocks and see what investing in it would have done, month by
        month, using its real prices.
      </p>
      <ReturnsCalculator options={options} defaultAsset="SP500" />
    </>
  )
}
