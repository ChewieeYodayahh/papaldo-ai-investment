import { MemberProfilePage } from '@/app/features/community/pages/member-profile.page'

type Params = { params: Promise<{ username: string }> }

export async function generateMetadata({ params }: Params) {
  return { title: `@${decodeURIComponent((await params).username)}` }
}

export default async function Page({ params }: Params) {
  return <MemberProfilePage username={(await params).username} />
}
