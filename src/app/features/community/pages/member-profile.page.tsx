import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ExternalLink, Lock } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SymbolMark } from '@/app/features/markets/components/SymbolMark'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { T } from '@/app/features/userData/preferences/copy'
import { initials } from '@/lib/initials'
import { cn } from '@/lib/utils'

import { allocation } from '../allocation'
import { listFriends, type Friend } from '../api/friends'
import { getPublicProfile, type PublicProfile } from '../api/profiles'
import { FriendButton } from '../components/FriendButton'

/**
 * A member's profile (Carlos, 2026-09-30), reached from the community chat or
 * a friend notification. Signed-in viewers only. What shows is decided by the
 * database: a private profile hides its portfolio from everyone but friends,
 * and email, phone and income are never returned at all.
 */
export async function MemberProfilePage({ username }: { username: string }) {
  const lookup = await getPublicProfile(decodeURIComponent(username))
  if (lookup.status === 'signed-out') redirect('/login')
  if (lookup.status === 'not-found') notFound()
  const { profile } = lookup
  const friends = profile.relation === 'self' ? await listFriends() : null

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-4">
      <Card className="hero-mesh rounded-2xl border-0 py-5">
        <CardContent className="flex flex-wrap items-center gap-4 px-5 sm:px-6">
          <Avatar className="size-16 text-lg">
            {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
            <AvatarFallback>{initials(profile.username)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-tight">@{profile.username}</h2>
            {profile.occupations.length > 0 ? (
              <p className="truncate text-sm text-muted-foreground">{profile.occupations.join(' · ')}</p>
            ) : null}
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              {profile.isPrivate ? (
                <Badge variant="outline" className="rounded-full">
                  <Lock />
                  <T k="soc.private" />
                </Badge>
              ) : null}
              {profile.band ? (
                <Badge className="rounded-full bg-primary/15 text-primary">
                  <T k="soc.riskBand" vars={{ band: profile.band }} />
                </Badge>
              ) : null}
              {profile.website ? (
                <a
                  href={profile.website}
                  target="_blank"
                  rel="nofollow ugc noopener noreferrer"
                  className="inline-flex max-w-full items-center gap-1 truncate text-sm text-primary underline-offset-2 hover:underline"
                >
                  {hostOf(profile.website)}
                  <ExternalLink className="size-3.5 shrink-0" />
                </a>
              ) : null}
            </div>
          </div>
          <FriendButton username={profile.username} relation={profile.relation} />
        </CardContent>
      </Card>

      {profile.portfolio ? (
        <PortfolioCard portfolio={profile.portfolio} />
      ) : (
        <Card className="rounded-2xl">
          <CardContent className="flex items-center gap-3 text-sm text-muted-foreground">
            <Lock className="size-4 shrink-0" />
            <T k="soc.privateNote" vars={{ name: profile.username }} />
          </CardContent>
        </Card>
      )}

      {friends ? <FriendsCard friends={friends} /> : null}
    </div>
  )
}

/** On your own profile: open requests first, then friends and sent requests. */
function FriendsCard({ friends }: { friends: Friend[] }) {
  const requests = friends.filter((f) => f.relation === 'incoming')
  const rest = friends.filter((f) => f.relation !== 'incoming')

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>
          <T k="soc.friendsCard" />
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {friends.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <T k="soc.noFriends" />
          </p>
        ) : null}
        {requests.length > 0 ? (
          <div>
            <p className="mb-1 text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <T k="soc.requests" />
            </p>
            <ul className="divide-y divide-border">
              {requests.map((friend) => (
                <FriendRow key={friend.username} friend={friend} />
              ))}
            </ul>
          </div>
        ) : null}
        {rest.length > 0 ? (
          <ul className="divide-y divide-border">
            {rest.map((friend) => (
              <FriendRow key={friend.username} friend={friend} />
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  )
}

function FriendRow({ friend }: { friend: Friend }) {
  return (
    <li className="flex flex-wrap items-center gap-3 py-2.5">
      <Link href={`/u/${encodeURIComponent(friend.username)}`} className="flex min-w-0 flex-1 items-center gap-3 hover:underline">
        <Avatar className="size-8">
          {friend.avatarUrl ? <AvatarImage src={friend.avatarUrl} alt="" /> : null}
          <AvatarFallback>{initials(friend.username)}</AvatarFallback>
        </Avatar>
        <span className="truncate text-sm font-medium">@{friend.username}</span>
      </Link>
      <FriendButton username={friend.username} relation={friend.relation} />
    </li>
  )
}

function PortfolioCard({ portfolio }: { portfolio: NonNullable<PublicProfile['portfolio']> }) {
  const slices = allocation(portfolio.holdings, portfolio.cash, portfolio.total)

  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <T k="soc.balance" />
        </CardTitle>
        <p className="figure text-3xl font-semibold tracking-tight">
          <Money usd={portfolio.total} />
        </p>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <T k="soc.allocation" />
          </p>
          <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label={slices.map((s) => `${s.label} ${s.percent.toFixed(1)}%`).join(', ')}>
            {slices.map((slice) => (
              <span key={slice.label} className={cn('h-full', slice.colour)} style={{ width: `${slice.percent}%` }} />
            ))}
          </div>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {slices.map((slice) => (
              <li key={slice.label} className="inline-flex items-center gap-1.5">
                <span className={cn('size-2 rounded-full', slice.colour)} />
                {slice.key ? <T k={slice.key} /> : slice.label}
                <span className="figure">{slice.percent.toFixed(1)}%</span>
              </li>
            ))}
          </ul>
        </div>

        {portfolio.holdings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            <T k="soc.noHoldings" />
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {portfolio.holdings.map((holding) => (
              <li key={holding.symbol}>
                <Link
                  href={`/markets/${encodeURIComponent(holding.symbol)}`}
                  className="flex items-center gap-3 py-2.5 hover:bg-muted/40"
                >
                  <SymbolMark symbol={holding.symbol} className="size-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{holding.symbol}</span>
                    <span className="figure block text-xs text-muted-foreground">
                      {holding.quantity.toLocaleString('en-US', { maximumFractionDigits: 6 })}
                    </span>
                  </span>
                  <span className="figure text-sm">{holding.value === null ? '—' : <Money usd={holding.value} />}</span>
                </Link>
              </li>
            ))}
            <li className="flex items-center justify-between py-2.5 text-sm">
              <span className="text-muted-foreground">
                <T k="soc.cash" />
              </span>
              <span className="figure">
                <Money usd={portfolio.cash} />
              </span>
            </li>
          </ul>
        )}
        {portfolio.live ? null : (
          <p className="text-xs text-muted-foreground">
            <T k="soc.notLive" />
          </p>
        )}
      </CardContent>
    </Card>
  )
}

function hostOf(url: string): string {
  try {
    return new URL(url).host.replace(/^www\./, '')
  } catch {
    return url
  }
}
