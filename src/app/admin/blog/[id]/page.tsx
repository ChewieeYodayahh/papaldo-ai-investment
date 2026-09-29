import { BlogEditorPage } from '@/app/features/admin/pages/blog-admin.page'

export const metadata = { title: 'Edit article' }

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <BlogEditorPage id={(await params).id} />
}
