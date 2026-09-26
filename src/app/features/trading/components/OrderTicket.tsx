'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'
import { Compass } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useFormSubmit } from '@/app/features/auth/hooks/use-form-submit'
import type { Order } from '../types'

const money = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
})

/**
 * Buy and sell one symbol against the simulated portfolio.
 *
 * The estimate shown here is exactly that. The fill price is whatever Alpaca
 * quotes when the server handles the request, so this form deliberately does
 * not send a price and the confirmation reports the real one -- a ticket that
 * displayed its estimate as the outcome would be quietly lying whenever the
 * market moved between render and submit.
 *
 * Buying needs two things: a risk profile, and a symbol inside the curated
 * universe. Selling needs neither, so a position is always exitable --
 * including one bought before the universe existed, or in a symbol later
 * retired from it.
 *
 * The gates below are a courtesy. `place_order` refuses the buy regardless
 * (PA006, PA007), because that function is callable without this form.
 */
export function OrderTicket({
  symbol,
  assetClass,
  price,
  cashBalance,
  heldQuantity,
  fractionable,
  hasRiskProfile,
  isBuyable,
}: {
  symbol: string
  assetClass: 'equity' | 'crypto'
  price: number
  cashBalance: number
  heldQuantity: number
  fractionable: boolean
  hasRiskProfile: boolean
  /** In `tradable_assets` and active. Mirrors the PA007 check. */
  isBuyable: boolean
}) {
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/trading/orders')

  const canBuy = hasRiskProfile && isBuyable
  const canSell = heldQuantity > 0
  // Order matters: if a symbol cannot be bought at all, taking the
  // questionnaire would not change that, so saying so would mislead.
  const blockedReason = !isBuyable ? 'universe' : !hasRiskProfile ? 'profile' : null
  // Someone holding a position but lacking a profile can only exit, so the
  // form opens where they can actually act rather than on a dead tab.
  const [side, setSide] = useState<'buy' | 'sell'>(canBuy ? 'buy' : 'sell')
  const [quantity, setQuantity] = useState('1')
  const [filled, setFilled] = useState<Order | null>(null)

  const parsedQuantity = Number(quantity)
  const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0
  const estimate = validQuantity ? parsedQuantity * price : 0

  const step = fractionable ? '0.000001' : '1'
  const maxAffordable = price > 0 ? cashBalance / price : 0
  const exceedsCash = side === 'buy' && validQuantity && estimate > cashBalance
  const exceedsPosition = side === 'sell' && validQuantity && parsedQuantity > heldQuantity

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilled(null)

    const body = await submit({ symbol, assetClass, side, quantity: parsedQuantity })
    if (!body) return

    setFilled(body.order as Order)
    setQuantity('1')
    // The page is a server component: cash, holdings and history all re-read
    // on refresh, so the ticket never has to mirror server state itself.
    router.refresh()
  }

  // Nothing to buy and nothing to sell, so the card becomes whichever
  // explanation actually applies.
  if (!canBuy && !canSell) {
    return (
      <Card data-tour="order-ticket">
        <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-sm font-medium text-muted-foreground">Trade {symbol}</CardTitle>
          <Badge variant="outline" className="text-[10px]">
            Simulated
          </Badge>
        </CardHeader>
        <CardContent>
          {blockedReason === 'universe' ? (
            <p className="text-sm text-muted-foreground">
              {symbol} is outside the advised universe, so it cannot be bought here. You can still
              browse it, and anything you already hold can always be sold.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Six questions set the risk profile we use to shape your portfolio. Buying opens once
                you have one.
              </p>
              <Link href="/isq" className={cn(buttonVariants({ size: 'default' }), 'mt-4 w-full')}>
                <Compass className="size-4" />
                Discover your Risk Appetite
              </Link>
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card data-tour="order-ticket">
      <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0">
        <CardTitle className="text-sm font-medium text-muted-foreground">Trade {symbol}</CardTitle>
        <Badge variant="outline" className="text-[10px]">
          Simulated
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="mb-4 flex gap-1">
          {(['buy', 'sell'] as const).map((option) => (
            <Button
              key={option}
              type="button"
              size="sm"
              variant={option === side ? 'default' : 'ghost'}
              disabled={option === 'buy' && !canBuy}
              onClick={() => {
                setSide(option)
                setFilled(null)
              }}
              className="capitalize"
            >
              {option}
            </Button>
          ))}
        </div>

        {blockedReason === 'universe' ? (
          <p className="mb-4 text-xs text-muted-foreground">
            You can close this position. {symbol} is outside the advised universe, so it cannot be
            bought here.
          </p>
        ) : blockedReason === 'profile' ? (
          <p className="mb-4 text-xs text-muted-foreground">
            You can close this position, but buying needs a risk profile first.{' '}
            <Link href="/isq" className="underline">
              Take the questionnaire
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="space-y-3">
          <div>
            <label htmlFor="quantity" className="mb-1 block text-xs text-muted-foreground">
              Quantity {fractionable ? '(fractional allowed)' : '(whole shares)'}
            </label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              min="0"
              step={step}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              aria-invalid={Boolean(errors.quantity)}
            />
          </div>

          <dl className="space-y-1 text-xs">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estimated {side === 'buy' ? 'cost' : 'proceeds'}</dt>
              <dd className="tabular-nums">{money.format(estimate)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">
                {side === 'buy' ? 'Cash available' : 'Shares held'}
              </dt>
              <dd className="tabular-nums">
                {side === 'buy' ? money.format(cashBalance) : heldQuantity.toLocaleString('en-US')}
              </dd>
            </div>
            {side === 'buy' && price > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Most you can buy</dt>
                <dd className="tabular-nums">
                  {maxAffordable.toLocaleString('en-US', { maximumFractionDigits: fractionable ? 4 : 0 })}
                </dd>
              </div>
            ) : null}
          </dl>

          {/* Client-side guards only. The database enforces both rules again
              inside place_order, which is what actually protects the balance. */}
          {exceedsCash ? (
            <p className="text-xs text-destructive">That costs more than your available cash.</p>
          ) : null}
          {exceedsPosition ? (
            <p className="text-xs text-destructive">
              You hold {heldQuantity.toLocaleString('en-US')} {symbol}.
            </p>
          ) : null}

          {message ? (
            <Alert variant="destructive">
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          ) : null}

          <Button
            type="submit"
            disabled={pending || !validQuantity || exceedsCash || exceedsPosition}
            className="w-full capitalize"
          >
            {pending ? 'Placing…' : `${side} ${symbol}`}
          </Button>
        </form>

        {filled ? (
          <p className="mt-3 rounded-md border border-border p-3 text-xs text-muted-foreground">
            Filled: {filled.side} {filled.quantity.toLocaleString('en-US')} {filled.symbol} at{' '}
            {money.format(filled.fillPrice)} for {money.format(filled.cashAmount)}.
          </p>
        ) : null}

        <p className="mt-3 text-[11px] text-muted-foreground">
          Simulated only. No order reaches a broker and no real money moves. The fill price is the live
          Alpaca quote at the moment the server handles your request, which may differ from the estimate
          above.
        </p>
      </CardContent>
    </Card>
  )
}
