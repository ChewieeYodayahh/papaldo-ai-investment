import { getAssetOptions } from '../api/history'
import { DcaSimulator } from '../components/DcaSimulator'
import { ToolIntro } from '../components/lesson'

/** `/tools/dca` -- dollar-cost averaging vs lump sum on real prices. Open to guests. */
export async function DcaPage() {
  const options = await getAssetOptions()
  return (
    <>
      <ToolIntro tour="dca" question="Should you invest all at once, or a little every month?">
        Pick an index, fund or stock and replay both ways on its real prices.
      </ToolIntro>
      <DcaSimulator options={options} defaultAsset="SP500" />
    </>
  )
}
