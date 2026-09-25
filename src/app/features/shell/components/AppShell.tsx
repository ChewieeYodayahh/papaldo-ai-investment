import { FxProvider } from '@/app/features/preferences/components/Money'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { getShellData } from '../api/shell'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

/**
 * The chrome around every app page, and the one USD->PHP rate every
 * `<Money>` on the page converts with.
 *
 * From md up the whole app sits in one rounded frame with the page background
 * showing around it (Carlos, 2026-09-25, after the Helios reference). The
 * frame is viewport-high and the content scrolls inside it, so the sidebar
 * and header never scroll away. Below md there is no frame: the sidebar is a
 * sheet and the page scrolls normally.
 *
 * Works signed out too (`/markets` is public): the header swaps the user card
 * for Log in / Sign up and drops the bell.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const { user, fx, notifications, greetingIndex } = await getShellData()

  return (
    <FxProvider fx={fx}>
      <div data-app-shell className="app-backdrop min-h-svh md:p-4 lg:p-5">
        <SidebarProvider className="app-frame relative mx-auto min-h-svh max-w-[1440px] md:h-[calc(100svh-2rem)] md:min-h-0 md:overflow-hidden md:rounded-[1.75rem] md:ring-1 md:ring-foreground/10 lg:h-[calc(100svh-2.5rem)]">
          <AppSidebar />
          <SidebarInset className="min-w-0 bg-transparent md:overflow-y-auto">
            <div className="w-full px-4 pb-6 md:pr-5 md:pl-2">
              <AppHeader user={user} notifications={notifications} greetingIndex={greetingIndex} />
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </FxProvider>
  )
}
