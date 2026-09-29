import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { requireAdmin } from '../api/guard'
import { getAdminStats, getBenchmarksRefreshedAt } from '../api/stats'
import { AdminPageHeader, SectionTitle, StatTile } from '../components/ui'

/** Supabase's free plan database quota. */
const DATABASE_QUOTA_BYTES = 500 * 1024 * 1024

/** Published free-tier limits for each outside service, for context next to what we used. */
const PROVIDER_LIMITS: Array<{ target: string; name: string; limit: string }> = [
  { target: 'alpaca', name: 'Alpaca market data', limit: '200 calls a minute' },
  { target: 'finnhub', name: 'Finnhub', limit: 'about 60 calls a minute' },
  { target: 'exchange-rate', name: 'ExchangeRate-API', limit: '1,500 calls a month (cached 6 h)' },
  { target: 'gemini', name: 'Gemini (AI outlook)', limit: 'per-key quota, see Google AI Studio' },
  { target: 'claude', name: 'Claude API', limit: 'not called yet' },
]

function bytes(value: number): string {
  if (value >= 1024 ** 3) return `${(value / 1024 ** 3).toFixed(2)} GB`
  if (value >= 1024 ** 2) return `${(value / 1024 ** 2).toFixed(1)} MB`
  if (value >= 1024) return `${(value / 1024).toFixed(0)} kB`
  return `${value} B`
}

/** Days since a date, and whether a weekly pipeline has missed its run. */
function freshness(asOf: string | null): { label: string; stale: boolean } {
  if (!asOf) return { label: 'Never loaded', stale: true }
  const days = Math.floor((Date.now() - Date.parse(asOf)) / 86_400_000)
  return { label: days <= 0 ? 'Today' : `${days} ${days === 1 ? 'day' : 'days'} ago`, stale: days > 8 }
}

/** `/admin/resources` -- database size, table growth, provider usage and data freshness. */
export async function ResourcesPage() {
  await requireAdmin()
  const [stats, benchmarksRun] = await Promise.all([getAdminStats(), getBenchmarksRefreshedAt()])
  if (!stats) {
    return (
      <>
        <AdminPageHeader title="Resources" />
        <p className="text-sm text-muted-foreground">Resource figures could not be loaded.</p>
      </>
    )
  }

  const used = Math.min(100, (stats.database_bytes / DATABASE_QUOTA_BYTES) * 100)
  const benchmarks = freshness(benchmarksRun)
  const caps = freshness(stats.market_caps_as_of)

  return (
    <>
      <AdminPageHeader title="Resources" description="What Papaldo stores and how hard it leans on outside services" />

      <div className="grid gap-3 lg:grid-cols-[2fr_1fr_1fr]">
        <Card className="rounded-2xl border-0 py-4">
          <CardContent className="grid gap-2 px-4">
            <p className="text-xs font-medium text-muted-foreground">Database size</p>
            <p className="figure text-2xl font-semibold tracking-tight">
              {bytes(stats.database_bytes)} <span className="text-sm font-normal text-muted-foreground">of {bytes(DATABASE_QUOTA_BYTES)} free plan</span>
            </p>
            <Progress value={used} aria-label="Database size used" />
            <p className="text-xs text-muted-foreground">{used.toFixed(1)}% used</p>
          </CardContent>
        </Card>
        <StatTile
          label="Index history (weekly pipeline)"
          value={benchmarks.label}
          hint={stats.benchmarks_as_of ? `Latest month ${stats.benchmarks_as_of.slice(0, 7)}` : 'Run python/benchmarks.py'}
          tone={benchmarks.stale ? 'warn' : 'good'}
        />
        <StatTile
          label="Market caps (weekly pipeline)"
          value={caps.label}
          hint={stats.market_caps_as_of ? `Updated ${stats.market_caps_as_of.slice(0, 10)}` : 'Run python/market_caps.py'}
          tone={caps.stale ? 'warn' : 'good'}
        />
      </div>

      <SectionTitle>Outside services, last 24 hours</SectionTitle>
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead className="text-right">Calls</TableHead>
                <TableHead className="text-right">Failed</TableHead>
                <TableHead className="text-right">Average time</TableHead>
                <TableHead>Free-tier limit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROVIDER_LIMITS.map(({ target, name, limit }) => {
                const row = stats.integration_by_target_24h[target]
                return (
                  <TableRow key={target}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell className="figure text-right">{row?.calls.toLocaleString('en-US') ?? 0}</TableCell>
                    <TableCell className={row?.errors ? 'figure text-right text-loss' : 'figure text-right'}>{row?.errors ?? 0}</TableCell>
                    <TableCell className="figure text-right">{row?.avg_ms == null ? '—' : `${row.avg_ms} ms`}</TableCell>
                    <TableCell className="text-muted-foreground">{limit}</TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
          <p className="px-2 pt-2 pb-1 text-xs text-muted-foreground">
            Cached responses (under 5 ms) are not logged, so these count real network calls.
          </p>
        </CardContent>
      </Card>

      <SectionTitle>Tables</SectionTitle>
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Table</TableHead>
                <TableHead className="text-right">Rows (estimate)</TableHead>
                <TableHead className="text-right">Size on disk</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.tables.map((table) => (
                <TableRow key={table.name}>
                  <TableCell className="font-mono text-xs">{table.name}</TableCell>
                  <TableCell className="figure text-right">{Math.max(0, table.rows).toLocaleString('en-US')}</TableCell>
                  <TableCell className="figure text-right">{bytes(table.bytes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
