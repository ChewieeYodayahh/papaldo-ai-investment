'use client'

import { useId, useMemo } from 'react'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

import { CURRENCY_SYMBOL, formatAmount } from '../income'
import { OCCUPATIONS } from '../occupations'
import type { IncomeCurrency } from '../schema'

export { formatIncome, parseAmount, toDisplay } from '../income'

/**
 * Inputs shared by the profile page (auth) and the setup journey
 * (onboarding), so both edit the same fields the same way.
 */

/**
 * Searchable, scrollable list of 100 occupations. Type to filter; the list
 * scrolls inside its popup. A free-text occupation saved before the dropdown
 * existed is kept as an extra option so it still displays.
 */
export function OccupationCombobox({
  id,
  value,
  onChange,
  invalid,
  disabled,
}: {
  id?: string
  value: string | null
  onChange: (value: string | null) => void
  invalid?: boolean
  disabled?: boolean
}) {
  const items = useMemo(
    () => (value && !OCCUPATIONS.includes(value) ? [value, ...OCCUPATIONS] : [...OCCUPATIONS]),
    [value],
  )

  return (
    <Combobox items={items} value={value} onValueChange={(next) => onChange((next as string | null) ?? null)} disabled={disabled}>
      <ComboboxInput
        id={id}
        placeholder="Search 100 occupations…"
        aria-invalid={invalid || undefined}
        className="h-11 w-full rounded-xl [&_input]:text-[0.9375rem]"
      />
      <ComboboxContent>
        <ComboboxEmpty>No match. Try “Other”.</ComboboxEmpty>
        <ComboboxList className="max-h-72">
          {(item: string) => (
            <ComboboxItem key={item} value={item}>
              {item}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  )
}

/**
 * An annual amount with a $ / ₱ switch. The figure is stored in the currency
 * chosen here, exactly as typed -- it is the user's own number, not a price,
 * so nothing converts it.
 */
export function IncomeInput({
  id,
  amount,
  currency,
  onAmountChange,
  onCurrencyChange,
  invalid,
  disabled,
  placeholder = '0',
}: {
  id?: string
  amount: string
  currency: IncomeCurrency
  onAmountChange: (display: string) => void
  onCurrencyChange: (currency: IncomeCurrency) => void
  invalid?: boolean
  disabled?: boolean
  placeholder?: string
}) {
  const labelId = useId()

  return (
    <div className="flex items-stretch gap-2">
      <ToggleGroup
        aria-label="Currency"
        variant="outline"
        spacing={0}
        value={[currency]}
        onValueChange={(next: string[]) => (next[0] ? onCurrencyChange(next[0] as IncomeCurrency) : null)}
        disabled={disabled}
        className="h-11 shrink-0"
      >
        {(['PHP', 'USD'] as const).map((code) => (
          <ToggleGroupItem
            key={code}
            value={code}
            aria-label={code === 'PHP' ? 'Philippine peso' : 'US dollar'}
            className="h-11 min-w-11 px-3 text-[0.9375rem] data-pressed:bg-primary data-pressed:text-primary-foreground"
          >
            {CURRENCY_SYMBOL[code]}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <InputGroup className={cn('h-11 flex-1 rounded-xl', invalid && 'border-destructive')}>
        <InputGroupAddon>
          <span id={labelId} className="text-[0.9375rem] text-muted-foreground">
            {CURRENCY_SYMBOL[currency]}
          </span>
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          inputMode="decimal"
          autoComplete="off"
          placeholder={placeholder}
          value={amount}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          onChange={(event) => onAmountChange(formatAmount(event.target.value))}
          className="figure text-[0.9375rem]"
        />
        <InputGroupAddon align="inline-end">
          <span className="text-xs text-muted-foreground">/ year</span>
        </InputGroupAddon>
      </InputGroup>
    </div>
  )
}

