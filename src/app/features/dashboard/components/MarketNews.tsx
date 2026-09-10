import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { FinnhubNewsItem } from '@/app/core/services/finnhub'

export function MarketNews({ items }: { items: FinnhubNewsItem[] | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Market Insight</CardTitle>
      </CardHeader>
      <CardContent>
        {!items ? (
          <p className="text-sm text-muted-foreground">Live news is unavailable right now — Finnhub did not respond.</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No news returned right now.</p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <li key={item.id}>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
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
