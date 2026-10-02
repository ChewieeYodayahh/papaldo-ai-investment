import Link from 'next/link'
import { Download } from 'lucide-react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { requireAdmin } from '../api/guard'
import { getAuditLog, getIntegrationLogs, getNotificationLog, maskEmail, readFilters, type RawFilters } from '../api/logs'
import { listUsers } from '../api/people'
import {
  AdminPageHeader,
  exportHref,
  FilterBar,
  flatValues,
  Pager,
  StatTile,
  StatusBadge,
  timeLabel,
  type FilterField,
} from '../components/ui'

function ExportButton({ kind, values }: { kind: string; values: Record<string, string> }) {
  return (
    <Link href={exportHref(kind, values)} className={cn(buttonVariants(), 'h-9 gap-2 rounded-full px-4')} prefetch={false}>
      <Download className="size-4" /> Export CSV
    </Link>
  )
}

function Empty({ text }: { text: string }) {
  return <p className="px-3 py-10 text-center text-sm text-muted-foreground">{text}</p>
}

/** `/admin/integrations` -- every call to an outside service, with its transaction id. */
export async function IntegrationLogsPage({ searchParams }: { searchParams: RawFilters }) {
  await requireAdmin()
  const filters = readFilters(searchParams)
  const values = flatValues(searchParams)
  const page = await getIntegrationLogs(filters)
  const fields: FilterField[] = [
    { kind: 'select', name: 'status', label: 'Status', options: [{ value: '', label: 'Any status' }, { value: 'success', label: 'Success' }, { value: 'error', label: 'Error' }] },
    {
      kind: 'select',
      name: 'target',
      label: 'Service',
      options: [{ value: '', label: 'Any service' }, ...['alpaca', 'finnhub', 'exchange-rate', 'supabase-auth', 'cloudinary'].map((t) => ({ value: t, label: t }))],
    },
    { kind: 'text', name: 'action', label: 'Action', placeholder: 'e.g. bars, snapshots' },
    { kind: 'text', name: 'tx', label: 'Transaction ID' },
    { kind: 'date', name: 'from', label: 'From' },
    { kind: 'date', name: 'to', label: 'To' },
    { kind: 'text', name: 'q', label: 'Search', placeholder: 'Search anything' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Integration logs"
        description="Alpaca, Finnhub, the exchange rate and AI calls, with transaction IDs. Kept for 30 days."
        actions={<ExportButton kind="integration" values={values} />}
      />
      <FilterBar fields={fields} values={values} action="/admin/integrations" />
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          {page.error ? <Empty text={`Could not load the log: ${page.error}`} /> : page.rows.length === 0 ? (
            <Empty text="No calls match these filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Source → target</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead className="text-right">ms</TableHead>
                  <TableHead className="text-right">HTTP</TableHead>
                  <TableHead>TX ID</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{timeLabel(row.occurred_at)}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell>{row.source} → {row.target}</TableCell>
                    <TableCell className="font-medium">{row.action}</TableCell>
                    <TableCell className="figure text-right">{row.duration_ms ?? '—'}</TableCell>
                    <TableCell className="figure text-right">{row.http_status ?? '—'}</TableCell>
                    <TableCell className="font-mono text-xs">{row.tx_id}</TableCell>
                    <TableCell className="max-w-72 truncate text-loss" title={row.error ?? undefined}>{row.error ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Pager page={page.page} pages={page.pages} total={page.total} action="/admin/integrations" values={values} />
    </>
  )
}

/** `/admin/notifications` -- in-app notifications and emails, with delivery status. */
export async function NotificationLogPage({ searchParams }: { searchParams: RawFilters }) {
  await requireAdmin()
  const filters = readFilters(searchParams)
  const values = flatValues(searchParams)
  const page = await getNotificationLog(filters)
  const emails = page.rows.filter((r) => r.channel === 'email')
  const failedEmails = emails.filter((r) => r.status === 'failed').length
  const fields: FilterField[] = [
    { kind: 'select', name: 'channel', label: 'Channel', options: [{ value: '', label: 'All channels' }, { value: 'in_app', label: 'In-app' }, { value: 'email', label: 'Email' }] },
    { kind: 'select', name: 'status', label: 'Status', options: [{ value: '', label: 'Any status' }, { value: 'sent', label: 'Sent' }, { value: 'skipped', label: 'Skipped' }, { value: 'failed', label: 'Failed' }] },
    { kind: 'text', name: 'event', label: 'Event', placeholder: 'e.g. order.filled' },
    { kind: 'text', name: 'q', label: 'Search' },
    { kind: 'date', name: 'from', label: 'From' },
    { kind: 'date', name: 'to', label: 'To' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Notification log"
        description="In-app notifications and emails, with their delivery status"
        actions={<ExportButton kind="notification" values={values} />}
      />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Entries shown" value={page.rows.length} hint={`of ${page.total.toLocaleString('en-US')}`} />
        <StatTile label="Emails" value={emails.length} />
        <StatTile label="Failed emails" value={failedEmails} tone={failedEmails ? 'bad' : 'good'} />
        <StatTile label="Email failure rate" value={`${emails.length ? Math.round((failedEmails / emails.length) * 100) : 0}%`} tone={failedEmails ? 'bad' : 'good'} />
      </div>
      <FilterBar fields={fields} values={values} action="/admin/notifications" />
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          {page.error ? <Empty text={`Could not load the log: ${page.error}`} /> : page.rows.length === 0 ? (
            <Empty text="No notifications match these filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Channel</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{timeLabel(row.occurred_at)}</TableCell>
                    <TableCell><span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{row.channel}</span></TableCell>
                    <TableCell className="font-medium">{row.event}</TableCell>
                    <TableCell>{row.recipient?.includes('@') ? maskEmail(row.recipient) : (row.recipient ?? row.recipient_id?.slice(0, 8) ?? '—')}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell className="max-w-72 truncate" title={row.error ?? undefined}>{row.error ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Pager page={page.page} pages={page.pages} total={page.total} action="/admin/notifications" values={values} />
    </>
  )
}

/** `/admin/audit` -- every order, profile, role, support, blog and moderation action. */
export async function AuditLogPage({ searchParams }: { searchParams: RawFilters }) {
  await requireAdmin()
  const filters = readFilters(searchParams)
  const values = flatValues(searchParams)
  const [page, users] = await Promise.all([getAuditLog(filters), listUsers()])
  const emailOf = new Map(users.map((u) => [u.id, u.email]))
  const fields: FilterField[] = [
    { kind: 'text', name: 'action', label: 'Action', placeholder: 'e.g. order., blog.deleted' },
    {
      kind: 'select',
      name: 'entity',
      label: 'Entity',
      options: [{ value: '', label: 'Any entity' }, ...['order', 'user', 'risk_profile', 'support', 'blog_post', 'chat_message'].map((e) => ({ value: e, label: e }))],
    },
    {
      kind: 'select',
      name: 'actor',
      label: 'Actor',
      options: [{ value: '', label: 'Anyone' }, ...users.map((u) => ({ value: u.id, label: u.email }))],
    },
    { kind: 'text', name: 'entityId', label: 'Entity ID' },
    { kind: 'date', name: 'from', label: 'From' },
    { kind: 'date', name: 'to', label: 'To' },
    { kind: 'text', name: 'q', label: 'Search', placeholder: 'Search anything' },
  ]

  return (
    <>
      <AdminPageHeader
        title="Audit log"
        description="Every order, profile change, role change, support, blog and moderation action. Written by the database itself."
        actions={<ExportButton kind="audit" values={values} />}
      />
      <FilterBar fields={fields} values={values} action="/admin/audit" />
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          {page.error ? <Empty text={`Could not load the log: ${page.error}`} /> : page.rows.length === 0 ? (
            <Empty text="No actions match these filters." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Note</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {page.rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="text-muted-foreground">{timeLabel(row.occurred_at)}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {row.actor_id ? (emailOf.get(row.actor_id) ?? row.actor_id.slice(0, 8)) : 'system'}
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">{row.actor_role}</span>
                      </span>
                    </TableCell>
                    <TableCell className="font-medium">{row.action}</TableCell>
                    <TableCell>
                      {row.entity} <span className="font-mono text-xs text-muted-foreground">{row.entity_id?.slice(0, 12)}</span>
                    </TableCell>
                    <TableCell className="max-w-80 truncate" title={row.note ?? undefined}>{row.note ?? '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Pager page={page.page} pages={page.pages} total={page.total} action="/admin/audit" values={values} />
    </>
  )
}
