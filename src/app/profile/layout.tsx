import { AppShell } from '@/app/features/shell/components/AppShell'

export default function Layout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>
}
