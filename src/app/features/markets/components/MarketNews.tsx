import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { T } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { FinnhubNewsItem } from '@/app/core/services/finnhub'
import type { MarketResult } from '../api/result'
import { marketUnavailableMessage } from '../market-status'

/**
 * Finnhub's general market headlines. In the /markets right rail it fills the
 * height the movers leave and scrolls inside (`fill`), so the rail always ends
 * with the table and heatmap beside it (2026-09-30).
 */
export function MarketNews({ items, fill = false }: { items: MarketResult<FinnhubNewsItem[]>; fill?: boolean }) {
  return (
    <Card className={cn('rounded-2xl border-0 py-4', fill && 'xl:min-h-0 xl:flex-1')}>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          <T k="mkt.news" />
        </CardTitle>
      </CardHeader>
      <CardContent className={cn(fill && 'xl:min-h-0 xl:flex-1 xl:overflow-y-auto')}>
        {!items.ok ? (
          <p className="text-sm text-muted-foreground">{marketUnavailableMessage(items.reason, 'Finnhub')}</p>
        ) : items.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">No news returned right now.</p>
        ) : (
          <ul className="space-y-4">
            {items.data.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium hover:underline"
                >
                  {item.headline}
                </a>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.source} · {new Date(item.datetime * 1000).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
