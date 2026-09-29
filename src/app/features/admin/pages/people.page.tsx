import Link from 'next/link'

import { getSessionUserId } from '@/app/core/services/supabase/session'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

import { requireAdmin } from '../api/guard'
import { listSupport, listUsers } from '../api/people'
import { RoleToggle, SupportStatusButton } from '../components/actions'
import { AdminPageHeader, StatTile, StatusBadge, timeLabel } from '../components/ui'

/** `/admin/support` -- messages from the support form, open ones first. */
export async function SupportInboxPage({ showResolved }: { showResolved: boolean }) {
  await requireAdmin()
  const messages = await listSupport(showResolved)
  const open = messages.filter((m) => m.status === 'open').length

  return (
    <>
      <AdminPageHeader
        title="Support"
        description={showResolved ? `${messages.length} messages, ${open} open` : `${open} open ${open === 1 ? 'message' : 'messages'}`}
        actions={
          <Link
            href={showResolved ? '/admin/support' : '/admin/support?resolved=1'}
            className={cn(buttonVariants({ variant: 'outline' }), 'h-9 rounded-full px-4')}
          >
            {showResolved ? 'Hide resolved' : 'Show resolved'}
          </Link>
        }
      />
      {messages.length === 0 ? (
        <Card className="rounded-2xl border-0 py-10">
          <CardContent className="text-center text-sm text-muted-foreground">Inbox zero. New messages from /support land here.</CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {messages.map((message) => (
            <Card key={message.id} className="rounded-2xl border-0 py-4">
              <CardContent className="grid gap-3 px-4 sm:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{message.ref}</span>
                    <StatusBadge status={message.status} />
                    <span className="text-xs text-muted-foreground">{timeLabel(message.created_at)}</span>
                  </div>
                  <h2 className="mt-1 font-semibold">{message.subject}</h2>
                  <p className="text-sm text-muted-foreground">
                    {message.name} ·{' '}
                    <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject} [${message.ref}]`)}`} className="text-primary underline-offset-4 hover:underline">
                      {message.email}
                    </a>
                    {message.user_id ? ' · signed in' : ' · guest'}
                  </p>
                  <p className="mt-2 text-sm whitespace-pre-wrap">{message.body}</p>
                  {message.resolved_at ? <p className="mt-2 text-xs text-muted-foreground">Resolved {timeLabel(message.resolved_at)}</p> : null}
                </div>
                <SupportStatusButton id={message.id} status={message.status} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  )
}

const dateLabel = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' }) : 'Never'

/** `/admin/users` -- every account, its sign-in history and band, with admin grants. */
export async function UsersPage() {
  await requireAdmin()
  const [users, selfId] = await Promise.all([listUsers(), getSessionUserId()])
  const admins = users.filter((u) => u.isAdmin).length
  const week = Date.now() - 7 * 86_400_000
  const active = users.filter((u) => u.lastSignInAt && Date.parse(u.lastSignInAt) > week).length

  return (
    <>
      <AdminPageHeader title="Users" description="Every account. Granting admin opens this dashboard to them." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Accounts" value={users.length} />
        <StatTile label="Active this week" value={active} />
        <StatTile label="Took the quiz" value={users.filter((u) => u.band).length} />
        <StatTile label="Admins" value={admins} />
      </div>
      <Card className="rounded-2xl border-0 py-2">
        <CardContent className="px-2">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Sign-in</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead>Last sign-in</TableHead>
                <TableHead>Band</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Role</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <p className="font-medium">{user.username ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{user.providers.join(', ') || 'email'}</TableCell>
                  <TableCell>{dateLabel(user.createdAt)}</TableCell>
                  <TableCell>{dateLabel(user.lastSignInAt)}</TableCell>
                  <TableCell className="capitalize">{user.band ?? '—'}</TableCell>
                  <TableCell className="figure text-right">{user.orders}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {user.isAdmin ? <StatusBadge status="admin" /> : null}
                      <RoleToggle userId={user.id} email={user.email} isAdmin={user.isAdmin} isSelf={user.id === selfId} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
