import { redirect } from 'next/navigation'

import { getCurrentAnswers, getCurrentRiskProfile } from '../api/submit'
import { ResultsView } from '../components/ResultsView'

/** `/isq/results` -- "View Results" on the Tools card. No profile yet: take the quiz. */
export async function IsqResultsPage() {
  const profile = await getCurrentRiskProfile()
  if (!profile) redirect('/isq')

  const answers = await getCurrentAnswers(profile)
  return <ResultsView band={profile.band} score={profile.score} takenAt={profile.computed_at} answers={answers} />
}
