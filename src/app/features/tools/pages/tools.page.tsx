import { redirect } from 'next/navigation'

import { getProfile, isSetupComplete } from '@/app/features/auth/api/profile'
import { getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { T } from '@/app/features/preferences/copy'

import { ProfileToolCard, QuizToolCard, WalkthroughToolCard } from '../components/ToolCards'

/**
 * Tools (Carlos, 2026-09-26): the things that shape how someone invests, as
 * cards. The quiz lives here for good -- take it, view the results, retake
 * it -- alongside the profile and the first-trade walkthrough.
 */
export async function ToolsPage() {
  const [profile, risk] = await Promise.all([getProfile(), getCurrentRiskProfile()])
  if (!profile) redirect('/login')

  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        <T k="tools.subtitle" />
      </p>
      <div className="grid items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        <QuizToolCard risk={risk ? { band: risk.band, score: risk.score, takenAt: risk.computed_at } : null} />
        <ProfileToolCard profile={profile} complete={isSetupComplete(profile)} />
        <WalkthroughToolCard quizDone={Boolean(risk)} />
      </div>
    </>
  )
}
