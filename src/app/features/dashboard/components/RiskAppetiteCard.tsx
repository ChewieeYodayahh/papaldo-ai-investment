'use client'

import Link from 'next/link'
import { useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogTitle } from '@/components/ui/dialog'
import type { RiskBand } from '@/app/features/tools/quiz/types'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

/**
 * The risk band, in words, with the quiz one click away.
 *
 * The quiz opens behind an intro dialog rather than navigating straight to
 * `/isq`: "Maybe later" is a real answer (the ISQ stopped being a gate on
 * 2026-09-11), and the dialog is where it can be given.
 *
 * There is no "Complete your user profile" button here although the mockup
 * has one: that step lives in the Get Started checklist (shell), which is on
 * every signed-in page, so a second entry point here would compete with it.
 */
export function RiskAppetiteCard({ band, firstName }: { band: RiskBand | null; firstName: string }) {
  const t = useCopy()
  const [open, setOpen] = useState(false)

  return (
    <Card className="h-full rounded-2xl border-0 py-4">
      <CardContent className="flex h-full flex-col gap-3 px-4">
        <h2 className="text-base font-medium">{t('dash.riskAppetite')}</h2>
        <p className="text-[0.9375rem]">
          {t('dash.youAre')}{' '}
          <span className={cn('font-semibold', band ? 'text-highlight' : 'text-muted-foreground')}>
            {band ? t(`dash.band.${band}`) : t('dash.band.none')}
          </span>
        </p>
        <p className="text-sm text-muted-foreground">{t(band ? `dash.blurb.${band}` : 'dash.blurb.none')}</p>

        <div className="mt-auto pt-1">
          <Button
            variant="secondary"
            className="w-full justify-start rounded-full px-4"
            onClick={() => setOpen(true)}
          >
            {band ? t('dash.retake') : t('dash.whatIsProfile')}
          </Button>
        </div>
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="gap-5 rounded-2xl p-6 text-center ring-2 ring-primary/60 sm:max-w-md">
          <DialogTitle className="text-lg font-medium">{t('dash.quizTitle')}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed text-foreground">
            {/* Split on the placeholder so the name can wear the highlight. */}
            {t('dash.quizBody')
              .split('{name}')
              .map((part, i) => (
                <span key={i}>
                  {i > 0 ? <span className="text-highlight">{firstName}</span> : null}
                  {part}
                </span>
              ))}
          </DialogDescription>
          <DialogFooter className="mx-0 mb-0 flex-row justify-center gap-6 border-0 bg-transparent p-0 sm:justify-center">
            <Button variant="ghost" size="lg" className="rounded-full px-5" onClick={() => setOpen(false)}>
              {t('dash.maybeLater')}
            </Button>
            <Link href="/isq" className={cn(buttonVariants({ size: 'lg' }), 'rounded-full px-6')}>
              {t('dash.startNow')}
            </Link>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
