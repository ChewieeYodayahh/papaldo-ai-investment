import type { Metadata } from 'next'

import { BlogPostPage, blogPostTitle } from '@/app/features/community/blog/pages/blog.page'

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: await blogPostTitle((await params).slug) }
}

export default async function Page({ params }: Props) {
  return <BlogPostPage slug={(await params).slug} />
}
