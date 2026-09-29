import { PreferencePersistence } from '@/app/features/preferences/components/PreferencePersistence'
import { getShellUser } from '@/app/features/shell/api/shell'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'

import { requireAdmin } from '../api/guard'
import { getAdminStats } from '../api/stats'
import { AdminSidebar } from './AdminSidebar'

/**
 * The Developer Dashboard's frame: the same rounded, viewport-high window as
 * the app (so it reads as part of Papaldo), with its own sidebar.
 */
export async function AdminShell({ children }: { children: React.ReactNode }) {
  await requireAdmin()
  const [user, stats] = await Promise.all([getShellUser(), getAdminStats()])

  return (
    <div data-app-shell className="app-backdrop min-h-svh md:p-(--frame-gap)">
      <PreferencePersistence signedIn />
      <SidebarProvider className="app-frame relative mx-auto min-h-svh max-w-[2000px] md:h-[calc(100svh-2*var(--frame-gap))] md:min-h-0 md:overflow-hidden md:rounded-[1.75rem] md:ring-1 md:ring-foreground/10">
        <AdminSidebar email={user?.email ?? null} openSupport={stats?.support_open ?? 0} />
        <SidebarInset className="min-w-0 bg-transparent md:overflow-y-auto">
          <div className="w-full px-4 pt-4 pb-24 md:pr-6 md:pl-3">
            <SidebarTrigger className="mb-2 md:hidden" />
            {children}
          </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  )
}
