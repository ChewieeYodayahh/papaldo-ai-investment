import { getCurrentRiskProfile } from '@/app/features/tools/quiz/api/submit'
import { IsqForm } from '@/app/features/tools/quiz/components/IsqForm'

/**
 * `/isq`, inside the app frame (Carlos, 2026-09-26): the user is signed in,
 * so the quiz sits in the same outer container as every other page. Reached
 * from Get Started (2/3) and from Tools; never forced after login.
 */
export async function IsqPage() {
  const existing = await getCurrentRiskProfile()
  return <IsqForm retake={Boolean(existing)} />
}
