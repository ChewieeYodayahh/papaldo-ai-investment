import { StatementsBuilder } from '../components/StatementsBuilder'
import { ToolIntro } from '../components/lesson'

/** `/tools/statements` -- the three financial statements. Browser-only; open to guests. */
export function StatementsPage() {
  return (
    <>
      <ToolIntro tour="statements" currency={false} question="tool.statements.q">
        Fill in your own numbers or start from the sample. The statements check each other, so you can see how they connect.
      </ToolIntro>
      <StatementsBuilder />
    </>
  )
}
