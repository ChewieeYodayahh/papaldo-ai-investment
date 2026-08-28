'use client'

import { useState } from 'react'

import { Button, FormError } from '@/shared/ui'

/**
 * Starts the Google flow without importing Supabase into the browser: the
 * server builds the consent URL, we navigate to it.
 */
export function GoogleButton({ label }: { label: string }) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()

  async function start() {
    setPending(true)
    setMessage(undefined)
    try {
      const response = await fetch('/api/auth/oauth/google', { method: 'POST' })
      const body = (await response.json()) as { ok: boolean; url?: string; message?: string }
      if (!body.ok || !body.url) {
        setMessage(body.message ?? 'Could not start Google sign-in.')
        setPending(false)
        return
      }
      window.location.assign(body.url)
    } catch {
      setMessage('Could not reach the server. Check your connection and try again.')
      setPending(false)
    }
  }

  return (
    <div>
      <FormError message={message} />
      <Button type="button" variant="secondary" onClick={start} disabled={pending}>
        {pending ? 'Redirecting…' : label}
      </Button>
    </div>
  )
}
