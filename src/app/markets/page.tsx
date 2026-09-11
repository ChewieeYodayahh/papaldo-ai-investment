import { MarketsPage } from '@/app/features/markets/pages/markets.page'

export const metadata = { title: 'Markets' }

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  return <MarketsPage query={(await searchParams).q ?? ''} />
}
