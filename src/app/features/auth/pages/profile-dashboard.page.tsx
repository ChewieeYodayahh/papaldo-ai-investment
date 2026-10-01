import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ChevronRight, Download, UsersRound } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { getSessionUser } from '@/app/core/services/supabase/session'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'

import { hasConfirmedByEmail } from '../api/password'
import { getProfile, isSetupComplete } from '../api/profile'
import { AvatarUploader } from '../components/AvatarUploader'
import { AboutYouCard, ConnectedAccountsCard, DetailsCard, SecurityCard, WorkIncomeCard } from '../components/ProfileCards'
import { SignOutButton } from '../components/SignOutButton'

const ROW = 'flex h-11 items-center gap-3 px-4 text-sm font-medium transition-colors hover:bg-muted/60 focus-visible:bg-muted/60 focus-visible:outline-none'

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
      {/* Who you are on the left, where to go on the right; stacked on
          phones (Carlos, 2026-10-01: the badges and inline links read as
          clutter). The email stays in the details card below. */}
      <Card className="hero-mesh rounded-2xl border-0 py-4 sm:py-5">
        <CardContent className="grid gap-4 px-4 sm:grid-cols-[minmax(0,1fr)_17rem] sm:items-center sm:px-6">
          <div className="flex min-w-0 items-center gap-4">
            <AvatarUploader
              src={profile.avatarUrl ?? session.avatarUrl}
              fallback={initials(displayName)}
              hasCustom={Boolean(profile.avatarUrl)}
            />
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-lg font-semibold tracking-tight sm:text-xl">{displayName}</h2>
              {profile.username ? <p className="truncate text-sm text-muted-foreground">@{profile.username}</p> : null}
              <Badge
                className={cn(
                  'mt-2 rounded-full',
                  setupDone ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                )}
              >
                {setupDone ? 'Profile complete' : 'Profile setup in progress'}
              </Badge>
            </div>
          </div>

          <nav aria-label="Profile shortcuts" className="grid divide-y divide-border overflow-hidden rounded-xl bg-background/50 ring-1 ring-foreground/10">
            {profile.username ? (
              <Link href={`/u/${encodeURIComponent(profile.username)}`} className={ROW}>
                <UsersRound className="size-4 text-muted-foreground" />
                <span className="flex-1">Member profile &amp; friends</span>
                <ChevronRight className="size-4 text-muted-foreground" />
              </Link>
            ) : null}
            <Link href="/tools/export" className={ROW}>
              <Download className="size-4 text-muted-foreground" />
              <span className="flex-1">Export my data</span>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
            <SignOutButton variant="ghost" className="h-11 justify-start gap-3 rounded-none px-4 text-loss hover:text-loss" />
          </nav>
        </CardContent>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <div className="grid gap-4">
          <DetailsCard profile={profile} />
          <AboutYouCard profile={profile} />
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
