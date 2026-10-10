import { getAssetOptions } from '../api/history'
import { ReturnsCalculator } from '../components/ReturnsCalculator'
import { ToolIntro } from '../components/lesson'
import { T } from '@/app/features/userData/preferences/copy'

/** `/tools/returns` -- the historical returns calculator. */
export async function ReturnsPage() {
  const options = await getAssetOptions()
  return (
    <>
      <ToolIntro tour="returns" question="tool.returns.q">
        <T k="tool.returns.intro" />
      </ToolIntro>
      <ReturnsCalculator options={options} defaultAsset="SP500" />
    </>
  )
}
