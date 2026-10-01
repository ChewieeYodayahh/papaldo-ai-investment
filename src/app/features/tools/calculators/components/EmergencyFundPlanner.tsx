'use client'

import { useMemo, useState } from 'react'
import { ExternalLink } from 'lucide-react'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Checkbox } from '@/components/ui/checkbox'
import { Field, FieldLabel } from '@/components/ui/field'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useTutorialDemo } from '@/app/features/tutorials/tutorial-store'
import { useFx } from '@/app/features/userData/preferences/components/Money'

import {
  bankLogoUrl,
  DEPOSIT_PRODUCTS,
  DEPOSIT_TAX_NOTE,
  DEPOSIT_TAX_RATE,
  DEPOSIT_TAX_SOURCE,
  PDIC_LIMIT_PHP,
  termLabel,
  type DepositProduct,
} from '../deposit-rates'
import { depositGrowth } from '../math'
import { AmountField } from './fields'
import { TermHelp } from './lesson'

const dateLabel = (iso: string) => new Date(`${iso}T00:00:00`).toLocaleDateString('en-PH', { dateStyle: 'medium' })

/**
 * The emergency fund in a time deposit (Carlos, 2026-09-30; folded into the
 * savings planner's chart 2026-10-01): one of the four banks' products, before
 * or after the 20% final tax, over the same years as the goal. Rates come
 * from `deposit-rates.ts`, each with its date and source. Nothing is saved.
 */
export function useEmergencyFund(years: number) {
  // About ₱100k by default -- three months of a modest household budget.
  const [amountUsd, setAmountUsd] = useState(1_700)
  const [productId, setProductId] = useState(DEPOSIT_PRODUCTS[0].id)
  const product = DEPOSIT_PRODUCTS.find((p) => p.id === productId) ?? DEPOSIT_PRODUCTS[0]
  const [termMonths, setTermMonths] = useState(product.terms[0].termMonths)
  const term = product.terms.find((t) => t.termMonths === termMonths) ?? product.terms[0]
  const [boosted, setBoosted] = useState(false)
  const [taxed, setTaxed] = useState(true)
  const ratePct = boosted && term.boostedPct ? term.boostedPct : term.ratePct

  const rows = useMemo(
    () => depositGrowth(amountUsd, ratePct, term.termMonths, Math.max(1, Math.ceil(years)), taxed ? DEPOSIT_TAX_RATE : 0),
    [amountUsd, ratePct, term.termMonths, years, taxed],
  )
  const last = rows[rows.length - 1]
  const interest = (taxed ? last.net : last.gross) - amountUsd

  function pickProduct(id: string) {
    const next = DEPOSIT_PRODUCTS.find((p) => p.id === id)
    if (!next) return
    setProductId(id)
    setTermMonths(next.terms[0].termMonths)
    setBoosted(false)
  }

  useTutorialDemo('savings.bank', () => {
    pickProduct('cimb-maxsave')
    setTermMonths(12)
  })

  return {
    amountUsd,
    setAmountUsd,
    product,
    pickProduct,
    term,
    setTermMonths,
    boosted,
    setBoosted,
    taxed,
    setTaxed,
    ratePct,
    rows,
    interest,
    /** The balance each year, after tax when the tax is on. */
    balanceAt: (year: number) => {
      const row = rows.find((r) => r.year >= year) ?? last
      return taxed ? row.net : row.gross
    },
  }
}

export type EmergencyFund = ReturnType<typeof useEmergencyFund>

/** A bank's logo, with its initials if the image does not load. */
export function BankLogo({ product, className }: { product: DepositProduct; className?: string }) {
  return (
    <Avatar className={className ?? 'size-6'}>
      <AvatarImage src={bankLogoUrl(product.domain)} alt="" />
      <AvatarFallback className="text-[0.6rem]">{product.bank.slice(0, 2)}</AvatarFallback>
    </Avatar>
  )
}

