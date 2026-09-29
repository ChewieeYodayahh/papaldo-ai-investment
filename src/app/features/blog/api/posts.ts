import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'
import type { Tables } from '@/app/core/services/supabase/database.types'

import type { BlogPost } from '../schema'

export function toPost(row: Tables<'blog_posts'>): BlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: row.body,
    status: row.status === 'published' ? 'published' : 'draft',
    authorName: row.author_name,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/** Published articles, newest first. Readable by guests (RLS allows published rows to anon). */
export const listPublished = cache(async (): Promise<BlogPost[]> => {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(100)
  if (error) console.error('[blog] list unavailable:', error.message)
  return (data ?? []).map(toPost)
})

/** One published article by its web address, or null. Drafts are never served here, even to admins. */
export const getPublishedBySlug = cache(async (slug: string): Promise<BlogPost | null> => {
  const supabase = await createClient()
  const { data } = await supabase.from('blog_posts').select('*').eq('slug', slug).eq('status', 'published').maybeSingle()
  return data ? toPost(data) : null
})
