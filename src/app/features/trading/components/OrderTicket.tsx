'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type FormEvent } from 'react'
import { Compass } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { useFormSubmit } from '@/app/features/auth/hooks/use-form-submit'
import { Money } from '@/app/features/userData/preferences/components/Money'
import { useCopy } from '@/app/features/userData/preferences/copy'
import type { Order } from '../types'

type Side = 'buy' | 'sell'

/** Buy is green and Sell is red (Carlos, 2026-09-30), from the gain / loss tokens. */
const SIDE_FILL: Record<Side, string> = {
  buy: 'bg-gain text-gain-foreground hover:bg-gain/85',
  sell: 'bg-loss text-loss-foreground hover:bg-loss/85',
}

/**
 * Buy and sell one symbol against the simulated portfolio.
 *
 * The estimate shown here is exactly that. The fill price is whatever Alpaca
 * quotes when the server handles the request, so this form deliberately does
 * not send a price and the confirmation reports the real one -- a ticket that
 * displayed its estimate as the outcome would be quietly lying whenever the
 * market moved between render and submit.
 *
 * Every order goes through a confirmation step first (after Investopedia's
 * simulator, 2026-09-30): the summary dialog, then Execute or Cancel. Cancel
 * sends nothing.
 *
 * Buying needs two things: a risk profile, and a symbol inside the curated
 * universe. Selling needs neither, so a position is always exitable --
 * including one bought before the universe existed, or in a symbol later
 * retired from it.
 *
 * The gates below are a courtesy. `place_order` refuses the buy regardless
 * (PA006, PA007), because that function is callable without this form.
 *
 * The header's Buy / Sell buttons link to `#trade-buy` / `#trade-sell`; the
 * ticket picks that side when it is allowed.
 */
