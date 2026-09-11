export type AdvisoryProps = {
    riskBand: 'Low' | 'Medium' | 'High'
    pending?: boolean
    error?: string | null
    data?: {
      outlookText: string
      cached: boolean
      timestamp: string
    }
  }

  export function MarketOutlookCard({ riskBand, pending, error, data }: AdvisoryProps) {
    return (
      <div className="rounded-lg border border-border bg-card p-4">
        <h3 className="text-sm font-medium text-muted-foreground">
          Market Outlook - {riskBand} Risk
        </h3>
        {pending && (
          <div className="mt-2 text-sm text-muted-foreground animate-pulse">
            Loading analysis...
          </div>
        )}
        {error && (
          <div className="mt-2 text-sm text-destructive">
            {error}
          </div>
        )}
        {data && (
          <div className="mt-2 text-sm leading-relaxed whitespace-pre-wrap">
            {data.outlookText}
          </div>
        )}
        {!pending && !error && !data && (
          <div className="mt-2 text-sm text-muted-foreground">
            No outlook available for this risk band.
          </div>
        )}
      </div>
    )
  }