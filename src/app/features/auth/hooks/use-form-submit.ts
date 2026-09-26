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
 * Sends a JSON payload to one of the `app/api` routes and threads the pending
 * state, the top-level message, and per-field errors back into a form.
 *
 * Components never touch Supabase; this is the only way they reach the server.
 */
export function useFormSubmit(endpoint: string, method: 'POST' | 'PATCH' = 'POST') {
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()
  const [errors, setErrors] = useState<Record<string, string>>({})

  async function submit(payload: unknown): Promise<ApiResponse | null> {
    setPending(true)
    setMessage(undefined)
    setErrors({})

    try {
      let response: Response
      try {
        response = await fetch(endpoint, {
          method,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } catch {
        // Only a fetch that never got an answer is a connection problem.
        setMessage(NETWORK_ERROR)
        return null
      }

      // A non-JSON answer (an unhandled server error) is our fault, not the
      // user's network, and the message should not send them to check it.
      const body = (await response.json().catch(() => null)) as ApiResponse | null
      if (!body) {
        setMessage(`Something went wrong on our side (HTTP ${response.status}). Please try again.`)
        return null
      }

      if (!body.ok) {
        setMessage(body.message ?? 'Something went wrong. Please try again.')
        setErrors(body.fieldErrors ?? {})
        return null
      }

      return body
    } finally {
      setPending(false)
    }
  }

  return { pending, message, errors, submit }
}
