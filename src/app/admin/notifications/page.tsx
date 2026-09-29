import { NotificationLogPage } from '@/app/features/admin/pages/logs.page'

export const metadata = { title: 'Notification log' }

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  return <NotificationLogPage searchParams={await searchParams} />
}
