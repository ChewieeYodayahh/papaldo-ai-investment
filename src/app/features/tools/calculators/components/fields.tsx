'use client'

import { useId, useState } from 'react'
import { Share2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { useDisplayCurrency, useFx, useMoneyFormat } from '@/app/features/userData/preferences/components/Money'

import { whatItBuys } from '../purchases'
import type { TermId } from '../terms'
import { shareOrDownload, type ImageFormat, type ShareCard } from '../share-image'
import { TermHelp } from './lesson'

/**
 * A number input that can be emptied (Carlos, 2026-10-02: clearing a field
 * kept snapping back to 0). The figure lives in state as a number, but while
 * the field has focus it shows exactly what was typed -- an empty box
 * included -- and an empty or half-typed value ("1.", "-") never reaches
 * `onValue`. Leaving the field shows the stored number again. Use it for
 * every numeric input instead of a bare `<Input type="number">`.
 */
export function NumberInput({
  value,
  onValue,
  ...props
}: Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: number
  onValue: (value: number) => void
}) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <Input
      {...props}
      type="number"
      value={draft ?? (Number.isFinite(value) ? value : '')}
      onChange={(event) => {
        const text = event.target.value
        setDraft(text)
        const next = Number(text)
        if (text.trim() !== '' && Number.isFinite(next)) onValue(next)
      }}
      onBlur={(event) => {
        setDraft(null)
        props.onBlur?.(event)
      }}
    />
  )
}

/**
 * An amount typed in the viewer's display currency (dollars or pesos) but
 * held in USD, like every other figure Papaldo shows -- so switching the
 * currency toggle re-renders the same amount instead of reinterpreting it.
 */
export function AmountField({
  label,
  usd,
  onChange,
  hint,
  help,
}: {
  label: string
  usd: number
  onChange: (usd: number) => void
  hint?: string
  /** A [?] beside the label. */
  help?: TermId
}) {
  const id = useId()
  const fx = useFx()
  const { currency, convert } = useDisplayCurrency()
  const shown = Math.round(convert(usd))

  return (
    <Field>
      <FieldLabelWithHelp id={id} label={label} help={help} />
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
          {currency === 'PHP' ? '₱' : '$'}
        </span>
        <NumberInput
          id={id}
          inputMode="decimal"
          min={0}
          step={currency === 'PHP' ? 500 : 10}
          value={Number.isFinite(shown) ? shown : 0}
          onValue={(typed) => {
            const value = Math.max(0, typed)
            onChange(currency === 'PHP' && fx ? value / fx.rate : value)
          }}
          className="figure h-10 rounded-xl pl-7"
        />
      </div>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}

export function NumberField({
  label,
  value,
  onChange,
  suffix,
  min = 0,
  max,
  step = 1,
  hint,
  help,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  suffix?: string
  min?: number
  max?: number
  step?: number
  hint?: string
  /** A [?] beside the label. */
  help?: TermId
}) {
  const id = useId()
  return (
    <Field>
      <FieldLabelWithHelp id={id} label={label} help={help} />
      <div className="relative">
        <NumberInput
          id={id}
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          onValue={(next) => onChange(Math.min(max ?? Infinity, Math.max(min, next)))}
          className="figure h-10 rounded-xl pr-12"
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">{suffix}</span>
        ) : null}
      </div>
      {hint ? <FieldDescription>{hint}</FieldDescription> : null}
    </Field>
  )
}

/** One summary figure: label over value. */
export function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'accent' | 'gain' | 'loss' }) {
  return (
    <div className="rounded-xl bg-muted/50 p-2.5 sm:p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={
          tone === 'accent'
            ? 'figure text-base font-semibold text-primary sm:text-xl'
            : tone === 'gain'
              ? 'figure text-base font-semibold text-gain sm:text-xl'
              : tone === 'loss'
                ? 'figure text-base font-semibold text-loss sm:text-xl'
                : 'figure text-base font-semibold sm:text-xl'
        }
      >
        {value}
      </p>
    </div>
  )
}

/** "That’s enough for…" -- the result as things. Prices are reference figures (see purchases.ts). */
export function WhatItBuys({ amountUsd, label }: { amountUsd: number; label: string }) {
  const fx = useFx()
  const items = whatItBuys(amountUsd, fx?.rate ?? null)
  if (items.length === 0) return null
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <ul className="flex flex-wrap gap-2">
        {items.map((purchase) => (
          <li
            key={purchase.item.id}
            title={purchase.item.note}
            className="rounded-full bg-primary/10 px-3 py-1.5 text-sm font-medium text-foreground ring-1 ring-primary/30"
          >
            {purchase.text}
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground">Rough reference prices, for fun. Hover an item to see what it assumes.</p>
    </div>
  )
}

/** Share / save the result as an image. The card is built on click from the current numbers. */
export function ShareResultButton({ build, filename }: { build: () => ShareCard; filename: string }) {
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const canShareFiles = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function'

  async function run(format: ImageFormat, share: boolean) {
    setBusy(true)
    setMessage(null)
    try {
      const outcome = await shareOrDownload(build(), format, filename, share)
      setMessage(outcome === 'downloaded' ? 'Image saved to your downloads.' : outcome === 'shared' ? 'Shared.' : null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The image could not be created.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="outline" className="h-9 gap-2 rounded-full px-4" disabled={busy} />}>
          <Share2 className="size-4" />
          {busy ? 'Making image…' : 'Share result'}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-48">
          {canShareFiles ? <DropdownMenuItem onClick={() => run('png', true)}>Share…</DropdownMenuItem> : null}
          <DropdownMenuItem onClick={() => run('png', false)}>Save as PNG</DropdownMenuItem>
          <DropdownMenuItem onClick={() => run('jpeg', false)}>Save as JPG</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {message ? (
        <p className="text-xs text-muted-foreground" role="status">
          {message}
        </p>
      ) : null}
    </div>
  )
}

/** Formats a USD amount in the display currency; compact for big numbers on the image. */
export function useMoney() {
  return useMoneyFormat()
}

/** A field label, with its [?] beside it rather than inside the <label>. */
function FieldLabelWithHelp({ id, label, help }: { id: string; label: string; help?: TermId }) {
  if (!help) return <FieldLabel htmlFor={id}>{label}</FieldLabel>
  return (
    <div className="flex items-center gap-1">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <TermHelp id={help} />
    </div>
  )
}
