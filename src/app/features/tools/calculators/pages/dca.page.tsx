import { getAssetOptions } from '../api/history'
import { DcaSimulator } from '../components/DcaSimulator'
import { ToolIntro } from '../components/lesson'
import { T } from '@/app/features/userData/preferences/copy'

/** `/tools/dca` -- dollar-cost averaging vs lump sum on real prices. Open to guests. */
export async function DcaPage() {
  const options = await getAssetOptions()
  return (
    <>
      <ToolIntro tour="dca" question="tool.dca.q">
        <T k="tool.dca.intro" />
      </ToolIntro>
      <DcaSimulator options={options} defaultAsset="SP500" />
    </>
  )
}
