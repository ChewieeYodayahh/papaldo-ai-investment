'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Check, ChevronDown, UserMinus, UserPlus, X } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Spinner } from '@/components/ui/spinner'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

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

/**
 * The profile page's friend control: add, cancel, accept/decline or remove.
 * A sent request and a friendship are one button each, with the undo in its
 * menu (Carlos, 2026-10-01: a label beside a button read as clutter).
 * `fill` stretches the controls across the row, for the header on phones.
 */
export function FriendButton({ username, relation: initial, fill = false }: { username: string; relation: Relation; fill?: boolean }) {
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
        <StateMenu label={t('soc.requestSent')} busy={pending !== null} fill={fill}>
          <DropdownMenuItem variant="destructive" onClick={() => act('remove')}>
            <X />
            {t('soc.cancelRequest')}
          </DropdownMenuItem>
        </StateMenu>
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
        <StateMenu label={t('soc.friends')} busy={pending !== null} fill={fill}>
          <DropdownMenuItem variant="destructive" onClick={() => act('remove')}>
            <UserMinus />
            {t('soc.unfriend')}
          </DropdownMenuItem>
        </StateMenu>
      )
      break
  }

  return (
    <div className={cn('grid gap-1', fill ? 'w-full' : 'justify-items-end')}>
      <div className={cn('flex flex-wrap items-center gap-2', fill ? '*:flex-1' : 'justify-end')}>{controls}</div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** A settled state (request sent, friends) as one button; its menu holds the undo. */
function StateMenu({ label, busy, fill, children }: { label: string; busy: boolean; fill: boolean; children: React.ReactNode }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger render={<Button variant="outline" className={cn('rounded-full', fill && 'w-full')} disabled={busy} />}>
        {busy ? <Spinner className="size-4" /> : <Check className="text-primary" />}
        {label}
        <ChevronDown className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {children}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
