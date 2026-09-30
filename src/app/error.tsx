'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * The error boundary for every page and nested layout (AppShell included).
 * Before this existed a render error became Next's bare 500 page.
 *
 * Deliberately plain: an error page should depend on as little as possible,
 * so it uses no stores, no copy dictionary and no data. `digest` is the id
 * Vercel's runtime logs show for the same error.
 */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] render error', error.digest ?? '', error)
  }, [error])

  return (
    <main className="grid min-h-[60svh] place-items-center bg-background px-4 py-16 text-foreground">
      <div className="max-w-md text-center">
        <p className="text-sm font-medium text-muted-foreground">Something went wrong</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page didn’t load</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Usually a data provider took too long. Your simulated portfolio is safe; nothing was changed.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button onClick={reset} className="h-10 rounded-full px-5">
            Try again
          </Button>
          <Link href="/" className={cn(buttonVariants({ variant: 'outline' }), 'h-10 rounded-full px-5')}>
            Go home
          </Link>
        </div>
        {error.digest ? <p className="mt-6 font-mono text-xs text-muted-foreground">Error ID {error.digest}</p> : null}
      </div>
    </main>
  )
}
