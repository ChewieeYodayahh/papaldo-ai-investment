'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowUpRight } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { logoUrl } from '@/lib/logos'

import type { RecommendedAsset } from '../api/recommendations'
import type { RiskBand } from '../types'

/** The logo, or the ticker's letters when the logo is missing. */
function Mark({ symbol }: { symbol: string }) {
  const [failed, setFailed] = useState(false)
  const src = logoUrl(symbol)
  return (
    <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-secondary text-[0.625rem] font-bold text-secondary-foreground">
      {src && !failed ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote logo with a monogram fallback
        <img src={src} alt="" referrerPolicy="no-referrer" className="size-full object-contain p-[18%]" onError={() => setFailed(true)} />
      ) : (
        symbol.replace(/[^A-Z]/g, '').slice(0, 4)
      )}
    </span>
  )
}

/**
 * "Recommended for you" under the quiz result: the band's funds first, then a
 * few of its stocks. Each opens the asset's trade page.
 */
export function RecommendedAssets({ band, assets }: { band: RiskBand; assets: RecommendedAsset[] }) {
  const t = useCopy()
  if (assets.length === 0) return null

  return (
    <Card className="rounded-2xl border-0 py-5">
      <CardHeader className="px-5 sm:px-6">
        <CardTitle className="text-base font-semibold">{t('isq.recommended')}</CardTitle>
        <CardDescription>{t('isq.recommendedNote', { band: t(`tools.band.${band}`) })}</CardDescription>
      </CardHeader>
      <CardContent className="px-5 sm:px-6">
        <ul className="grid gap-2.5 sm:grid-cols-2">
          {assets.map((asset) => (
            <li key={asset.symbol}>
              <Link
                href={`/markets/${encodeURIComponent(asset.symbol)}`}
                className="group flex items-center gap-3 rounded-xl p-2.5 ring-1 ring-foreground/10 transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <Mark symbol={asset.symbol} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <span className="font-semibold">{asset.symbol}</span>
                    <Badge variant={asset.kind === 'fund' ? 'secondary' : 'outline'} className="rounded-full">
                      {asset.kind === 'fund' ? t('isq.fund') : asset.sector}
                    </Badge>
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">{asset.name}</span>
                </span>
                <span className="flex items-center gap-1 text-xs font-medium text-primary">
                  {t('isq.trade')}
                  <ArrowUpRight className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </Link>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">{t('isq.recommendedDisclaimer')}</p>
      </CardContent>
    </Card>
  )
}
