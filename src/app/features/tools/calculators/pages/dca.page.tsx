import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'

import { getAssetOptions } from '../api/history'
import { DcaSimulator } from '../components/DcaSimulator'

/** `/tools/dca` -- dollar-cost averaging vs lump sum on real prices. Open to guests. */
export async function DcaPage() {
  const options = await getAssetOptions()
  return (
    <>
      <TutorialTrigger tour="dca" className="mb-2" />
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        Is it better to invest a little every month or all at once? Pick an index, fund or stock and replay both on
        its real prices.
      </p>
      <DcaSimulator options={options} defaultAsset="SP500" />
    </>
  )
}
