import type { IncomeCurrency } from './schema'

/**
 * Income as the user types and reads it. Pure string <-> number helpers for
 * the income inputs (profile page and setup journey).
 *
 * Incomes are shown in the currency they were entered in, never converted:
 * they are the user's own figures, not prices, so `<Money>` (USD -> PHP at
 * render time) does not apply to them.
 */

export const CURRENCY_SYMBOL: Record<IncomeCurrency, string> = { USD: '$', PHP: '₱' }

/** "1234567.891" -> "1,234,567.89" while typing. Letters dropped, leading zeros trimmed. */
export function formatAmount(raw: string): string {
  const [whole, fraction] = raw.replace(/[^\d.]/g, '').split('.')
  const grouped = (whole ?? '').replace(/^0+(?=\d)/, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return fraction === undefined ? grouped : `${grouped}.${fraction.slice(0, 2)}`
}

/** "1,234,567.89" -> 1234567.89. Empty or unreadable -> null. */
export function parseAmount(display: string): number | null {
  const cleaned = display.replace(/,/g, '')
  if (!cleaned || cleaned === '.') return null
  const value = Number(cleaned)
  return Number.isFinite(value) ? value : null
}

/** A stored amount back into the input's display form. */
export function toDisplay(amount: number | undefined | null): string {
  return amount == null ? '' : formatAmount(String(amount))
}

/** "₱1,200,000" -- an income shown in its own currency. */
export function formatIncome(amount: number, currency: IncomeCurrency): string {
  return `${CURRENCY_SYMBOL[currency]}${amount.toLocaleString('en-US', { maximumFractionDigits: 2 })}`
}
