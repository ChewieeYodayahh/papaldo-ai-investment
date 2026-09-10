import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { IsqForm } from '@/app/features/onboarding/components/IsqForm'
import { PageShell } from '@/components'

export async function IsqPage() {
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
