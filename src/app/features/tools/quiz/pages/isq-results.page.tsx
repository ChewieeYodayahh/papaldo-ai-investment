import { redirect } from 'next/navigation'

import { getRecommendations } from '../api/recommendations'
import { getCurrentAnswers, getCurrentRiskProfile } from '../api/submit'
import { RecommendedAssets } from '../components/RecommendedAssets'
import { ResultsView } from '../components/ResultsView'

/** `/isq/results` -- "View Results" on the Tools card. No profile yet: take the quiz. */
export async function IsqResultsPage() {
  const profile = await getCurrentRiskProfile()
  if (!profile) redirect('/isq')

  const [answers, recommendations] = await Promise.all([getCurrentAnswers(profile), getRecommendations(profile.band)])
  return (
    <ResultsView band={profile.band} score={profile.score} takenAt={profile.computed_at} answers={answers}>
      <RecommendedAssets band={profile.band} assets={recommendations} />
    </ResultsView>
  )
}
