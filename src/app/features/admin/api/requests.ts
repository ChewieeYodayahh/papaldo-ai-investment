import 'server-only'

import { z } from 'zod'

import { getSessionUserId } from '@/app/core/services/supabase/session'
import { isAdmin } from '@/app/features/auth/api/roles'
import { createPost, deletePost, updatePost } from '@/app/features/community/blog/api/manage'
import { tableFrom, toCsv, type Column } from '@/app/features/userData/export/formats'

import {
  getAuditLog,
  getIntegrationLogs,
  getNotificationLog,
  readFilters,
  type AuditRow,
  type IntegrationRow,
  type NotificationRow,
  type RawFilters,
} from './logs'
import { setAdmin, setSupportStatus } from './people'

/**
 * The admin API's request handling, one function per route. Each checks the
 * caller is an admin first (for a clean 404 instead of an RLS error), and
 * the database checks again with private.is_admin() on every read and write.
 */

export type AdminResponse = { status: number; body: Record<string, unknown> }

const NOT_FOUND: AdminResponse = { status: 404, body: { ok: false, message: 'Not found.' } }
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)

export async function updateSupport(id: string, payload: unknown): Promise<AdminResponse> {
  const adminId = await getSessionUserId()
  if (!adminId || !(await isAdmin()) || !isUuid(id)) return NOT_FOUND
  const parsed = z.object({ status: z.enum(['open', 'resolved']) }).safeParse(payload)
  if (!parsed.success) return { status: 400, body: { ok: false, message: 'Status must be open or resolved.' } }
  const result = await setSupportStatus(id, parsed.data.status, adminId)
  return { status: result.ok ? 200 : 400, body: result }
}

export async function changeRole(userId: string, payload: unknown): Promise<AdminResponse> {
  if (!(await isAdmin()) || !isUuid(userId)) return NOT_FOUND
  const parsed = z.object({ admin: z.boolean() }).safeParse(payload)
  if (!parsed.success) return { status: 400, body: { ok: false, message: 'Say whether the user should be an admin.' } }
  const result = await setAdmin(userId, parsed.data.admin)
  return { status: result.ok ? 200 : 400, body: result }
}

export async function createArticle(payload: unknown): Promise<AdminResponse> {
  if (!(await isAdmin())) return NOT_FOUND
  const result = await createPost(payload)
  return { status: result.ok ? 201 : 400, body: result }
}

export async function updateArticle(id: string, payload: unknown): Promise<AdminResponse> {
  if (!(await isAdmin()) || !isUuid(id)) return NOT_FOUND
  const result = await updatePost(id, payload)
  return { status: result.ok ? 200 : 400, body: result }
}

export async function deleteArticle(id: string): Promise<AdminResponse> {
  if (!(await isAdmin()) || !isUuid(id)) return NOT_FOUND
  const result = await deletePost(id)
  return { status: result.ok ? 200 : 400, body: result }
}

const INTEGRATION_COLUMNS: Column<IntegrationRow>[] = [
  { id: 'occurred_at', label: 'Time (UTC)', value: (r) => r.occurred_at },
  { id: 'status', label: 'Status', value: (r) => r.status },
  { id: 'source', label: 'Source', value: (r) => r.source },
  { id: 'target', label: 'Target', value: (r) => r.target },
  { id: 'action', label: 'Action', value: (r) => r.action },
  { id: 'duration_ms', label: 'Duration (ms)', value: (r) => r.duration_ms },
  { id: 'http_status', label: 'HTTP status', value: (r) => r.http_status },
  { id: 'tx_id', label: 'Transaction ID', value: (r) => r.tx_id },
  { id: 'error', label: 'Error', value: (r) => r.error },
]

const NOTIFICATION_COLUMNS: Column<NotificationRow>[] = [
  { id: 'occurred_at', label: 'Time (UTC)', value: (r) => r.occurred_at },
  { id: 'channel', label: 'Channel', value: (r) => r.channel },
  { id: 'event', label: 'Event', value: (r) => r.event },
  { id: 'recipient', label: 'Recipient', value: (r) => r.recipient ?? r.recipient_id },
  { id: 'status', label: 'Status', value: (r) => r.status },
  { id: 'error', label: 'Error', value: (r) => r.error },
]

const AUDIT_COLUMNS: Column<AuditRow>[] = [
  { id: 'occurred_at', label: 'Time (UTC)', value: (r) => r.occurred_at },
  { id: 'actor_id', label: 'Actor ID', value: (r) => r.actor_id },
  { id: 'actor_role', label: 'Actor role', value: (r) => r.actor_role },
  { id: 'action', label: 'Action', value: (r) => r.action },
  { id: 'entity', label: 'Entity', value: (r) => r.entity },
  { id: 'entity_id', label: 'Entity ID', value: (r) => r.entity_id },
  { id: 'note', label: 'Note', value: (r) => r.note },
  { id: 'details', label: 'Details (JSON)', value: (r) => JSON.stringify(r.details) },
]

export type LogCsv = { ok: true; csv: string; filename: string } | { ok: false; status: number; message: string }

/** A filtered log as CSV (up to EXPORT_LIMIT rows), built on the server from the admin's own session. */
export async function exportLog(kind: string, raw: RawFilters): Promise<LogCsv> {
  if (!(await isAdmin())) return { ok: false, status: 404, message: 'Not found.' }
  const filters = readFilters(raw)
  const stamp = new Date().toISOString().slice(0, 10)

  if (kind === 'integration') {
    const page = await getIntegrationLogs(filters, true)
    if (page.error) return { ok: false, status: 500, message: page.error }
    return { ok: true, csv: toCsv(tableFrom('Integration log', INTEGRATION_COLUMNS, page.rows)), filename: `papaldo-integration-log-${stamp}.csv` }
  }
  if (kind === 'notification') {
    const page = await getNotificationLog(filters, true)
    if (page.error) return { ok: false, status: 500, message: page.error }
    return { ok: true, csv: toCsv(tableFrom('Notification log', NOTIFICATION_COLUMNS, page.rows)), filename: `papaldo-notification-log-${stamp}.csv` }
  }
  if (kind === 'audit') {
    const page = await getAuditLog(filters, true)
    if (page.error) return { ok: false, status: 500, message: page.error }
    return { ok: true, csv: toCsv(tableFrom('Audit log', AUDIT_COLUMNS, page.rows)), filename: `papaldo-audit-log-${stamp}.csv` }
  }
  return { ok: false, status: 404, message: 'Unknown log.' }
}
