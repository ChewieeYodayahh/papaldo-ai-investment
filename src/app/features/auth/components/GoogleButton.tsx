'use client'

import { useState } from 'react'
import { FcGoogle } from 'react-icons/fc'

import { Button } from '@/components/ui/button'
import { FieldError } from '@/components/ui/field'

import { NETWORK_ERROR } from '../hooks/use-form-submit'

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
  label: string
  endpoint?: string
  className?: string
}) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()

  async function start() {
    setPending(true)
    setMessage(undefined)
    try {
      const response = await fetch(endpoint, { method: 'POST' })
      const body = (await response.json()) as { ok: boolean; url?: string; message?: string }
      if (!body.ok || !body.url) {
        setMessage(body.message ?? 'Could not start Google sign-in.')
        setPending(false)
        return
      }
      window.location.assign(body.url)
    } catch {
      setMessage(NETWORK_ERROR)
      setPending(false)
    }
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
        {pending ? 'Redirecting…' : label}
      </Button>
      <FieldError className="text-center">{message}</FieldError>
    </div>
  )
}
