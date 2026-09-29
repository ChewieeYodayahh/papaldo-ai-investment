'use client'

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Trash2 } from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'

type Result = { ok: boolean; message?: string }

/** Sends one admin request and refreshes the server-rendered page on success. */
function useAdminRequest() {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const send = async (url: string, method: 'PATCH' | 'POST' | 'DELETE', body?: unknown): Promise<boolean> => {
    setError(null)
    try {
      const response = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      })
      const payload = (await response.json().catch(() => ({ ok: false }))) as Result
      if (!response.ok || !payload.ok) {
        setError(payload.message ?? 'That did not work. Try again.')
        return false
      }
      startTransition(() => router.refresh())
      return true
    } catch {
      setError('You look offline. Try again.')
      return false
    }
  }

  return { send, pending, error }
}

/** Mark resolved / Reopen on a support message. */
export function SupportStatusButton({ id, status }: { id: string; status: string }) {
  const { send, pending, error } = useAdminRequest()
  const [busy, setBusy] = useState(false)
  const next = status === 'resolved' ? 'open' : 'resolved'
  return (
    <div className="grid justify-items-end gap-1">
      <Button
        size="sm"
        variant={next === 'resolved' ? 'default' : 'outline'}
        className="rounded-full"
        disabled={busy || pending}
        onClick={async () => {
          setBusy(true)
          await send(`/api/admin/support/${id}`, 'PATCH', { status: next })
          setBusy(false)
        }}
      >
        {next === 'resolved' ? 'Mark resolved' : 'Reopen'}
      </Button>
      {error ? <p className="text-xs text-loss">{error}</p> : null}
    </div>
  )
}

/** Grant or revoke admin, behind a confirmation. The database refuses self-demotion. */
export function RoleToggle({ userId, email, isAdmin, isSelf }: { userId: string; email: string; isAdmin: boolean; isSelf: boolean }) {
  const { send, pending, error } = useAdminRequest()
  const [open, setOpen] = useState(false)
  if (isSelf) return <span className="text-xs text-muted-foreground">You</span>

  return (
    <div className="grid justify-items-end gap-1">
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger render={<Button size="sm" variant={isAdmin ? 'outline' : 'secondary'} className="rounded-full" disabled={pending} />}>
          {isAdmin ? 'Remove admin' : 'Make admin'}
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{isAdmin ? 'Remove admin access?' : 'Make this user an admin?'}</AlertDialogTitle>
            <AlertDialogDescription>
              {isAdmin
                ? `${email} will lose the Developer Dashboard, the logs and blog editing.`
                : `${email} will see every log, every user and every support message, and can edit the blog.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No</AlertDialogCancel>
            <AlertDialogAction
              variant={isAdmin ? 'destructive' : 'default'}
              disabled={pending}
              onClick={async () => {
                if (await send(`/api/admin/users/${userId}/role`, 'POST', { admin: !isAdmin })) setOpen(false)
              }}
            >
              Yes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {error && !open ? <p className="text-xs text-loss">{error}</p> : null}
    </div>
  )
}

/** "Delete an article" -- a Yes / No modal, as specified. Deletion is permanent. */
export function DeleteArticleButton({ id, title, redirectTo }: { id: string; title: string; redirectTo?: string }) {
  const router = useRouter()
  const { send, pending, error } = useAdminRequest()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={<Button size="sm" variant="ghost" className="rounded-full text-loss hover:bg-loss/10 hover:text-loss" aria-label={`Delete ${title}`} />}
      >
        <Trash2 className="size-4" /> Delete
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Would you like to delete this article?</AlertDialogTitle>
          <AlertDialogDescription>
            “{title}” will be removed for everyone. Deletion cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? <p className="text-sm text-loss">{error}</p> : null}
        <AlertDialogFooter>
          <AlertDialogCancel>No</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy || pending}
            onClick={async () => {
              setBusy(true)
              const ok = await send(`/api/admin/blog/${id}`, 'DELETE')
              setBusy(false)
              if (!ok) return
              setOpen(false)
              if (redirectTo) router.push(redirectTo)
            }}
          >
            {busy ? 'Deleting…' : 'Yes, delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
