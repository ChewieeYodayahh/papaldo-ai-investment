import type { Metadata } from 'next'
import { Geist, Geist_Mono, Noto_Sans, Figtree } from 'next/font/google'

import { ThemeProvider } from "next-themes"
import './globals.css'
import { cn } from "@/lib/utils";
import { PreferencesEffects } from '@/app/features/preferences/components/PreferencesEffects'
import { NavigationProgress } from '@/app/features/shell/components/NavigationProgress'

const figtree = Figtree({subsets:['latin'],variable:'--font-sans'});

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
