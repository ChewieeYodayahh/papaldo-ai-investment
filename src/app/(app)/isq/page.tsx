import { IsqForm } from '@/app/features/isq/components/IsqForm'
import { getCurrentRiskProfile } from '@/app/features/isq/api/submit'
import { PageShell } from '@/components'

export const metadata = { title: 'Investment Suitability Questionnaire' }

export default async function IsqPage() {
  const existing = await getCurrentRiskProfile()

  return (
    <PageShell
      title="Investment Suitability Questionnaire"
      subtitle={
        existing
          ? `You are currently assessed as ${existing.band} risk. Retaking the questionnaire replaces that result.`
          : 'Six questions. Your answers set the risk profile we use to shape your portfolio.'
      }
    >
      <IsqForm />
    </PageShell>
  )
}
