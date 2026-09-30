'use client'

import { usePathname } from 'next/navigation'

import type { Order } from '@/app/features/trading/types'

import type { SetupProgress } from '../types'
import { useSetupHydrated, useSetupStore } from '../setup-store'
import { FirstTradeTour } from './FirstTradeTour'
import { GetStartedDock } from './GetStartedDock'
import { WelcomeDialog } from './WelcomeDialog'

/**
 * Everything first-time setup puts on screen, mounted once per signed-in page
 * by AppShell: the welcome carousel, the Get Started checklist, and the
 * first-trade walkthrough.
 *
 * Nothing renders until the setup store has rehydrated from localStorage.
 * Its defaults say "welcome not seen", so rendering before that would flash
 * the welcome at people who dismissed it long ago.
 *
 * The store is only touched inside the effect. On the server there is no
 * localStorage, so zustand's persist attaches no `.persist` API, and reading
 * it during render crashed every signed-in page render on Vercel with
 * "reading 'hasHydrated'" -- the /markets 500 (fixed 2026-09-30). Starting
 * from `false` also keeps the server and the first client render identical.
 */
export function FirstTimeSetup({ setup, orders }: { setup: SetupProgress; orders: Order[] }) {
  const pathname = usePathname()
  const hydrated = useSetupHydrated()
  const welcomeSeen = useSetupStore((s) => s.welcomeSeen)

  if (!hydrated) return null

  const allDone = setup.profile && setup.quiz && setup.trade

  return (
    <>
      <WelcomeDialog open={!welcomeSeen && !allDone && pathname === '/dashboard'} />
      <GetStartedDock setup={setup} />
      <FirstTradeTour setup={setup} orders={orders} />
    </>
  )
}
