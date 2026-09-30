'use client'

import { useEffect, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

export type GuestPass = { secret: string; name: string; expiresAt: string }

const STORAGE_KEY = 'papaldo-guest-pass'

/**
 * The guest's chat pass for this tab (Carlos, 2026-09-30): kept in
 * sessionStorage, so closing the tab or the app ends it, and it lapses ten
 * minutes after it was issued. The server holds the same expiry, so a stale
 * copy here only means one refused post before the name prompt returns.
 */
export function useGuestPass() {
  const [pass, setPass] = useState<GuestPass | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? 'null') as GuestPass | null
      if (saved?.secret && Date.parse(saved.expiresAt) > Date.now()) setPass(saved)
      else sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // Private mode or blocked storage: the pass simply lasts for this page view.
    }
    const timer = window.setInterval(() => setNow(Date.now()), 15_000)
    return () => window.clearInterval(timer)
  }, [])

  const active = pass && Date.parse(pass.expiresAt) > now ? pass : null

  const save = (next: GuestPass) => {
    setPass(next)
    setNow(Date.now())
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      // See above.
    }
  }

  const clear = () => {
    setPass(null)
    try {
      sessionStorage.removeItem(STORAGE_KEY)
    } catch {
      // See above.
    }
  }

  const minutesLeft = active ? Math.max(1, Math.ceil((Date.parse(active.expiresAt) - now) / 60_000)) : 0
  return { pass: active, minutesLeft, save, clear }
}

/** "Pick a name to join": asks for a guest name and exchanges it for a pass. */
export function GuestJoinDialog({
  open,
  onOpenChange,
  onJoined,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onJoined: (pass: GuestPass) => void
}) {
  const [name, setName] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      const response = await fetch('/api/community/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const payload = (await response.json()) as ({ ok: true } & GuestPass) | { ok: false; message: string }
      if (payload.ok) {
        onJoined({ secret: payload.secret, name: payload.name, expiresAt: payload.expiresAt })
        onOpenChange(false)
        setName('')
      } else {
        setError(payload.message)
      }
    } catch {
      setError('You seem to be offline. Try again.')
    } finally {
      setPending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <form onSubmit={submit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>Pick a name to join</DialogTitle>
            <DialogDescription>
              Chat as a guest for up to 10 minutes. The name lasts until you close this tab or the time runs out.
              Messages are public; never share personal or financial details.
            </DialogDescription>
          </DialogHeader>
          <Field data-invalid={Boolean(error)}>
            <FieldLabel htmlFor="guest-name">Your name for this chat</FieldLabel>
            <Input
              id="guest-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              maxLength={24}
              autoComplete="nickname"
              autoFocus
              aria-invalid={Boolean(error)}
            />
            <FieldDescription>2 to 24 letters, numbers or spaces. Member usernames are taken.</FieldDescription>
            {error ? <FieldError>{error}</FieldError> : null}
          </Field>
          <DialogFooter>
            <Button type="submit" disabled={pending || name.trim().length < 2} className="rounded-full px-5">
              {pending ? 'Joining…' : 'Join the chat'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
