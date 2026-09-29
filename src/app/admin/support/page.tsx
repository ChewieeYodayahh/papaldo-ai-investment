import { SupportInboxPage } from '@/app/features/admin/pages/people.page'

export const metadata = { title: 'Support' }

export default async function Page({ searchParams }: { searchParams: Promise<{ resolved?: string }> }) {
  return <SupportInboxPage showResolved={(await searchParams).resolved === '1'} />
}
