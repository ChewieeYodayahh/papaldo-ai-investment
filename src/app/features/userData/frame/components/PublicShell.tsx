import { FxProvider, type Fx } from '@/app/features/userData/preferences/components/Money'
import { PreferencePersistence } from '@/app/features/userData/preferences/components/PreferencePersistence'

import type { ShellUser } from '../api/shell'

import { PublicNav } from './PublicNav'

/**
 * The signed-out frame: the landing page, and `/markets` when nobody is
 * signed in. The same outer container as the app -- backdrop, equal gap on
 * all four sides, rounded viewport-high frame that scrolls inside -- so moving
 * between the landing page and the dashboard never changes the "window"
 * everything sits in (Carlos, 2026-09-26). Only what is inside differs: a top
 * bar here, a sidebar there.
 *
 * `fx` is optional: the landing page has no `<Money>`. `user` is set when a
 * signed-in visitor opens the landing page, so the top bar shows their account
 * pill instead of "Log in" (Carlos, 2026-09-29).
 */
export function PublicShell({
  children,
  fx = null,
  user = null,
}: {
  children: React.ReactNode
  fx?: Fx
  user?: ShellUser | null
}) {
  return (
    <FxProvider fx={fx}>
      <div data-app-shell className="app-backdrop min-h-svh md:p-(--frame-gap)">
        <div className="app-frame relative mx-auto flex min-h-svh max-w-[2000px] flex-col md:h-[calc(100svh-2*var(--frame-gap))] md:min-h-0 md:overflow-y-auto md:rounded-[1.75rem] md:ring-1 md:ring-foreground/10">
          <PreferencePersistence signedIn={Boolean(user)} />
          <PublicNav user={user} />
          <div className="flex-1">{children}</div>
        </div>
      </div>
    </FxProvider>
  )
}
