'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { LogOut } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/** Signs out through the API route, then lands on the landing page. */
export function useSignOut() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await fetch('/api/auth/sign-out', { method: 'POST' })
    router.push('/')
    router.refresh()
  }

  return { pending, signOut }
}

export function SignOutButton({ className, variant = 'outline' }: { className?: string; variant?: 'outline' | 'ghost' }) {
  const { pending, signOut } = useSignOut()

  return (
    <Button type="button" variant={variant} onClick={signOut} disabled={pending} className={cn('rounded-full px-4', className)}>
      <LogOut data-icon="inline-start" />
      {pending ? 'Signing out…' : 'Sign out'}
    </Button>
  )
}
