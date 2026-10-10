'use client'

import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'

import { NETWORK_ERROR } from '../hooks/use-form-submit'
import { T } from '@/app/features/userData/preferences/copy'

/**
 * Starts a Google round trip without importing Supabase into the browser:
 * the server builds the consent URL, we navigate to it. `endpoint` picks the
 * flow -- sign in (default) or link Google to the signed-in account.
 *
 * The G uses its official colours (react-icons' flat-color set) because
 * Google's brand guidelines require it; it is the one mark on screen that
 * does not follow the palette.
 */
export function GoogleButton({
  label,
  endpoint = '/api/auth/oauth/google',
  className,
}: {
  label: React.ReactNode
  endpoint?: string
  className?: string
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()

  async function start() {
    setPending(true)
    setMessage(undefined)
    let response: Response
    try {
      response = await fetch(endpoint, { method: 'POST' })
    } catch {
      // Only a failed fetch is a network problem.
      setMessage(NETWORK_ERROR)
      setPending(false)
      return
    }

    // A reply that is not JSON is a server fault, not a connection fault --
    // saying "check your connection" for it sent people hunting the wrong way.
    const body = (await response.json().catch(() => null)) as { ok: boolean; url?: string; message?: string } | null
    if (!body?.ok || !body.url) {
      setMessage(body?.message ?? `Google sign-in failed on our side (HTTP ${response.status}). Please use email for now.`)
      setPending(false)
      return
    }
    window.location.assign(body.url)
  }

  return (
    <div className="grid gap-2">
      <Button
        type="button"
        variant="outline"
        size="lg"
        onClick={start}
        disabled={pending}
        className={className ?? 'h-11 w-full rounded-full text-[0.9375rem]'}
      >
        <FcGoogle className="size-5" />
        {pending ? <T k="auth.redirecting" /> : label}
      </Button>
      <FieldError className="text-center">{message}</FieldError>
    </div>
  )
}
