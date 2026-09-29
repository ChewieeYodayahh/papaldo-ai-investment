import Link from 'next/link'
import Form from 'next/form'

import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select'
import { cn } from '@/lib/utils'

/** Page title, one line of context, and optional actions on the right. */
export function AdminPageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight lg:text-[1.75rem]">{title}</h1>
        {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
    </div>
  )
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-6 mb-3 text-sm font-semibold text-muted-foreground">{children}</h2>
}

/** A labelled number. `tone` colours the value for states that need attention. */
export function StatTile({
  label,
  value,
  hint,
  tone,
  href,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  tone?: 'good' | 'bad' | 'warn'
  href?: string
}) {
  const body = (
    <Card className={cn('h-full rounded-2xl border-0 py-4', href && 'transition-colors hover:bg-accent/40')}>
      <CardContent className="grid gap-1 px-4">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p
          className={cn(
            'figure text-2xl font-semibold tracking-tight',
            tone === 'good' && 'text-gain',
            tone === 'bad' && 'text-loss',
            tone === 'warn' && 'text-highlight',
          )}
        >
          {value}
        </p>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </CardContent>
    </Card>
  )
  return href ? (
    <Link href={href} className="rounded-2xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
      {body}
    </Link>
  ) : (
    body
  )
}

const GOOD = new Set(['success', 'sent', 'resolved', 'published'])
const BAD = new Set(['error', 'failed'])

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        'rounded-full border-0 px-2 font-medium',
        GOOD.has(status) && 'bg-gain/15 text-gain',
        BAD.has(status) && 'bg-loss/15 text-loss',
        !GOOD.has(status) && !BAD.has(status) && 'bg-muted text-muted-foreground',
      )}
    >
      {status}
    </Badge>
  )
}

export type FilterField =
  | { kind: 'select'; name: string; label: string; options: Array<{ value: string; label: string }> }
  | { kind: 'text'; name: string; label: string; placeholder?: string }
  | { kind: 'date'; name: string; label: string }

/**
 * Log filters as a plain GET form (next/form navigates client-side): the
 * query string is the state, so filtered views are shareable and survive a
 * reload, and nothing here needs client JavaScript.
 */
export function FilterBar({ fields, values, action }: { fields: FilterField[]; values: Record<string, string>; action: string }) {
  return (
    <Card className="mb-4 rounded-2xl border-0 py-4">
      <CardContent className="px-4">
        <Form action={action} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {fields.map((field) => (
            <label key={field.name} className="grid gap-1 text-xs font-medium text-muted-foreground">
              {field.label}
              {field.kind === 'select' ? (
                <NativeSelect name={field.name} defaultValue={values[field.name] ?? ''} className="h-9 w-full rounded-xl text-sm text-foreground">
                  {field.options.map((option) => (
                    <NativeSelectOption key={option.value} value={option.value}>
                      {option.label}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              ) : (
                <Input
                  name={field.name}
                  type={field.kind === 'date' ? 'date' : 'search'}
                  defaultValue={values[field.name] ?? ''}
                  placeholder={field.kind === 'text' ? field.placeholder : undefined}
                  className="h-9 rounded-xl text-sm text-foreground md:text-sm"
                />
              )}
            </label>
          ))}
          <div className="flex items-end gap-2">
            <Button type="submit" className="h-9 rounded-full px-4">
              Apply
            </Button>
            <Link href={action} className={cn(buttonVariants({ variant: 'ghost' }), 'h-9 rounded-full px-3')}>
              Clear
            </Link>
          </div>
        </Form>
      </CardContent>
    </Card>
  )
}

/** Previous / next links that keep the current filters. */
export function Pager({ page, pages, total, action, values }: { page: number; pages: number; total: number; action: string; values: Record<string, string> }) {
  const link = (target: number) => {
    const params = new URLSearchParams(Object.entries(values).filter(([, v]) => v) as Array<[string, string]>)
    params.set('page', String(target))
    return `${action}?${params.toString()}`
  }
  return (
    <div className="mt-3 flex items-center justify-between gap-3 text-sm text-muted-foreground">
      <span>
        {total.toLocaleString('en-US')} {total === 1 ? 'entry' : 'entries'} · page {page} of {pages}
      </span>
      <div className="flex gap-2">
        {page > 1 ? (
          <Link href={link(page - 1)} className={cn(buttonVariants({ variant: 'outline' }), 'h-8 rounded-full px-3')}>
            Previous
          </Link>
        ) : null}
        {page < pages ? (
          <Link href={link(page + 1)} className={cn(buttonVariants({ variant: 'outline' }), 'h-8 rounded-full px-3')}>
            Next
          </Link>
        ) : null}
      </div>
    </div>
  )
}

export const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' })

/** Query-string values as plain strings, for re-filling the filter form. */
export function flatValues(raw: Record<string, string | string[] | undefined>): Record<string, string> {
  return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, (Array.isArray(value) ? value[0] : value) ?? '']))
}

export function exportHref(kind: string, values: Record<string, string>) {
  const params = new URLSearchParams(Object.entries(values).filter(([key, v]) => v && key !== 'page') as Array<[string, string]>)
  const query = params.toString()
  return `/api/admin/logs/${kind}${query ? `?${query}` : ''}`
}
