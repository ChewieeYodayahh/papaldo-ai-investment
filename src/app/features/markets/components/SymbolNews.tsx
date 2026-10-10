import { PanelFrame } from './PanelFrame'

import type { FinnhubNewsItem } from '@/app/core/services/finnhub'
import type { MarketResult } from '../api/result'
import { marketUnavailableMessage } from '../market-status'
import { T } from '@/app/features/userData/preferences/copy'

/** Company headlines from Finnhub, last 30 days. Real, unranked, unfiltered. */
export function SymbolNews({
  items,
  symbol,
  embedded = false,
}: {
  items: MarketResult<FinnhubNewsItem[]>
  symbol: string
  embedded?: boolean
}) {
  return (
    <PanelFrame title={<T k="sym.news" vars={{ symbol }} />} embedded={embedded}>
        {!items.ok ? (
          <p className="text-sm text-muted-foreground">{marketUnavailableMessage(items.reason, 'Finnhub')}</p>
        ) : items.data.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No headlines for {symbol} in the last 30 days.
          </p>
        ) : (
          <ul className="space-y-4">
            {items.data.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-sm font-medium hover:underline"
                >
                  {item.headline}
                </a>
                {item.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.summary}</p>
                ) : null}
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {item.source} · {new Date(item.datetime * 1000).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        )}
    </PanelFrame>
  )
}
