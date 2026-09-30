import 'server-only'

import { v2 as cloudinary, type UploadApiResponse } from 'cloudinary'

import { withIntegrationLog } from '@/app/core/services/integration-log'
import { createClient } from '@/app/core/services/supabase/server'
import { getSessionUser } from '@/app/core/services/supabase/session'

export const AVATAR_MAX_BYTES = 2 * 1024 * 1024

export type AvatarResult = { ok: true; avatarUrl: string } | { ok: false; status: number; message: string }

/** The real format from the file's first bytes; the browser's declared type is not trusted. */
export function sniffImage(bytes: Uint8Array): 'jpeg' | 'png' | 'webp' | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'jpeg'
  if (bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((b, i) => bytes[i] === b)) return 'png'
  const ascii = (from: number, to: number) => String.fromCharCode(...bytes.slice(from, to))
  if (bytes.length >= 12 && ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  return null
}

/**
 * Cloudinary credentials, read by name only. The values live in .env.local and
 * Vercel (set by Carlos); nothing here logs or returns them, and the secret
 * never leaves the server -- the upload is signed here, not in the browser.
 */
function configured(): boolean {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) return false
  cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
    secure: true,
  })
  return true
}

/**
 * Replaces the signed-in user's profile picture (Carlos, 2026-09-30).
 *
 * Checks the real bytes (JPEG, PNG or WebP, 2MB at most), uploads to
 * `papaldo/avatars/<user id>` -- overwriting the previous one, so each account
 * keeps a single image -- cropped to a 256px square around the face, and
 * stores the https URL. The users.avatar_url CHECK only accepts
 * res.cloudinary.com, so nothing else can be saved there.
 */
export async function uploadAvatar(file: File | null): Promise<AvatarResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, status: 401, message: 'Sign in to change your picture.' }
  if (!file || file.size === 0) return { ok: false, status: 400, message: 'Choose an image first.' }
  if (file.size > AVATAR_MAX_BYTES) return { ok: false, status: 413, message: 'Images can be up to 2 MB.' }

  const bytes = new Uint8Array(await file.arrayBuffer())
  const format = sniffImage(bytes)
  if (!format) return { ok: false, status: 415, message: 'Use a JPG, PNG or WebP image.' }
  if (!configured()) return { ok: false, status: 503, message: 'Profile pictures are not set up yet. Try again later.' }

  let uploaded: UploadApiResponse
  try {
    uploaded = await withIntegrationLog('cloudinary', 'upload/avatar', () =>
      new Promise<UploadApiResponse>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'papaldo/avatars',
            public_id: user.id,
            overwrite: true,
            invalidate: true,
            resource_type: 'image',
            allowed_formats: ['jpg', 'png', 'webp'],
            transformation: [{ width: 256, height: 256, crop: 'fill', gravity: 'face' }],
          },
          (error, result) => (error || !result ? reject(error ?? new Error('Empty upload result')) : resolve(result)),
        )
        stream.end(Buffer.from(bytes))
      }),
    )
  } catch (error) {
    console.error('[avatar] upload failed:', error instanceof Error ? error.message : 'unknown error')
    return { ok: false, status: 502, message: 'The upload did not go through. Try again.' }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('users').update({ avatar_url: uploaded.secure_url }).eq('id', user.id)
  if (error) return { ok: false, status: 500, message: 'Uploaded, but the picture could not be saved. Try again.' }
  return { ok: true, avatarUrl: uploaded.secure_url }
}

/** Back to the provider picture or initials. The Cloudinary copy is overwritten on the next upload. */
export async function removeAvatar(): Promise<AvatarResult> {
  const user = await getSessionUser()
  if (!user) return { ok: false, status: 401, message: 'Sign in first.' }
  const supabase = await createClient()
  const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', user.id)
  return error ? { ok: false, status: 500, message: 'Could not remove the picture.' } : { ok: true, avatarUrl: '' }
}
