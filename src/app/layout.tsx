import type { Metadata } from 'next'
import { Geist, Geist_Mono, Figtree } from 'next/font/google'

import { ThemeProvider } from "next-themes"
import './globals.css'
import { cn } from "@/lib/utils";
import { PreferencesEffects } from '@/app/features/userData/preferences/components/PreferencesEffects'
import { NavigationProgress } from '@/app/features/userData/frame/components/NavigationProgress'

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

// Geist and Geist Mono are only used when picked in Settings -> Fonts, so they
// are not preloaded on every page (that preload was the browser's
// "preloaded but not used" console warning).
const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
  preload: false,
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
  preload: false,
})

export const metadata: Metadata = {
  title: {
    default: 'Papaldo',
    template: '%s | Papaldo',
  },
  description: 'AI investment simulation dashboard for Filipino investors.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    // The Geist variables sit on <html>, not <body>: Settings -> Fonts swaps
    // --font-sans on <html>, and a var() only resolves against what is
    // declared on the same element or above it.
    <html
      lang="en"
      className={cn('font-sans', figtree.variable, geistSans.variable, geistMono.variable)}
      suppressHydrationWarning
    >
      <body className="antialiased">
        {/* Dark by default since the Phase 5 redesign -- the forest palette was
            designed dark-first. Light and system are one click away in
            Settings -> Themes. */}
        <ThemeProvider attribute="class" defaultTheme="dark" disableTransitionOnChange>
          <PreferencesEffects />
          <NavigationProgress />
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
