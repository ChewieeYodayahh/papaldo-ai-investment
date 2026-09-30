import { ToolsPage } from '@/app/features/tools/pages/tools.page'

export const metadata = { title: 'Tools' }

export default async function Page({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
  return <ToolsPage open={(await searchParams).open} />
}
