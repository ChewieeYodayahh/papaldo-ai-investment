import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Plus } from 'lucide-react'

import { getPostById, listAllPosts } from '@/app/features/blog/api/manage'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { requireAdmin } from '../api/guard'
import { DeleteArticleButton } from '../components/actions'
import { BlogEditor } from '../components/BlogEditor'
import { AdminPageHeader, StatusBadge, timeLabel } from '../components/ui'

/** `/admin/blog` -- every article, drafts included. */
export async function BlogAdminPage() {
  await requireAdmin()
  const posts = await listAllPosts()
  const drafts = posts.filter((p) => p.status === 'draft').length

  return (
    <>
      <AdminPageHeader
        title="Blog"
        description={`${posts.length - drafts} published · ${drafts} ${drafts === 1 ? 'draft' : 'drafts'}`}
        actions={
          <Link href="/admin/blog/new" className={cn(buttonVariants(), 'h-9 gap-2 rounded-full px-4')}>
            <Plus className="size-4" /> Create an article
          </Link>
        }
      />
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          {posts.length === 0 ? (
            <p className="px-3 py-10 text-center text-sm text-muted-foreground">No articles yet. Create the first one.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Last edited</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {posts.map((post) => (
                  <TableRow key={post.id}>
                    <TableCell className="max-w-md">
                      <Link href={`/admin/blog/${post.id}`} className="font-medium hover:underline">
                        {post.title}
                      </Link>
                      <p className="truncate font-mono text-xs text-muted-foreground">/blog/{post.slug}</p>
                    </TableCell>
                    <TableCell><StatusBadge status={post.status} /></TableCell>
                    <TableCell>{post.authorName}</TableCell>
                    <TableCell className="text-muted-foreground">{timeLabel(post.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/blog/${post.id}`} className={cn(buttonVariants({ variant: 'ghost', size: 'sm' }), 'rounded-full')}>
                          Edit
                        </Link>
                        <DeleteArticleButton id={post.id} title={post.title} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

/** `/admin/blog/new` and `/admin/blog/[id]`. */
export async function BlogEditorPage({ id }: { id: string | null }) {
  await requireAdmin()
  if (!id) return <BlogEditor post={null} />
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound()
  const post = await getPostById(id)
  if (!post) notFound()
  return <BlogEditor post={post} />
}
