'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'

/** Give up after this long so a failed navigation never leaves the bar running. */
const MAX_MS = 15_000

/**
 * Feedback for the moment between clicking a link and the next page
 * painting: a thin bar across the top and a progress cursor (Carlos,
 * 2026-09-25). The route's `loading.tsx` skeleton takes over once the new
 * segment starts streaming; this covers the gap before it.
 *
 * Listens for clicks in the capture phase, before Next's <Link> calls
 * preventDefault, and ignores anything that is not a same-origin,
 * same-tab navigation to a different URL. It stops when the URL changes.
 */
function Progress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState(false)

  // Arrived: the URL changed, so the navigation is done.
  useEffect(() => {
    setActive(false)
  }, [pathname, searchParams])

  useEffect(() => {
    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      const anchor = (event.target as Element | null)?.closest?.('a')
      if (!anchor || !anchor.href || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return

      setActive(true)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [])

  useEffect(() => {
    if (!active) return
    const root = document.documentElement
    root.setAttribute('data-navigating', '')
    const timeout = window.setTimeout(() => setActive(false), MAX_MS)
    return () => {
      window.clearTimeout(timeout)
      root.removeAttribute('data-navigating')
    }
  }, [active])

  return active ? <div className="nav-progress" role="progressbar" aria-label="Loading page" /> : null
}

/** useSearchParams needs a Suspense boundary so static pages still prerender. */
export function NavigationProgress() {
  return (
    <Suspense fallback={null}>
      <Progress />
    </Suspense>
  )
}