/** The fund's inputs: amount, bank (with logos), term, the boosted rate and the tax. */
export function EmergencyFundFields({ fund }: { fund: EmergencyFund }) {
  const fx = useFx()
  const { product, term } = fund
  const overPdic = fx ? fund.amountUsd * fx.rate > PDIC_LIMIT_PHP : false

  return (
    <div className="grid gap-4">
      <AmountField label="Emergency fund" usd={fund.amountUsd} onChange={fund.setAmountUsd} help="emergencyFund" hint="Three to six months of expenses." />
      <Field data-tut="savings.bank">
        <div className="flex items-center gap-1">
          <FieldLabel>Bank</FieldLabel>
          <TermHelp id="timeDeposit" />
        </div>
        <ToggleGroup
          variant="outline"
          spacing={0}
          className="grid w-full grid-cols-2"
          value={[product.id]}
          onValueChange={(value) => value[0] && fund.pickProduct(value[0])}
        >
          {DEPOSIT_PRODUCTS.map((p) => (
            <ToggleGroupItem key={p.id} value={p.id} className="h-11 justify-start gap-2 px-2.5 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
              <BankLogo product={p} />
              <span className="grid text-left leading-tight">
                <span className="font-medium">{p.bank}</span>
                <span className="figure text-muted-foreground">{Math.max(...p.terms.map((t) => t.ratePct))}% a year</span>
              </span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </Field>
      {product.terms.length > 1 ? (
        <Field>
          <FieldLabel>Term</FieldLabel>
          <ToggleGroup
            variant="outline"
            spacing={0}
            className="w-full"
            value={[String(term.termMonths)]}
            onValueChange={(value) => value[0] && fund.setTermMonths(Number(value[0]))}
          >
            {product.terms.map((t) => (
              <ToggleGroupItem key={t.termMonths} value={String(t.termMonths)} className="h-9 flex-1 text-xs aria-pressed:bg-primary/10 aria-pressed:text-foreground">
                {termLabel(t.termMonths)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>
      ) : null}

      <div className="rounded-xl bg-muted/50 p-3 text-xs text-muted-foreground">
        <p className="text-sm text-foreground">
          {product.bank} {product.product}: <span className="figure font-semibold">{fund.ratePct}%</span> a year
          {product.kind === 'savings' ? ' (savings account)' : ` for ${termLabel(term.termMonths).toLowerCase()}`}
        </p>
        <p className="mt-1">{product.note}</p>
        <a href={product.source} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline">
          Rate as of {dateLabel(product.asOf)}
          <ExternalLink className="size-3" />
        </a>
      </div>

      {term.boostedPct ? (
        <label className="flex items-start gap-2.5 text-sm">
          <Checkbox checked={fund.boosted} onCheckedChange={(checked) => fund.setBoosted(checked === true)} className="mt-0.5" />
          <span>
            Use the higher {term.boostedPct}% rate <span className="text-muted-foreground">(only if its conditions are met)</span>
          </span>
        </label>
      ) : null}
      <label className="flex items-start gap-2.5 text-sm" data-tut="savings.tax">
        <Checkbox checked={fund.taxed} onCheckedChange={(checked) => fund.setTaxed(checked === true)} className="mt-0.5" />
        <span>
          <span className="inline-flex items-center gap-1">
            Apply the 20% withholding tax
            <TermHelp id="withholdingTax" />
          </span>
          <span className="block text-xs text-muted-foreground">
            {DEPOSIT_TAX_NOTE}{' '}
            <a href={DEPOSIT_TAX_SOURCE} target="_blank" rel="noopener noreferrer" className="text-primary underline-offset-2 hover:underline">
              Source
            </a>
          </span>
        </span>
      </label>
      {overPdic ? (
        <p className="rounded-xl bg-loss/10 p-3 text-xs text-foreground ring-1 ring-loss/30">
          PDIC insures up to ₱1,000,000 per depositor, per bank. Above that, consider splitting the fund between banks.
        </p>
      ) : null}
    </div>
  )
}
