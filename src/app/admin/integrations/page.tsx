import { IntegrationLogsPage } from '@/app/features/admin/pages/logs.page'

export const metadata = { title: 'Integration logs' }

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <IntegrationLogsPage searchParams={await searchParams} />
}
