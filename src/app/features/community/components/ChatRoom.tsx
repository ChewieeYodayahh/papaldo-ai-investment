'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { SendHorizontal, Trash2 } from 'lucide-react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { ChatMessage } from '../api/messages'
import { AuthorMenu } from './AuthorMenu'
import { GuestJoinDialog, useGuestPass } from './GuestJoin'

const POLL_MS = 4000
const MAX_LENGTH = 1000
const GUEST_MAX_LENGTH = 500

const timeLabel = (iso: string) => {
  const date = new Date(iso)
  const today = new Date().toDateString() === date.toDateString()
  return today
    ? date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : date.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ', ' + date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

/**
 * The one community chat room (Carlos, 2026-09-29). Signed-in users post;
 * guests can read, or pick a name and chat for up to ten minutes (2026-09-30,
 * `GuestJoin`). New messages arrive by polling every few seconds while the tab
 * is visible -- the UI talks only to /api/community/*, never to the database.
 * Admins can remove a message for everyone. Signed-in viewers get "Add as
 * Friend" / "View Profile" on members' names (`AuthorMenu`).
 */
export function ChatRoom({ initial, signedIn, isAdmin }: { initial: ChatMessage[]; signedIn: boolean; isAdmin: boolean }) {
  const t = useCopy()
  const [messages, setMessages] = useState(initial)
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const guest = useGuestPass()
  const [joining, setJoining] = useState(false)
  const canPost = signedIn || Boolean(guest.pass)
  const maxLength = signedIn ? MAX_LENGTH : GUEST_MAX_LENGTH
  const listRef = useRef<HTMLDivElement>(null)
  const stickToBottom = useRef(true)
  const lastId = messages.at(-1)?.id ?? 0

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return
    setMessages((current) => {
      const seen = new Set(current.map((m) => m.id))
      return [...current, ...incoming.filter((m) => !seen.has(m.id))].slice(-300)
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(async () => {
      if (document.visibilityState !== 'visible') return
      try {
        const response = await fetch(`/api/community/messages?after=${lastId}`, { cache: 'no-store' })
        const payload = (await response.json()) as { ok: boolean; messages?: ChatMessage[] }
        if (payload.ok && payload.messages) merge(payload.messages)
      } catch {
        // Offline for a moment; the next poll catches up.
      }
    }, POLL_MS)
    return () => window.clearInterval(timer)
  }, [lastId, merge])

  // Keep the view pinned to the newest message unless the reader scrolled up.
  useLayoutEffect(() => {
    const list = listRef.current
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight
  }, [messages])

  async function send() {
    const body = draft.trim()
    if (!body || sending) return
    setSending(true)
    setError(null)
    try {
      const asGuest = !signedIn && guest.pass
      const response = await fetch(asGuest ? '/api/community/guest/messages' : '/api/community/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(asGuest ? { secret: guest.pass?.secret, body } : { body }),
      })
      const payload = (await response.json()) as { ok: boolean; message?: ChatMessage | string }
      if (payload.ok && payload.message && typeof payload.message !== 'string') {
        stickToBottom.current = true
        merge([payload.message])
        setDraft('')
      } else {
        // An expired guest pass: drop it so the name prompt comes back.
        if (asGuest && response.status === 401) guest.clear()
        setError(typeof payload.message === 'string' ? payload.message : 'The message was not sent. Try again.')
      }
    } catch {
      setError('You seem to be offline. The message was not sent.')
    } finally {
      setSending(false)
    }
  }

  async function remove(id: number) {
    const response = await fetch(`/api/community/messages/${id}`, { method: 'DELETE' })
    if (response.ok) setMessages((current) => current.filter((m) => m.id !== id))
  }

  return (
    <Card className="rounded-2xl border-0 py-0">
      <CardContent className="flex h-[min(70svh,640px)] flex-col px-0">
        <div
          ref={listRef}
          onScroll={(event) => {
            const el = event.currentTarget
            stickToBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 60
          }}
          className="flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5"
          role="log"
          aria-live="polite"
          aria-label={t('chat.messages')}
        >
          {messages.length === 0 ? (
            <p className="py-16 text-center text-sm text-muted-foreground">{t('chat.empty')}</p>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={cn('group flex flex-col gap-1', message.mine ? 'items-end' : 'items-start')}>
                <span className="px-1 text-xs text-muted-foreground">
                  {message.mine ? (
                    <span className="font-medium text-foreground">{t('chat.you')}</span>
                  ) : signedIn && !message.guest ? (
                    <AuthorMenu name={message.author} />
                  ) : (
                    <span className="font-medium text-foreground">{message.author}</span>
                  )}
                  {message.guest ? <span className="text-muted-foreground"> · {t('chat.guest')}</span> : null} · {timeLabel(message.createdAt)}
                </span>
                <div className="flex max-w-[85%] items-center gap-1.5 sm:max-w-[70%]">
                  {isAdmin && !message.mine ? (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => remove(message.id)}
                      aria-label={`Remove this message from ${message.author}`}
                      className="order-2 opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                  <p
                    className={cn(
                      'rounded-2xl px-3.5 py-2 text-sm leading-relaxed break-words whitespace-pre-wrap',
                      message.mine ? 'rounded-br-md bg-primary text-primary-foreground' : 'rounded-bl-md bg-muted',
                    )}
                  >
                    {message.body}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t px-4 py-3 sm:px-5">
          {canPost ? (
            <form
              onSubmit={(event) => {
                event.preventDefault()
                void send()
              }}
              className="grid gap-2"
            >
              <div className="flex items-end gap-2">
                <Textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value.slice(0, maxLength))}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault()
                      void send()
                    }
                  }}
                  rows={1}
                  placeholder="Write a message. Be kind; no personal financial details."
                  aria-label="Message"
                  className="max-h-32 min-h-10 flex-1 resize-none rounded-xl"
                />
                <Button type="submit" disabled={sending || !draft.trim()} className="h-10 gap-2 rounded-full px-4">
                  <SendHorizontal className="size-4" />
                  <span className="hidden sm:inline">{sending ? t('chat.sending') : t('chat.send')}</span>
                </Button>
              </div>
              <div className="flex justify-between gap-3 text-xs text-muted-foreground">
                <span role="status" className={cn(error && 'text-destructive')}>
                  {error ??
                    (guest.pass && !signedIn ? (
                      <>
                        {t('chat.chattingAs')} <span className="font-medium text-foreground">{guest.pass.name}</span> · {t('chat.guest')} ·{' '}
                        {t('chat.minutesLeft', { n: String(guest.minutesLeft) })} ·{' '}
                        <button type="button" onClick={guest.clear} className="underline underline-offset-2 hover:text-foreground">
                          {t('chat.leave')}
                        </button>
                      </>
                    ) : (
                      t('chat.hint')
                    ))}
                </span>
                <span className="figure shrink-0">
                  {draft.length}/{maxLength}
                </span>
              </div>
            </form>
          ) : (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-muted-foreground">{t('chat.readingAsGuest')}</p>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => setJoining(true)} className="h-9 rounded-full px-4">
                  {t('chat.joinGuest')}
                </Button>
                <Link href="/login" className={cn(buttonVariants({ variant: 'outline' }), 'h-9 rounded-full px-4')}>
                  {t('header.login')}
                </Link>
                <Link href="/sign-up" className={cn(buttonVariants(), 'h-9 rounded-full px-4')}>
                  {t('chat.createAccount')}
                </Link>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      {signedIn ? null : <GuestJoinDialog open={joining} onOpenChange={setJoining} onJoined={guest.save} />}
    </Card>
  )
}
