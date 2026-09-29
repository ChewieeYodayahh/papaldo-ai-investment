import { cookies } from 'next/headers'

import { FxProvider } from '@/app/features/preferences/components/Money'
import { PreferencePersistence } from '@/app/features/preferences/components/PreferencePersistence'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'

import { getShellData } from '../api/shell'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'
import { FirstTimeSetup } from './FirstTimeSetup'
import { PageTitle } from './PageTitle'
import { PublicShell } from './PublicShell'

/** Written by the shadcn SidebarProvider whenever the sidebar is toggled. */
const SIDEBAR_COOKIE = 'sidebar_state'

/**
 * The chrome around every app page, and the one USD->PHP rate every
 * `<Money>` on the page converts with.
 *
 * Rendered from each app route's `layout.tsx`, not from the pages, so the
 * route's `loading.tsx` skeleton appears *inside* the frame while a page
 * loads instead of replacing the whole screen.
 *
 * From md up the app sits in one rounded frame with the same gap
 * (`--frame-gap`, globals.css) on all four sides. The frame is
 * viewport-high and the content scrolls inside it, so the sidebar and header
 * never scroll away. Below md there is no frame: the sidebar is a sheet and
 * the page scrolls normally.
 *
 * Signed out (only `/markets` is public) there is no sidebar at all: the page
 * gets the same frame as the landing page, with its top bar (Carlos,
 * 2026-09-26). Signed in, the Get Started checklist rides along on every page.
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const [{ user, fx, notifications, greetingSeed, setup }, cookieStore] = await Promise.all([
    getShellData(),
    cookies(),
  ])

  if (!user) {
    return (
      <PublicShell fx={fx}>
        <div className="mx-auto w-full max-w-[1600px] px-4 pt-6 pb-8 md:px-6">
          <PageTitle />
          {children}
        </div>
      </PublicShell>
    )
  }

  // The provider writes this cookie but never reads it back. Each route has
  // its own layout, so without this the sidebar re-expanded on every page.
  const sidebarOpen = cookieStore.get(SIDEBAR_COOKIE)?.value !== 'false'

  return (
    <FxProvider fx={fx}>
      <PreferencePersistence signedIn />
      <div data-app-shell className="app-backdrop min-h-svh md:p-(--frame-gap)">
        <SidebarProvider
          defaultOpen={sidebarOpen}
          className="app-frame relative mx-auto min-h-svh max-w-[2000px] md:h-[calc(100svh-2*var(--frame-gap))] md:min-h-0 md:overflow-hidden md:rounded-[1.75rem] md:ring-1 md:ring-foreground/10"
        >
          <AppSidebar isAdmin={user.isAdmin} />
          <SidebarInset className="min-w-0 bg-transparent md:overflow-y-auto">
            <div className="w-full px-4 pb-24 md:pr-5 md:pl-2">
              <AppHeader user={user} notifications={notifications} greetingSeed={greetingSeed} />
              {children}
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
      {setup ? <FirstTimeSetup setup={setup} orders={notifications} /> : null}
    </FxProvider>
  )
}
