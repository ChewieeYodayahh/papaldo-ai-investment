import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'

import { blogPostInput, type BlogPost } from '../schema'
import { toPost } from './posts'

export type SaveResult =
  | { ok: true; post: BlogPost }
  | { ok: false; message: string; fieldErrors?: Partial<Record<'title' | 'slug' | 'excerpt' | 'body' | 'status', string>> }

/**
 * Admin writes for the blog. RLS lets only admins insert, update or delete,
 * so these run with the admin's own session -- no service key -- and the
 * database's triggers stamp the author, timestamps and audit log.
 */

export async function listAllPosts(): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').select('*').order('updated_at', { ascending: false })
  if (error) console.error('[blog] admin list unavailable:', error.message)
  return (data ?? []).map(toPost)
}

export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*').eq('id', id).maybeSingle()
  return data ? toPost(data) : null
}

function validate(input: unknown) {
  const parsed = blogPostInput.safeParse(input)
  if (parsed.success) return { ok: true as const, data: parsed.data }
  const fieldErrors: Record<string, string> = {}
  for (const issue of parsed.error.issues) {
    const field = String(issue.path[0] ?? '')
    if (field && !fieldErrors[field]) fieldErrors[field] = issue.message
  }
  return { ok: false as const, fieldErrors }
}

function friendly(message: string, code?: string): SaveResult {
  if (code === '23505') return { ok: false, message: 'Another article already uses that web address.', fieldErrors: { slug: 'Already taken.' } }
  if (code === '42501') return { ok: false, message: 'Only admins can change articles.' }
  return { ok: false, message }
}

export async function createPost(input: unknown): Promise<SaveResult> {
  const checked = validate(input)
  if (!checked.ok) return { ok: false, message: 'Check the highlighted fields.', fieldErrors: checked.fieldErrors }
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').insert(checked.data).select('*').single()
  if (error || !data) return friendly(error?.message ?? 'The article was not saved.', error?.code)
  return { ok: true, post: toPost(data) }
}

export async function updatePost(id: string, input: unknown): Promise<SaveResult> {
  const checked = validate(input)
  if (!checked.ok) return { ok: false, message: 'Check the highlighted fields.', fieldErrors: checked.fieldErrors }
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').update(checked.data).eq('id', id).select('*').maybeSingle()
  if (error) return friendly(error.message, error.code)
  if (!data) return { ok: false, message: 'That article no longer exists.' }
  return { ok: true, post: toPost(data) }
}

export async function deletePost(id: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('blog_posts').delete().eq('id', id).select('id')
  if (error) return { ok: false, message: error.message }
  if (!data?.length) return { ok: false, message: 'That article was already deleted, or you can’t delete it.' }
  return { ok: true }
}
