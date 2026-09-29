import 'server-only'

import { getProfile } from '@/app/features/auth/api/profile'
import { getPerformanceHistory, getValuation } from '@/app/features/dashboard/api/valuation'
import { getUniverseQuotes } from '@/app/features/markets/api/movers'
import { getCurrentAnswers, getCurrentRiskProfile } from '@/app/features/onboarding/api/submit'
import { getOrderHistory } from '@/app/features/trading/api/orders'
import { getPortfolio } from '@/app/features/trading/api/portfolio'

/** Every account opens with this much simulated cash (the portfolios table default). */
export const STARTING_CASH = 500_000

/** Far more fills than any simulated account has made; the query is RLS-scoped to the caller. */
const ORDER_LIMIT = 10_000

export type ExportData = {
  generatedAt: string
  account: {
    username: string | null
    email: string
    occupation: string | null
    annualIncome: string | null
    idealIncome: string | null
    riskBand: string | null
    riskScore: number | null
    quizTakenAt: string | null
    answers: Array<{ question: string; answer: string }>
  }
  startingCash: number
  cash: number
  total: number
  pricedLive: boolean
  positions: Array<{
    symbol: string
    sector: string
    quantity: number
    avgCost: number
    price: number
    value: number
    costBasis: number
    unrealized: number
  }>
  orders: Array<{
    id: string
    symbol: string
    side: 'buy' | 'sell'
    quantity: number
    fillPrice: number
    cashAmount: number
    filledAt: string
  }>
  performance: Array<{ date: string; value: number }>
  market: Array<{
    symbol: string
    name: string
    sector: string
    price: number
    open: number
    high: number
    low: number
    previousClose: number
    change: number
    changePercent: number
    volume: number
    at: string
  }>
}

const incomeText = (income: { amount: number; currency: string } | null) =>
  income ? `${income.currency} ${income.amount.toLocaleString('en-US')}` : null

/**
 * Everything the export page can put in a file, read once for the signed-in
 * user. The page then builds files in the browser from this; the server only
 * reads, and nothing about an export is written anywhere (Carlos, 2026-09-29).
 * Null when signed out.
 */
export async function getExportData(): Promise<ExportData | null> {
  const [profile, portfolio, risk, orders, market] = await Promise.all([
    getProfile(),
    getPortfolio(),
    getCurrentRiskProfile(),
    getOrderHistory(ORDER_LIMIT),
    getUniverseQuotes(),
  ])
  if (!profile || !portfolio) return null

  const { valuation } = await getValuation(portfolio)
  const [performance, answers] = await Promise.all([
    getPerformanceHistory(portfolio, valuation),
    risk ? getCurrentAnswers(risk) : Promise.resolve([]),
  ])

  return {
    generatedAt: new Date().toISOString(),
    account: {
      username: profile.username,
      email: profile.email,
      occupation: profile.occupation,
      annualIncome: incomeText(profile.annualIncome),
      idealIncome: incomeText(profile.idealIncome),
      riskBand: risk?.band ?? null,
      riskScore: risk?.score ?? null,
      quizTakenAt: risk?.computed_at ?? null,
      answers: answers.map((a) => ({ question: a.prompt, answer: a.choice?.label ?? 'Answered in an earlier version' })),
    },
    startingCash: STARTING_CASH,
    cash: valuation.cash,
    total: valuation.total,
    pricedLive: valuation.live,
    positions: valuation.positions.map((p) => ({
      symbol: p.symbol,
      sector: p.sector,
      quantity: p.quantity,
      avgCost: p.avgCost,
      price: p.price,
      value: p.value,
      costBasis: p.costBasis,
      unrealized: p.unrealized,
    })),
    orders: orders.map((o) => ({
      id: o.id,
      symbol: o.symbol,
      side: o.side,
      quantity: o.quantity,
      fillPrice: o.fillPrice,
      cashAmount: o.cashAmount,
      filledAt: o.filledAt,
    })),
    performance,
    market: market.ok
      ? market.data.map((q) => ({
          symbol: q.symbol,
          name: q.name,
          sector: q.sector,
          price: q.price,
          open: q.open,
          high: q.high,
          low: q.low,
          previousClose: q.previousClose,
          change: q.change,
          changePercent: q.changePercent,
          volume: q.volume,
          at: q.at,
        }))
      : [],
  }
}
