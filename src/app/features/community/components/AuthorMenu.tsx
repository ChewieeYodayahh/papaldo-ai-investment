'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { UserPlus, UserRound } from 'lucide-react'

import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useCopy } from '@/app/features/userData/preferences/copy'

import { useFriendAction } from './FriendButton'

/** How long the "Request sent" / error note stays next to the name. */
const NOTE_MS = 4000

/**
 * A chat author's name with "Add as Friend" and "View Profile" (Carlos,
 * 2026-09-30). Right-click or long-press opens it as a context menu; a tap or
 * click on the name opens the same items as a dropdown, for people who never
 * right-click. Only members get it, and only signed-in viewers see it: guests
 * have no profile, and profiles are for signed-in members.
 */
export function AuthorMenu({ name }: { name: string }) {
  const t = useCopy()
  const { run } = useFriendAction()
  const [note, setNote] = useState<{ text: string; failed: boolean } | null>(null)

  useEffect(() => {
    if (!note) return
    const timer = window.setTimeout(() => setNote(null), NOTE_MS)
    return () => window.clearTimeout(timer)
  }, [note])

  async function addFriend() {
    const outcome = await run(name, 'request')
    if (!outcome.ok) setNote({ text: outcome.message, failed: true })
    else setNote({ text: t(outcome.relation === 'friends' ? 'soc.friends' : 'soc.requestSent'), failed: false })
  }

  const profileHref = `/u/${encodeURIComponent(name)}`

  return (
    <span className="inline-flex items-baseline gap-1.5">
      <ContextMenu>
        <ContextMenuTrigger render={<span />} className="select-auto">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="rounded font-medium text-foreground underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              aria-label={`${name}: ${t('soc.addFriend')}, ${t('soc.viewProfile')}`}
            >
              {name}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44">
              <DropdownMenuItem onClick={addFriend}>
                <UserPlus />
                {t('soc.addFriend')}
              </DropdownMenuItem>
              <DropdownMenuItem render={<Link href={profileHref} />}>
                <UserRound />
                {t('soc.viewProfile')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-44">
          <ContextMenuItem onClick={addFriend}>
            <UserPlus />
            {t('soc.addFriend')}
          </ContextMenuItem>
          <ContextMenuItem render={<Link href={profileHref} />}>
            <UserRound />
            {t('soc.viewProfile')}
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
      {note ? (
        <span role="status" className={note.failed ? 'text-[11px] text-destructive' : 'text-[11px] text-primary'}>
          {note.text}
        </span>
      ) : null}
    </span>
  )
}
