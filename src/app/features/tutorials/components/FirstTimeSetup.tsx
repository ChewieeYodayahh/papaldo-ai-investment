'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import type { Order } from '@/app/features/trading/types'

import type { SetupProgress } from '../types'
import { useSetupStore } from '../setup-store'
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
 */
export function FirstTimeSetup({ setup, orders }: { setup: SetupProgress; orders: Order[] }) {
  const pathname = usePathname()
  const [hydrated, setHydrated] = useState(() => useSetupStore.persist.hasHydrated())
  const welcomeSeen = useSetupStore((s) => s.welcomeSeen)

  useEffect(() => {
    const unsubscribe = useSetupStore.persist.onFinishHydration(() => setHydrated(true))
    if (!useSetupStore.persist.hasHydrated()) void useSetupStore.persist.rehydrate()
    return unsubscribe
  }, [])

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
