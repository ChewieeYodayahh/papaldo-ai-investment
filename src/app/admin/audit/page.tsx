import { AuditLogPage } from '@/app/features/admin/pages/logs.page'

export const metadata = { title: 'Audit log' }

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <AuditLogPage searchParams={await searchParams} />
}
