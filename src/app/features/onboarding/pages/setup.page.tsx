import { redirect } from 'next/navigation'

import { getProfile } from '@/app/features/auth/api/profile'

import { getCurrentRiskProfile } from '../api/submit'
import { ProfileSetupJourney } from '../components/ProfileSetupJourney'

/**
 * `/onboarding/profile` -- Get Started 1/3. Also where a first Google sign-in
 * is held until it picks a username (middleware).
 */
export async function ProfileSetupPage() {
  const [profile, riskProfile] = await Promise.all([getProfile(), getCurrentRiskProfile()])
  if (!profile) redirect('/login')

  // Google accounts arrive without a username; offer the email's local part.
  const suggested = profile.username ? profile : { ...profile, username: profile.email.split('@')[0] }

  return <ProfileSetupJourney profile={suggested} quizDone={Boolean(riskProfile)} />
}
