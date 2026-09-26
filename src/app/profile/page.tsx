import { ProfileDashboardPage } from '@/app/features/auth/pages/profile-dashboard.page'

export const metadata = { title: 'Profile' }

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  return <ProfileDashboardPage searchParams={await searchParams} />
}
