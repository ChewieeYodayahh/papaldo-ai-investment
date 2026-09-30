'use client'

import './globals.css'

/**
 * Last-resort boundary for an error in the root layout itself, where
 * `error.tsx` cannot help. It replaces the whole document, so it brings its
 * own <html> and <body> and the stylesheet, and nothing else.
 */
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en" className="dark">
      <body className="grid min-h-svh place-items-center bg-background px-4 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Papaldo hit a snag</h1>
          <p className="mt-3 text-sm text-muted-foreground">Reload to try again. Nothing in your account was changed.</p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 h-10 rounded-full bg-primary px-5 text-sm font-medium text-primary-foreground"
          >
            Try again
          </button>
          {error.digest ? <p className="mt-6 font-mono text-xs text-muted-foreground">Error ID {error.digest}</p> : null}
        </div>
      </body>
    </html>
  )
}
