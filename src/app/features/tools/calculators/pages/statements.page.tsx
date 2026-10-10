import { StatementsBuilder } from '../components/StatementsBuilder'
import { ToolIntro } from '../components/lesson'
import { T } from '@/app/features/userData/preferences/copy'

/** `/tools/statements` -- the three financial statements. Browser-only; open to guests. */
export function StatementsPage() {
  return (
    <>
      <ToolIntro tour="statements" currency={false} question="tool.statements.q">
        <T k="tool.statements.intro" />
      </ToolIntro>
      <StatementsBuilder />
    </>
  )
}
