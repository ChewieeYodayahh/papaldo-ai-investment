'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

import { Button } from '@/components'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleClick() {
    setPending(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    router.push('/login')
    router.refresh()
  }

  return (
    <Button type="button" variant="secondary" onClick={handleClick} disabled={pending}>
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
