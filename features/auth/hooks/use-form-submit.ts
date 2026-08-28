'use client'

import { useState } from 'react'

type ApiResponse = {
  ok: boolean
  message?: string
  fieldErrors?: Record<string, string>
  [key: string]: unknown
}

/** Shown when the fetch itself fails (offline, DNS, CORS) rather than the API. */
export const NETWORK_ERROR =
  'Could not reach the server. Check your connection and try again.'

/**
 * Posts a JSON payload to one of the `app/api` routes and threads the pending
 * state, the top-level message, and per-field errors back into a form.
 *
 * Components never touch Supabase; this is the only way they reach the server.
 */
export function useFormSubmit(endpoint: string) {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(payload: unknown): Promise<ApiResponse | null> {
    setPending(true)
    setMessage(undefined)
    setErrors({})

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const body = (await response.json()) as ApiResponse

      if (!body.ok) {
        setMessage(body.message ?? 'Something went wrong. Please try again.')
        setErrors(body.fieldErrors ?? {})
        return null
      }

      return body
    } catch {
      setMessage(NETWORK_ERROR)
      return null
    } finally {
      setPending(false)
    }
  }

  return { pending, message, errors, submit }
}
