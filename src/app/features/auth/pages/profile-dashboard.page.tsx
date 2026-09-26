import { redirect } from 'next/navigation'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSessionUser } from '@/app/core/services/supabase/session'
import { initials } from '@/lib/initials'

import { hasConfirmedByEmail } from '../api/password'
import { getProfile, isSetupComplete } from '../api/profile'
import { ConnectedAccountsCard, DetailsCard, SecurityCard, WorkIncomeCard } from '../components/ProfileCards'
import { SignOutButton } from '../components/SignOutButton'

/**
 * The profile dashboard (Carlos, 2026-09-26): full-size cards on a page that
 * scrolls, replacing the read-only profile dialog. Details, work & income,
 * connected accounts, and an email-confirmed password change.
 *
 * `searchParams` carry the result of a round trip through
 * `/api/auth/callback`: `linked=google`, `security=confirmed`, or `error`.
 */
export async function ProfileDashboardPage({ searchParams }: { searchParams: Record<string, string | undefined> }) {
  const [profile, session, confirmed] = await Promise.all([getProfile(), getSessionUser(), hasConfirmedByEmail()])
  if (!profile || !session) redirect('/login')

  const displayName = session.fullName ?? profile.username ?? profile.email.split('@')[0]
  const setupDone = isSetupComplete(profile)
  const linkError = searchParams.linked || searchParams.security ? undefined : searchParams.error

  return (
    <div className="grid gap-4">
      <Card className="hero-mesh rounded-2xl border-0 py-5">
        <CardContent className="flex flex-wrap items-center gap-4 px-5 sm:px-6">
          <Avatar className="size-16 text-lg">
            {session.avatarUrl ? <AvatarImage src={session.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(displayName)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-tight">{displayName}</h2>
            <p className="truncate text-sm text-muted-foreground">
              {profile.username ? `@${profile.username} · ` : ''}
              {profile.email}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge variant="outline" className="rounded-full">Simulated account · no real money</Badge>
              <Badge
                className={
                  setupDone
                    ? 'rounded-full bg-primary/15 text-primary'
                    : 'rounded-full bg-muted text-muted-foreground'
                }
              >
                {setupDone ? 'Profile complete' : 'Profile setup in progress'}
              </Badge>
            </div>
          </div>
          <SignOutButton />
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="grid gap-4">
          <DetailsCard profile={profile} />
          <ConnectedAccountsCard providers={session.providers} linkError={linkError} />
        </div>
        <div className="grid gap-4">
          <WorkIncomeCard profile={profile} />
          <div id="security" className="scroll-mt-4">
            <SecurityCard confirmed={confirmed} />
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Income figures are kept in the currency you enter them in and are only used to tailor your dashboard.
      </p>
    </div>
  )
}
