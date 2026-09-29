import 'server-only'

import { createClient } from '@/app/core/services/supabase/server'
import type { Tables } from '@/app/core/services/supabase/database.types'

export const PAGE_SIZE = 50
/** CSV exports stop here; the logs trim themselves to 30 days anyway. */
export const EXPORT_LIMIT = 5000

export type LogKind = 'integration' | 'notification' | 'audit'

/** Whatever arrived in the query string, untrusted. */
export type RawFilters = Record<string, string | string[] | undefined>

export type IntegrationRow = Tables<'integration_logs'>
export type NotificationRow = Tables<'notification_log'>
export type AuditRow = Tables<'audit_log'>

export type Page<Row> = { rows: Row[]; total: number; page: number; pages: number; error: string | null }

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)?.trim() ?? ''

/**
 * Free text for ilike / or() filters. PostgREST's or() syntax treats commas
 * and parentheses as structure, so they (and wildcards) are stripped rather
 * than escaped -- a search box never needs them.
 */
export function cleanText(value: string): string {
  return value.replace(/[%*,()\\"]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80)
}

const isDate = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const nextDay = (date: string) => new Date(Date.parse(`${date}T00:00:00Z`) + 86_400_000).toISOString().slice(0, 10)

export function readFilters(raw: RawFilters) {
  const page = Math.max(1, Math.min(10_000, Number(one(raw.page)) || 1))
  return {
    page,
    status: one(raw.status),
    target: one(raw.target),
    channel: one(raw.channel),
    entity: one(raw.entity),
    action: cleanText(one(raw.action)),
    event: cleanText(one(raw.event)),
    txId: cleanText(one(raw.tx)),
    actor: /^[0-9a-f-]{36}$/i.test(one(raw.actor)) ? one(raw.actor) : '',
    entityId: cleanText(one(raw.entityId)),
    from: isDate(one(raw.from)) ? one(raw.from) : '',
    to: isDate(one(raw.to)) ? one(raw.to) : '',
    q: cleanText(one(raw.q)),
  }
}

export type Filters = ReturnType<typeof readFilters>

function range(filters: Filters, exporting: boolean): [number, number] {
  if (exporting) return [0, EXPORT_LIMIT - 1]
  const start = (filters.page - 1) * PAGE_SIZE
  return [start, start + PAGE_SIZE - 1]
}

function toPage<Row>(data: Row[] | null, count: number | null, filters: Filters, error: { message: string } | null): Page<Row> {
  const total = count ?? 0
  return { rows: data ?? [], total, page: filters.page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)), error: error?.message ?? null }
}

/** Integration log, newest first. RLS returns rows only to admins. */
export async function getIntegrationLogs(filters: Filters, exporting = false): Promise<Page<IntegrationRow>> {
  const supabase = await createClient()
  let query = supabase.from('integration_logs').select('*', { count: 'exact' })
  if (filters.status === 'success' || filters.status === 'error') query = query.eq('status', filters.status)
  if (filters.target) query = query.eq('target', filters.target)
  if (filters.action) query = query.ilike('action', `%${filters.action}%`)
  if (filters.txId) query = query.ilike('tx_id', `%${filters.txId}%`)
  if (filters.from) query = query.gte('occurred_at', filters.from)
  if (filters.to) query = query.lt('occurred_at', nextDay(filters.to))
  if (filters.q) query = query.or(`action.ilike.%${filters.q}%,error.ilike.%${filters.q}%,tx_id.ilike.%${filters.q}%,target.ilike.%${filters.q}%`)
  const { data, count, error } = await query.order('occurred_at', { ascending: false }).range(...range(filters, exporting))
  return toPage(data, count, filters, error)
}

export async function getNotificationLog(filters: Filters, exporting = false): Promise<Page<NotificationRow>> {
  const supabase = await createClient()
  let query = supabase.from('notification_log').select('*', { count: 'exact' })
  if (filters.channel === 'email' || filters.channel === 'in_app') query = query.eq('channel', filters.channel)
  if (['sent', 'skipped', 'failed'].includes(filters.status)) query = query.eq('status', filters.status)
  if (filters.event) query = query.ilike('event', `%${filters.event}%`)
  if (filters.from) query = query.gte('occurred_at', filters.from)
  if (filters.to) query = query.lt('occurred_at', nextDay(filters.to))
  if (filters.q) query = query.or(`event.ilike.%${filters.q}%,recipient.ilike.%${filters.q}%,error.ilike.%${filters.q}%`)
  const { data, count, error } = await query.order('occurred_at', { ascending: false }).range(...range(filters, exporting))
  return toPage(data, count, filters, error)
}

export async function getAuditLog(filters: Filters, exporting = false): Promise<Page<AuditRow>> {
  const supabase = await createClient()
  let query = supabase.from('audit_log').select('*', { count: 'exact' })
  if (filters.action) query = query.ilike('action', `%${filters.action}%`)
  if (filters.entity) query = query.eq('entity', filters.entity)
  if (filters.actor) query = query.eq('actor_id', filters.actor)
  if (filters.entityId) query = query.ilike('entity_id', `%${filters.entityId}%`)
  if (filters.from) query = query.gte('occurred_at', filters.from)
  if (filters.to) query = query.lt('occurred_at', nextDay(filters.to))
  if (filters.q) query = query.or(`action.ilike.%${filters.q}%,note.ilike.%${filters.q}%,entity_id.ilike.%${filters.q}%`)
  const { data, count, error } = await query.order('occurred_at', { ascending: false }).range(...range(filters, exporting))
  return toPage(data, count, filters, error)
}

/** "ha…@gmail.com": enough to recognise an address in a log without printing it whole. */
export function maskEmail(email: string | null): string {
  if (!email) return '—'
  const [local, domain] = email.split('@')
  if (!domain) return email
  return `${local.slice(0, 2)}…@${domain}`
}
