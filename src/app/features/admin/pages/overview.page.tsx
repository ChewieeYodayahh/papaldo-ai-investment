import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import { requireAdmin } from '../api/guard'
import { getAdminStats } from '../api/stats'
import { ActivityChart, OrdersChart } from '../components/charts'
import { AdminPageHeader, SectionTitle, StatTile } from '../components/ui'

const BAND_ORDER = ['conservative', 'moderate', 'aggressive']

/** `/admin` -- pending work first, then the platform's size and activity. */
export async function AdminOverviewPage() {
  await requireAdmin()
  const stats = await getAdminStats()
  if (!stats) {
    return (
      <>
        <AdminPageHeader title="Overview" />
        <p className="text-sm text-muted-foreground">The dashboard data could not be loaded. Check the Supabase logs.</p>
      </>
    )
  }

  const errorRate = stats.integration_24h ? (stats.integration_errors_24h / stats.integration_24h) * 100 : 0
  const targets = Object.entries(stats.integration_by_target_24h).sort((a, b) => b[1].calls - a[1].calls)

  return (
    <>
      <AdminPageHeader title="Overview" description="Pending work and platform health" />

      <SectionTitle>Needs attention</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Support messages" value={stats.support_open} hint="open" tone={stats.support_open ? 'warn' : 'good'} href="/admin/support" />
        <StatTile
          label="Failed API calls (24 h)"
          value={stats.integration_errors_24h}
          hint={`${errorRate.toFixed(1)}% of ${stats.integration_24h.toLocaleString('en-US')} calls`}
          tone={stats.integration_errors_24h ? 'bad' : 'good'}
          href="/admin/integrations?status=error"
        />
        <StatTile
          label="Failed notifications (24 h)"
          value={stats.notifications_failed_24h}
          hint={`of ${stats.notifications_24h} sent`}
          tone={stats.notifications_failed_24h ? 'bad' : 'good'}
          href="/admin/notifications?status=failed"
        />
        <StatTile label="Blog drafts" value={stats.blog_drafts} hint={`${stats.blog_published} published`} href="/admin/blog" />
      </div>

      <SectionTitle>Platform</SectionTitle>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Users" value={stats.users} hint={`${stats.users_7d} new this week`} href="/admin/users" />
        <StatTile label="Signed in (24 h)" value={stats.signed_in_24h} hint={`${stats.with_risk_profile} took the quiz`} />
        <StatTile
          label="Risk bands"
          value={BAND_ORDER.map((band) => stats.bands[band] ?? 0).join(' · ')}
          hint="conservative · moderate · aggressive"
        />
        <StatTile label="Orders" value={stats.orders.toLocaleString('en-US')} hint={`${stats.orders_24h} today · ${stats.chat_24h} chat messages today`} />
      </div>

      <SectionTitle>Activity</SectionTitle>
      <div className="grid gap-3 xl:grid-cols-2">
        <ActivityChart data={stats.integration_by_hour} />
        <OrdersChart data={stats.orders_by_day} />
      </div>

      <SectionTitle>External services, last 24 hours</SectionTitle>
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          {targets.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Calls</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead className="text-right">Average time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {targets.map(([target, row]) => (
                  <TableRow key={target}>
                    <TableCell className="font-medium">{target}</TableCell>
                    <TableCell className="figure text-right">{row.calls.toLocaleString('en-US')}</TableCell>
                    <TableCell className={row.errors ? 'figure text-right text-loss' : 'figure text-right'}>{row.errors}</TableCell>
                    <TableCell className="figure text-right">{row.avg_ms === null ? '—' : `${row.avg_ms} ms`}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="px-3 py-6 text-sm text-muted-foreground">
              No external calls logged yet. They appear here as pages load market data.
            </p>
          )}
        </CardContent>
      </Card>
    </>
  )
}
