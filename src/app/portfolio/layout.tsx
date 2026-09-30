import { AppShell } from '@/app/features/userData/frame/components/AppShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