export function OrderTicket({
  symbol,
  name,
  assetClass,
  price,
  cashBalance,
  heldQuantity,
  fractionable,
  hasRiskProfile,
  isBuyable,
}: {
  symbol: string
  /** Company or fund name for the confirmation, when known. */
  name?: string | null
  assetClass: 'equity' | 'crypto'
  price: number
  cashBalance: number
  heldQuantity: number
  fractionable: boolean
  hasRiskProfile: boolean
  /** In `tradable_assets` and active. Mirrors the PA007 check. */
  isBuyable: boolean
}) {
  const t = useCopy()
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/trading/orders')

  const canBuy = hasRiskProfile && isBuyable
  const canSell = heldQuantity > 0
  // Order matters: if a symbol cannot be bought at all, taking the
  // questionnaire would not change that, so saying so would mislead.
  const blockedReason = !isBuyable ? 'universe' : !hasRiskProfile ? 'profile' : null
  // Someone holding a position but lacking a profile can only exit, so the
  // form opens where they can actually act rather than on a dead tab.
  const [side, setSide] = useState<Side>(canBuy ? 'buy' : 'sell')
  const [quantity, setQuantity] = useState('1')
  const [filled, setFilled] = useState<Order | null>(null)
  const [confirming, setConfirming] = useState(false)

  // The header's Buy / Sell buttons choose the side through the URL hash.
  useEffect(() => {
    const pick = () => {
      if (window.location.hash === '#trade-buy' && canBuy) setSide('buy')
      if (window.location.hash === '#trade-sell' && canSell) setSide('sell')
    }
    pick()
    window.addEventListener('hashchange', pick)
    return () => window.removeEventListener('hashchange', pick)
  }, [canBuy, canSell])

  const parsedQuantity = Number(quantity)
  const validQuantity = Number.isFinite(parsedQuantity) && parsedQuantity > 0
  const estimate = validQuantity ? parsedQuantity * price : 0

  const step = fractionable ? '0.000001' : '1'
  const maxAffordable = price > 0 ? cashBalance / price : 0
  const exceedsCash = side === 'buy' && validQuantity && estimate > cashBalance
  const exceedsPosition = side === 'sell' && validQuantity && parsedQuantity > heldQuantity
  const cashAfter = side === 'buy' ? cashBalance - estimate : cashBalance + estimate
  const sharesAfter = side === 'buy' ? heldQuantity + (validQuantity ? parsedQuantity : 0) : heldQuantity - (validQuantity ? parsedQuantity : 0)

  function onReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFilled(null)
    setConfirming(true)
  }

  async function onExecute() {
    const body = await submit({ symbol, assetClass, side, quantity: parsedQuantity })
    setConfirming(false)
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
          <CardTitle className="text-sm font-medium text-muted-foreground">{t('trade.title', { symbol })}</CardTitle>
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
                {t('trade.discover')}
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
        <CardTitle className="text-sm font-medium text-muted-foreground">{t('trade.title', { symbol })}</CardTitle>
        <Badge variant="outline" className="text-[10px]">
          Simulated
        </Badge>
      </CardHeader>

      <CardContent>
        <div className="mb-4 grid grid-cols-2 gap-1 rounded-full bg-muted p-1" role="radiogroup" aria-label="Order side" data-tut="trade.side">
          {(['buy', 'sell'] as const).map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={option === side}
              disabled={option === 'buy' ? !canBuy : !canSell}
              onClick={() => {
                setSide(option)
                setFilled(null)
              }}
              className={cn(
                'h-9 rounded-full text-sm font-semibold capitalize transition-colors disabled:cursor-not-allowed disabled:opacity-40',
                option === side ? SIDE_FILL[option] : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {option}
            </button>
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
              {t('trade.takeQuiz')}
            </Link>
            .
          </p>
        ) : null}

        <form onSubmit={onReview} className="space-y-3">
          <div data-tut="trade.quantity">
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
              <dd className="tabular-nums">
                <Money usd={estimate} />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{side === 'buy' ? 'Cash available' : 'Shares held'}</dt>
              <dd className="tabular-nums">
                {side === 'buy' ? <Money usd={cashBalance} /> : heldQuantity.toLocaleString('en-US')}
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
          {exceedsCash ? <p className="text-xs text-destructive">That costs more than your available cash.</p> : null}
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
            data-tut="trade.review"
            disabled={pending || !validQuantity || exceedsCash || exceedsPosition}
            className={cn('h-10 w-full rounded-full font-semibold capitalize', SIDE_FILL[side])}
          >
            {t(side === 'buy' ? 'trade.reviewBuy' : 'trade.reviewSell', { symbol })}
          </Button>
        </form>

        {filled ? (
          <p className="mt-3 rounded-md border border-border p-3 text-xs text-muted-foreground" role="status">
            {t('trade.filled')} {filled.side} {filled.quantity.toLocaleString('en-US')} {filled.symbol} at{' '}
            <Money usd={filled.fillPrice} /> for <Money usd={filled.cashAmount} />.
          </p>
        ) : null}

        <p className="mt-3 text-[11px] text-muted-foreground">
          Simulated only. No order reaches a broker and no real money moves. The fill price is the live
          Alpaca quote at the moment the server handles your request, which may differ from the estimate
          above.
        </p>
      </CardContent>

      <AlertDialog open={confirming} onOpenChange={(open) => !pending && setConfirming(open)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="capitalize">
              {side} {symbol}?
            </AlertDialogTitle>
            <AlertDialogDescription>{t('trade.confirmNote')}</AlertDialogDescription>
          </AlertDialogHeader>
          <dl className="grid gap-2 rounded-xl bg-muted/50 p-4 text-sm">
            <SummaryRow label="Asset" value={name ? `${symbol} · ${name}` : symbol} />
            <SummaryRow label="Action" value={<span className="capitalize">{side}</span>} />
            <SummaryRow label="Quantity" value={validQuantity ? parsedQuantity.toLocaleString('en-US', { maximumFractionDigits: 6 }) : '—'} />
            <SummaryRow label="Estimated price" value={<Money usd={price} />} />
            <SummaryRow label={side === 'buy' ? 'Estimated cost' : 'Estimated proceeds'} value={<Money usd={estimate} />} strong />
            <SummaryRow label="Cash after" value={<Money usd={Math.max(0, cashAfter)} />} />
            <SummaryRow label={`${symbol} held after`} value={Math.max(0, sharesAfter).toLocaleString('en-US', { maximumFractionDigits: 6 })} />
          </dl>
          <p className="text-xs text-muted-foreground">
            Simulated. It fills at the live Alpaca quote when you execute, which may differ slightly from this
            estimate. No real money moves.
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={onExecute} disabled={pending} className={cn('font-semibold capitalize', SIDE_FILL[side])}>
              {pending ? t('trade.placing') : t(side === 'buy' ? 'trade.executeBuy' : 'trade.executeSell')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}

function SummaryRow({ label, value, strong = false }: { label: string; value: React.ReactNode; strong?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn('text-right tabular-nums', strong && 'font-semibold')}>{value}</dd>
    </div>
  )
}
