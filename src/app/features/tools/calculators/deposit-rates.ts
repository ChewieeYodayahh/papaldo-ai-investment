/**
 * Philippine deposit rates for the Savings Planner's emergency fund (Carlos,
 * 2026-09-30: Maya, CIMB, GoTyme and MariBank only). Checked against each
 * bank's own page on the `asOf` date; banks change these often, so the planner
 * shows the date and links the source next to every rate.
 *
 * A bank without a peso time deposit is listed with its savings account and
 * `termMonths: 0` -- no lock-in, labelled as savings.
 */

export type DepositTerm = {
  termMonths: number
  /** The rate anyone gets, in % a year. */
  ratePct: number
  /** A higher rate that needs conditions met, shown as "up to". */
  boostedPct?: number
}

export type DepositProduct = {
  id: string
  bank: string
  /** The bank's own site, for its logo (Google's favicon CDN, 2026-10-01). */
  domain: string
  product: string
  kind: 'time-deposit' | 'savings'
  terms: DepositTerm[]
  /** What the conditions or quirks are, in one line. */
  note: string
  asOf: string
  source: string
}

export const DEPOSIT_PRODUCTS: DepositProduct[] = [
  {
    id: 'maya-td-plus',
    bank: 'Maya',
    domain: 'maya.ph',
    product: 'Time Deposit Plus',
    kind: 'time-deposit',
    terms: [
      { termMonths: 3, ratePct: 3.5, boostedPct: 5.5 },
      { termMonths: 6, ratePct: 3.5, boostedPct: 6.0 },
      { termMonths: 12, ratePct: 3.5, boostedPct: 5.75 },
    ],
    note: '3.5% is guaranteed; the higher rate needs your target amount and date reached (accounts opened from 1 Oct 2026). Up to ₱1M per account; 1% fee to close early.',
    asOf: '2026-09-30',
    source: 'https://www.mayabank.ph/time-deposit-plus/',
  },
  {
    id: 'cimb-maxsave',
    bank: 'CIMB',
    domain: 'cimbbank.com.ph',
    product: 'MaxSave Time Deposit',
    kind: 'time-deposit',
    terms: [
      { termMonths: 3, ratePct: 3.5 },
      { termMonths: 6, ratePct: 3.5 },
      { termMonths: 12, ratePct: 3.25 },
    ],
    note: 'Rates for new placements and renewals from 1 Jun 2026 (regular accounts; CIMB Prime gets 0.5% more).',
    asOf: '2026-09-30',
    source: 'https://www.cimbbank.com.ph/en/help-and-support/customer-advisories/2026/advisory-on-maxsave-time-deposit-interest-rates.html',
  },
  {
    id: 'maribank-td',
    bank: 'MariBank',
    // maribank.com.ph has no icon on the CDN; maribank.ph does.
    domain: 'maribank.ph',
    product: 'Upfront Time Deposit',
    kind: 'time-deposit',
    terms: [{ termMonths: 3, ratePct: 3.75 }],
    note: 'Fixed 3-month term from ₱100; the interest, after tax, is paid on the day you deposit.',
    asOf: '2026-09-30',
    // MariBank's own product page would not load when checked; this is the launch report.
    source: 'https://manilashaker.com/maribank-introduces-upfront-time-deposit/',
  },
  {
    id: 'gotyme-go-save',
    bank: 'GoTyme',
    domain: 'gotyme.com.ph',
    product: 'Go Save (savings)',
    kind: 'savings',
    terms: [{ termMonths: 0, ratePct: 3.0 }],
    note: 'No peso time deposit, so this is a savings account: no lock-in, interest credited monthly.',
    asOf: '2026-09-30',
    source: 'https://www.gotyme.com.ph/help/go-save/understanding-go-save/computing-your-go-save-interest-rate',
  },
]

/**
 * Interest on peso deposits carries a 20% final withholding tax. Since 1 July
 * 2025 (RA 12214, CMEPA) it applies to every deposit, however long -- the old
 * exemption for 5-year deposits is gone. Reported to be implemented by BIR
 * RR 21-2025; the source linked is a law firm's summary of the Act.
 */
export const DEPOSIT_TAX_RATE = 0.2
export const DEPOSIT_TAX_SOURCE =
  'https://www.aureadalaw.com/post/clarification-on-interest-income-tax-what-changed-under-ra-no-12214-cmepa'
export const DEPOSIT_TAX_NOTE =
  'Interest on deposits is taxed 20% at source (NIRC Sec. 24(B)(1)). Since 1 July 2025, under RA 12214 (the Capital Markets Efficiency Promotion Act), that includes 5-year deposits, which used to be exempt.'

/** PDIC's cover per depositor, per bank, since 15 March 2025. */
export const PDIC_LIMIT_PHP = 1_000_000

export function termLabel(termMonths: number): string {
  if (termMonths === 0) return 'No lock-in'
  if (termMonths % 12 === 0) return termMonths === 12 ? '1 year' : `${termMonths / 12} years`
  return `${termMonths} months`
}

/** A bank's logo from Google's favicon CDN: free and keyless, falls back to initials in the UI. */
export function bankLogoUrl(domain: string): string {
  return 'https://www.google.com/s2/favicons?domain=' + encodeURIComponent(domain) + '&sz=128'
}
