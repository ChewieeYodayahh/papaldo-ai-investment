import { z } from 'zod'

/** "Why I Started Investing at 21!" -> "why-i-started-investing-at-21". Matches the table's slug check. */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    .replace(/-+$/g, '')
}

/** The same limits as public.blog_posts, so the form fails before the database would. */
export const blogPostInput = z.object({
  title: z.string().trim().min(1, 'Give the article a title.').max(140, 'Keep the title under 140 characters.'),
  slug: z
    .string()
    .trim()
    .min(1, 'Add a web address for the article.')
    .max(80, 'Keep the web address under 80 characters.')
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens only.'),
  excerpt: z.string().trim().max(300, 'Keep the summary under 300 characters.'),
  body: z.string().trim().min(1, 'Write the article before saving.').max(50_000, 'The article is over 50,000 characters.'),
  status: z.enum(['draft', 'published']),
})

export type BlogPostInput = z.infer<typeof blogPostInput>

export type BlogPost = {
  id: string
  slug: string
  title: string
  excerpt: string
  body: string
  status: 'draft' | 'published'
  authorName: string
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
