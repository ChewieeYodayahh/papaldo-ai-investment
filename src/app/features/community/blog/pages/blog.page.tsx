import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

import { getPublishedBySlug, listPublished } from '../api/posts'
import { Markdown } from '../components/Markdown'

const dateLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' }) : ''

/** Roughly 220 words a minute. */
const readingMinutes = (body: string) => Math.max(1, Math.round(body.split(/\s+/).length / 220))

/** `/blog` -- published articles, newest first. Open to guests. */
export async function BlogIndexPage() {
  const posts = await listPublished()

  if (posts.length === 0) {
    return (
      <Card className="rounded-2xl border-0">
        <CardContent className="space-y-1 p-6">
          <p className="font-medium">No articles yet.</p>
          <p className="text-sm text-muted-foreground">The Papaldo team is writing the first ones. Check back soon.</p>
        </CardContent>
      </Card>
    )
  }

  const [lead, ...rest] = posts
  return (
    <div className="grid gap-4">
      <Link href={`/blog/${lead.slug}`} className="group block rounded-3xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
        <Card className="hero-mesh rounded-3xl border-0 py-0 transition-colors group-hover:bg-accent/40">
          <CardContent className="grid gap-3 px-6 py-8 sm:px-8">
            <p className="text-xs text-muted-foreground">
              {dateLabel(lead.publishedAt)} · {readingMinutes(lead.body)} min read
            </p>
            <h2 className="max-w-3xl text-2xl font-semibold tracking-tight text-balance sm:text-3xl">{lead.title}</h2>
            {lead.excerpt ? <p className="max-w-2xl text-muted-foreground">{lead.excerpt}</p> : null}
            <p className="text-sm font-medium text-primary">Read the article</p>
          </CardContent>
        </Card>
      </Link>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rest.map((post) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="group block rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <Card className="h-full rounded-2xl border-0 transition-colors group-hover:bg-accent/40">
              <CardContent className="grid gap-2 px-5 py-5">
                <p className="text-xs text-muted-foreground">
                  {dateLabel(post.publishedAt)} · {readingMinutes(post.body)} min read
                </p>
                <h3 className="text-lg font-semibold tracking-tight">{post.title}</h3>
                {post.excerpt ? <p className="line-clamp-3 text-sm text-muted-foreground">{post.excerpt}</p> : null}
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}

/** `/blog/[slug]` -- one published article. */
export async function BlogPostPage({ slug }: { slug: string }) {
  const post = await getPublishedBySlug(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto grid w-full max-w-3xl gap-6">
      <Link href="/blog" className={cn(buttonVariants({ variant: 'ghost' }), 'w-fit gap-2 rounded-full px-3')}>
        <ArrowLeft className="size-4" /> All articles
      </Link>
      <header className="grid gap-3">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{post.title}</h2>
        {post.excerpt ? <p className="text-lg text-muted-foreground">{post.excerpt}</p> : null}
        <p className="text-sm text-muted-foreground">
          {post.authorName} · {dateLabel(post.publishedAt)} · {readingMinutes(post.body)} min read
        </p>
      </header>
      <Card className="rounded-3xl border-0">
        <CardContent className="px-6 py-7 sm:px-8">
          <Markdown source={post.body} />
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground">
        Papaldo articles are for learning. They are not financial advice, and Papaldo trades simulated money only.
      </p>
    </article>
  )
}

export async function blogPostTitle(slug: string): Promise<string> {
  const post = await getPublishedBySlug(slug)
  return post?.title ?? 'Article'
}
