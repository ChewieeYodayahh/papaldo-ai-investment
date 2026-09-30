'use client'

import { useRouter } from 'next/navigation'
import { useRef, useState } from 'react'
import { Plus } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Spinner } from '@/components/ui/spinner'
import { cn } from '@/lib/utils'

const MAX_BYTES = 2 * 1024 * 1024
const ACCEPT = 'image/jpeg,image/png,image/webp'

/**
 * The profile picture with a "+" to upload a new one (Carlos, 2026-09-30).
 * The file goes to /api/profile/avatar, which checks it and uploads it to
 * Cloudinary server-side; this component only picks it and shows progress.
 */
export function AvatarUploader({
  src,
  fallback,
  hasCustom,
}: {
  /** The uploaded picture, else the sign-in provider's. */
  src: string | null
  fallback: string
  /** Whether `src` is an uploaded picture (so "Remove" makes sense). */
  hasCustom: boolean
}) {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File) {
    setError(null)
    if (!ACCEPT.split(',').includes(file.type)) return setError('Use a JPG, PNG or WebP image.')
    if (file.size > MAX_BYTES) return setError('Images can be up to 2 MB.')
    setUploading(true)
    try {
      const body = new FormData()
      body.append('file', file)
      const response = await fetch('/api/profile/avatar', { method: 'POST', body })
      const payload = (await response.json().catch(() => ({ ok: false }))) as { ok: boolean; message?: string }
      if (!payload.ok) setError(payload.message ?? 'The upload did not go through.')
      else router.refresh()
    } catch {
      setError('You seem to be offline. Try again.')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  async function remove() {
    setError(null)
    setUploading(true)
    try {
      const response = await fetch('/api/profile/avatar', { method: 'DELETE' })
      if (response.ok) router.refresh()
      else setError('Could not remove the picture.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="grid justify-items-center gap-1">
      <div className="relative">
        <Avatar className="size-16 text-lg">
          {src ? <AvatarImage src={src} alt="" /> : null}
          <AvatarFallback>{fallback}</AvatarFallback>
        </Avatar>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          aria-label="Upload a profile picture"
          className={cn(
            'absolute -right-1 -bottom-1 grid size-7 place-items-center rounded-full border-2 border-card bg-primary text-primary-foreground shadow transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-70',
          )}
        >
          {uploading ? <Spinner className="size-3.5" /> : <Plus className="size-4" />}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void upload(file)
          }}
        />
      </div>
      {hasCustom && !uploading ? (
        <button type="button" onClick={remove} className="text-[11px] text-muted-foreground underline-offset-2 hover:underline">
          Remove
        </button>
      ) : null}
      {error ? (
        <p role="alert" className="max-w-40 text-center text-[11px] text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  )
}
