'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, UserPlus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'
import { useCopy } from '@/app/features/userData/preferences/copy'

import type { FriendAction, FriendResult, Relation } from '../api/friends'

type Outcome = { ok: true; relation: Relation } | { ok: false; message: string }

/**
 * Sends one friend action to /api/community/friends. Resolves to the
 * relation the viewer now has with `username`, or to a message the database
 * wrote for people ("Try again tomorrow."), which is also kept in `error`.
 */
export function useFriendAction() {
  const [pending, setPending] = useState<FriendAction | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function run(username: string, action: FriendAction): Promise<Outcome> {
    setPending(action)
    setError(null)
    let outcome: Outcome
    try {
      const response = await fetch('/api/community/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, action }),
      })
      const result = (await response.json().catch(() => null)) as FriendResult | null
      outcome = result?.ok
        ? { ok: true, relation: result.relation }
        : { ok: false, message: result?.message ?? 'That did not go through. Try again.' }
    } catch {
      outcome = { ok: false, message: 'You seem to be offline. Try again.' }
    }
    setPending(null)
    if (!outcome.ok) setError(outcome.message)
    return outcome
  }

  return { run, pending, error }
}

/** The profile page's friend control: add, cancel, accept/decline or remove. */
export function FriendButton({ username, relation: initial }: { username: string; relation: Relation }) {
  const t = useCopy()
  const router = useRouter()
  const [relation, setRelation] = useState(initial)
  const { run, pending, error } = useFriendAction()

  async function act(action: FriendAction) {
    const outcome = await run(username, action)
    if (!outcome.ok) return
    setRelation(outcome.relation)
    // Becoming (or no longer being) friends changes what the page may show.
    router.refresh()
  }

  const busy = (action: FriendAction) => (pending === action ? <Spinner className="size-4" /> : null)

  let controls: React.ReactNode
  switch (relation) {
    case 'self':
      controls = <Button variant="outline" className="rounded-full" render={<Link href="/profile" />}>{t('soc.editProfile')}</Button>
      break
    case 'none':
      controls = (
        <Button className="rounded-full" disabled={pending !== null} onClick={() => act('request')}>
          {busy('request') ?? <UserPlus />}
          {t('soc.addFriend')}
        </Button>
      )
      break
    case 'outgoing':
      controls = (
        <>
          <span className="text-sm text-muted-foreground">{t('soc.requestSent')}</span>
          <Button variant="outline" className="rounded-full" disabled={pending !== null} onClick={() => act('remove')}>
            {busy('remove')}
            {t('soc.cancelRequest')}
          </Button>
        </>
      )
      break
    case 'incoming':
      controls = (
        <>
          <Button className="rounded-full" disabled={pending !== null} onClick={() => act('accept')}>
            {busy('accept') ?? <Check />}
            {t('soc.accept')}
          </Button>
          <Button variant="outline" className="rounded-full" disabled={pending !== null} onClick={() => act('decline')}>
            {busy('decline') ?? <X />}
            {t('soc.decline')}
          </Button>
        </>
      )
      break
    case 'friends':
      controls = (
        <>
          <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
            <Check className="size-4" />
            {t('soc.friends')}
          </span>
          <Button variant="ghost" size="sm" className="rounded-full" disabled={pending !== null} onClick={() => act('remove')}>
            {busy('remove')}
            {t('soc.unfriend')}
          </Button>
        </>
      )
      break
  }

  return (
    <div className="grid justify-items-end gap-1">
      <div className="flex flex-wrap items-center justify-end gap-2">{controls}</div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
