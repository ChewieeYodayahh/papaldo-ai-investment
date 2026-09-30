'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowLeft, ExternalLink } from 'lucide-react'

import { Markdown } from '@/app/features/community/blog/components/Markdown'
import { slugify, type BlogPost } from '@/app/features/community/blog/schema'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

import { DeleteArticleButton } from './actions'

type FieldName = 'title' | 'slug' | 'excerpt' | 'body' | 'status'
type SaveResponse = { ok: true; post: BlogPost } | { ok: false; message: string; fieldErrors?: Partial<Record<FieldName, string>> }

/**
 * "Create an article" and "Edit article". The body is Markdown with a live
 * preview rendered by the same component the public blog uses, so what the
 * admin previews is what readers get. The web address follows the title until
 * the admin edits it by hand; once an article is published its address stays
 * put unless changed on purpose, so shared links keep working.
 */
export function BlogEditor({ post }: { post: BlogPost | null }) {
  const router = useRouter()
  const [title, setTitle] = useState(post?.title ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [slugTouched, setSlugTouched] = useState(Boolean(post))
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [saving, setSaving] = useState<null | 'draft' | 'published'>(null)
  const [message, setMessage] = useState<{ tone: 'good' | 'bad'; text: string } | null>(null)
  const [errors, setErrors] = useState<Partial<Record<FieldName, string>>>({})

  const save = async (status: 'draft' | 'published') => {
    setSaving(status)
    setMessage(null)
    setErrors({})
    try {
      const response = await fetch(post ? `/api/admin/blog/${post.id}` : '/api/admin/blog', {
        method: post ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, slug, excerpt, body, status }),
      })
      const result = (await response.json().catch(() => ({ ok: false, message: 'The server did not answer.' }))) as SaveResponse
      if (!result.ok) {
        setErrors(result.fieldErrors ?? {})
        setMessage({ tone: 'bad', text: result.message })
        return
      }
      setMessage({ tone: 'good', text: status === 'published' ? 'Published.' : 'Draft saved.' })
      if (!post) router.replace(`/admin/blog/${result.post.id}`)
      else router.refresh()
    } catch {
      setMessage({ tone: 'bad', text: 'You look offline. Nothing was saved.' })
    } finally {
      setSaving(null)
    }
  }

  const published = post?.status === 'published'

  return (
    <>
      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link href="/admin/blog" className="mb-1 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> All articles
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight lg:text-[1.75rem]">{post ? 'Edit article' : 'Create an article'}</h1>
          <p className="text-sm text-muted-foreground">
            {post ? (published ? 'Published. Saving updates the live article.' : 'Draft. Only admins can see it.') : 'Write in Markdown. Save a draft or publish when ready.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {published ? (
            <Link href={`/blog/${post.slug}`} target="_blank" className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 rounded-full px-3')}>
              View <ExternalLink className="size-4" />
            </Link>
          ) : null}
          {post ? <DeleteArticleButton id={post.id} title={post.title} redirectTo="/admin/blog" /> : null}
          <Button variant="outline" className="h-9 rounded-full px-4" disabled={saving !== null} onClick={() => save('draft')}>
            {saving === 'draft' ? 'Saving…' : published ? 'Unpublish to draft' : 'Save draft'}
          </Button>
          <Button className="h-9 rounded-full px-4" disabled={saving !== null} onClick={() => save('published')}>
            {saving === 'published' ? 'Publishing…' : published ? 'Update' : 'Publish'}
          </Button>
        </div>
      </div>

      {message ? (
        <p role="status" className={cn('mb-4 rounded-xl px-3 py-2 text-sm', message.tone === 'good' ? 'bg-gain/10 text-gain' : 'bg-loss/10 text-loss')}>
          {message.text}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="rounded-2xl border-0 py-4">
          <CardContent className="px-4">
            <Tabs defaultValue="write">
              <TabsList className="mb-3">
                <TabsTrigger value="write">Write</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
              </TabsList>
              <TabsContent value="write">
                <Field data-invalid={Boolean(errors.body)}>
                  <FieldLabel htmlFor="article-body" className="sr-only">
                    Article
                  </FieldLabel>
                  <Textarea
                    id="article-body"
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    placeholder={'## A heading\n\nWrite the article here. **Bold**, _italic_, [links](https://…), lists and tables all work.'}
                    className="min-h-[28rem] rounded-xl font-mono text-sm leading-6"
                    aria-invalid={Boolean(errors.body)}
                  />
                  <FieldDescription>{body.length.toLocaleString('en-US')} / 50,000 characters · Markdown</FieldDescription>
                  {errors.body ? <FieldError>{errors.body}</FieldError> : null}
                </Field>
              </TabsContent>
              <TabsContent value="preview">
                <article className="min-h-[28rem] rounded-xl bg-muted/30 px-5 py-4">
                  <h2 className="mb-2 text-3xl font-semibold tracking-tight">{title || 'Untitled article'}</h2>
                  {excerpt ? <p className="mb-5 text-muted-foreground">{excerpt}</p> : null}
                  {body ? <Markdown source={body} /> : <p className="text-sm text-muted-foreground">Nothing to preview yet.</p>}
                </article>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <Card className="h-fit rounded-2xl border-0 py-4">
          <CardContent className="px-4">
            <FieldGroup className="gap-4">
              <Field data-invalid={Boolean(errors.title)}>
                <FieldLabel htmlFor="article-title">Title</FieldLabel>
                <Input
                  id="article-title"
                  value={title}
                  maxLength={140}
                  onChange={(event) => {
                    setTitle(event.target.value)
                    if (!slugTouched) setSlug(slugify(event.target.value))
                  }}
                  aria-invalid={Boolean(errors.title)}
                />
                {errors.title ? <FieldError>{errors.title}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.slug)}>
                <FieldLabel htmlFor="article-slug">Web address</FieldLabel>
                <Input
                  id="article-slug"
                  value={slug}
                  maxLength={80}
                  onChange={(event) => {
                    setSlugTouched(true)
                    setSlug(event.target.value.toLowerCase())
                  }}
                  onBlur={() => setSlug((value) => slugify(value))}
                  className="font-mono text-sm"
                  aria-invalid={Boolean(errors.slug)}
                />
                <FieldDescription className="break-all">/blog/{slug || '…'}</FieldDescription>
                {errors.slug ? <FieldError>{errors.slug}</FieldError> : null}
              </Field>
              <Field data-invalid={Boolean(errors.excerpt)}>
                <FieldLabel htmlFor="article-excerpt">Summary</FieldLabel>
                <Textarea
                  id="article-excerpt"
                  value={excerpt}
                  maxLength={300}
                  onChange={(event) => setExcerpt(event.target.value)}
                  placeholder="One or two sentences for the blog index."
                  className="min-h-24 rounded-xl"
                  aria-invalid={Boolean(errors.excerpt)}
                />
                <FieldDescription>{excerpt.length} / 300</FieldDescription>
                {errors.excerpt ? <FieldError>{errors.excerpt}</FieldError> : null}
              </Field>
            </FieldGroup>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
