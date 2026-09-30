'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

/**
 * The frame for Log in and Get Started (sign-up): no top nav, one plain back
 * button top-left to "About Papaldo Ka" (the landing page, which has the
 * nav), a centered wordmark, and the form in a card styled like the app's.
 *
 * Same backdrop and outer frame as every other page, so arriving here from
 * the landing page does not feel like leaving the product.
 */
export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
  footer: React.ReactNode
}) {
  const t = useCopy()

  return (
    <div data-app-shell className="app-backdrop min-h-svh md:p-(--frame-gap)">
      <main className="app-frame relative flex min-h-svh flex-col md:min-h-[calc(100svh-2*var(--frame-gap))] md:rounded-[1.75rem] md:ring-1 md:ring-foreground/10">
        <div className="p-4 md:p-6">
          <Link
            href="/"
            className={cn(
              buttonVariants({ variant: 'outline', size: 'lg' }),
              'h-10 gap-2 rounded-full bg-card pr-4 pl-3 text-sm font-medium shadow-sm',
            )}
          >
            <ArrowLeft className="size-4" />
            {t('pub.back')}
          </Link>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
          <Link href="/" className="mb-8 text-center" aria-label="Papaldo Ka home">
            <span className="block text-3xl font-semibold tracking-[0.3em] sm:text-4xl">PAPALDO KA</span>
            <span className="mt-2 block text-xs tracking-[0.2em] text-highlight uppercase">Invest like you mean it</span>
          </Link>

          <Card className="w-full max-w-[26rem] rounded-3xl border-0 py-0 shadow-2xl ring-1 ring-foreground/10">
            <CardContent className="px-6 py-8 sm:px-9 sm:py-10">
              <div className="mb-7 space-y-1.5 text-center">
                <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              {children}
            </CardContent>
          </Card>

          <div className="mt-6 text-sm text-muted-foreground">{footer}</div>
        </div>
      </main>
    </div>
  )
}
