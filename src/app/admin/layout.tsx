import { AdminShell } from '@/app/features/admin/components/AdminShell'

export const metadata = { title: { template: '%s · Admin | Papaldo', default: 'Developer Dashboard | Papaldo' }, robots: { index: false } }

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>
}
