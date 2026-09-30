import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

import type { FinnhubNewsItem, FinnhubRecommendation } from '@/app/core/services/finnhub'
import type { MarketResult } from '../api/result'
import type { FundamentalPoint } from '../api/symbol'
import { AnalystRatings } from './AnalystRatings'
import { EarningsChart } from './EarningsChart'
import { SymbolNews } from './SymbolNews'

/**
 * Analyst ratings, news and quarterly earnings in one Insights card, each a
 * collapsed section (Carlos, 2026-09-30: "a drop down, instead of being seen
 * abruptly"). The panels render embedded, without their own cards.
 */
export function SymbolInsights({
  symbol,
  ratings,
  news,
  earnings,
}: {
  symbol: string
  ratings: MarketResult<FinnhubRecommendation | null>
  news: MarketResult<FinnhubNewsItem[]>
  earnings: FundamentalPoint[]
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">Insights</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion>
          <AccordionItem value="ratings">
            <AccordionTrigger>Analyst ratings</AccordionTrigger>
            <AccordionContent>
              <AnalystRatings ratings={ratings} embedded />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="news">
            <AccordionTrigger>News · {symbol}</AccordionTrigger>
            <AccordionContent>
              <SymbolNews items={news} symbol={symbol} embedded />
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="earnings">
            <AccordionTrigger>Quarterly earnings</AccordionTrigger>
            <AccordionContent>
              <EarningsChart points={earnings} embedded />
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
