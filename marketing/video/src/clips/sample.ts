/**
 * The sample account the landing clips show (2026-10-02). Everything is
 * built from data captured from the running app (public/data, 2026-10-01)
 * and the app's own pure functions, so the numbers are the ones the app
 * would show for this account: valuePortfolio / sectorAllocation for the
 * dashboard, scoreIsq for the quiz result.
 *
 * The account is fictional ("Ana"), and the landing page says the clips
 * use a sample account.
 */
import type { ShellUser } from "@/app/features/userData/frame/api/shell";
import type { AlpacaBar } from "@/app/core/services/alpaca";
import type { FinnhubCompanyProfile } from "@/app/core/services/finnhub";
import type { UniverseQuote } from "@/app/features/markets/api/movers";
import type { AnsweredQuestion } from "@/app/features/tools/quiz/api/submit";
import type { RecommendedAsset } from "@/app/features/tools/quiz/api/recommendations";
import { sectorAllocation, valuePortfolio, type Point, type PositionInput } from "@/app/features/dashboard/portfolio-math";
import { ISQ_QUESTIONS } from "@/app/features/tools/quiz/questions";
import { scoreIsq } from "@/app/features/tools/quiz/scoring";

import quotesJson from "../../public/data/universe-quotes.json";
import sp500 from "../../public/data/history-SP500.json";

export const QUOTES = quotesJson as UniverseQuote[];
const QUOTE = new Map(QUOTES.map((q) => [q.symbol, q]));

export const SAMPLE_USER: ShellUser = {
  displayName: "Ana Reyes",
  firstName: "Ana",
  email: "ana@example.com",
  avatarUrl: null,
  username: "ana",
  occupation: null,
  isAdmin: false,
};

/** Every new account starts with this much practice cash. */
const STARTING_CASH = 100_000;

/** A calm first portfolio: an index fund and four household names. */
const POSITIONS: PositionInput[] = [
  { symbol: "VOO", assetClass: "equity", quantity: 30, avgCost: 662.4 },
  { symbol: "AAPL", assetClass: "equity", quantity: 40, avgCost: 301.2 },
  { symbol: "MSFT", assetClass: "equity", quantity: 12, avgCost: 489.5 },
  { symbol: "KO", assetClass: "equity", quantity: 80, avgCost: 82.1 },
  { symbol: "JPM", assetClass: "equity", quantity: 20, avgCost: 318 },
];

const spent = POSITIONS.reduce((sum, p) => sum + p.quantity * p.avgCost, 0);

export const VALUATION = valuePortfolio(
  STARTING_CASH - spent,
  POSITIONS,
  new Map(POSITIONS.map((p) => [p.symbol, { price: QUOTE.get(p.symbol)!.price, change: QUOTE.get(p.symbol)!.change }])),
  new Map(QUOTES.map((q) => [q.symbol, q.sector])),
);

export const ALLOCATION = sectorAllocation(VALUATION);

/** A small deterministic wobble: the same frame always draws the same line. */
const wobble = (i: number) => Math.sin(i * 0.73) * 0.6 + Math.sin(i * 1.91 + 1.2) * 0.35 + Math.sin(i * 0.17) * 0.8;

/** Three months of daily account value, from the starting cash to today's total. */
export const PERFORMANCE: Point[] = (() => {
  const days = 92;
  const start = Date.UTC(2026, 6, 1);
  return Array.from({ length: days }, (_, i) => {
    const t = i / (days - 1);
    const trend = STARTING_CASH + (VALUATION.total - STARTING_CASH) * (t * t * (3 - 2 * t));
    const value = i === days - 1 ? VALUATION.total : trend + wobble(i) * 420 * Math.sin(Math.PI * t);
    return { date: new Date(start + i * 86_400_000).toISOString().slice(0, 10), value: Math.round(value * 100) / 100 };
  });
})();

/** Today's biggest moves among Papaldo's names, as the dashboard picks them. */
export const MOVERS = (() => {
  const byChange = [...QUOTES].sort((a, b) => b.changePercent - a.changePercent);
  return {
    gainers: byChange.filter((q) => q.changePercent > 0).slice(0, 4),
    losers: byChange.filter((q) => q.changePercent < 0).reverse().slice(0, 4),
  };
})();

/**
 * The quiz, answered down the middle: the middle choice of every question,
 * scored by the app's own scoring function (a Medium band).
 */
const ANSWERS = ISQ_QUESTIONS.map((q) => ({ questionId: q.id, choiceId: q.choices[Math.floor((q.choices.length - 1) / 2)].id }));
export const QUIZ = scoreIsq(ANSWERS);
export const QUIZ_ANSWERS: AnsweredQuestion[] = ISQ_QUESTIONS.map((q, i) => {
  const choice = q.choices.find((c) => c.id === ANSWERS[i].choiceId)!;
  return { questionId: q.id, prompt: q.prompt, choice: { label: choice.label, description: choice.description, icon: choice.icon } };
});

export const RECOMMENDED: RecommendedAsset[] = [
  ["VOO", "fund"],
  ["VTI", "fund"],
  ["SCHD", "fund"],
  ["VIG", "fund"],
  ["VXUS", "fund"],
  ["AAPL", "stock"],
  ["MSFT", "stock"],
  ["JPM", "stock"],
  ["KO", "stock"],
  ["COST", "stock"],
].map(([symbol, kind]) => ({
  symbol,
  name: QUOTE.get(symbol)?.name ?? symbol,
  kind: kind as RecommendedAsset["kind"],
  sector: QUOTE.get(symbol)?.sector ?? "ETF",
}));

/** The trade clip's symbol: an S&P 500 index fund, the calm first buy. */
export const TRADE_QUOTE = QUOTE.get("VOO")!;

export const TRADE_PROFILE = {
  ok: true as const,
  data: {
    ticker: "VOO",
    name: "Vanguard S&P 500 ETF",
    exchange: "NYSE ARCA",
    country: "US",
    currency: "USD",
    marketCapitalization: 0,
    shareOutstanding: 0,
    finnhubIndustry: "Exchange-traded fund",
    ipo: "2010-09-07",
    logo: "",
    weburl: "",
  } as FinnhubCompanyProfile,
};

export const TRADE_METRICS = {
  ok: true as const,
  data: {
    "52WeekHigh": 712.4,
    "52WeekLow": 512.9,
    beta: 1,
    dividendYieldIndicatedAnnual: 1.18,
    "10DayAverageTradingVolume": 5.62,
  } as Record<string, number | string | null>,
};

/**
 * About 14 months of daily candles for VOO, following the captured S&P 500
 * monthly closes (scaled to VOO's price) with a deterministic daily wobble.
 * The clip says it is a sample account; the chart's shape is the real index.
 */
export const TRADE_CANDLES: AlpacaBar[] = (() => {
  const points = (sp500 as { points: Array<{ date: string; close: number }> }).points.slice(-15);
  const scale = TRADE_QUOTE.price / points[points.length - 1].close;
  const monthly = points.map((p) => ({ t: Date.parse(`${p.date}T00:00:00Z`), close: p.close * scale }));
  const end = Date.UTC(2026, 9, 1);
  const bars: AlpacaBar[] = [];
  let prev = monthly[0].close;
  for (let t = monthly[0].t, i = 0; t <= end; t += 86_400_000, i++) {
    const day = new Date(t).getUTCDay();
    if (day === 0 || day === 6) continue;
    const next = monthly.findIndex((m) => m.t > t);
    const a = monthly[Math.max(0, (next === -1 ? monthly.length : next) - 1)];
    const b = next === -1 ? { t: end, close: TRADE_QUOTE.price } : monthly[next];
    const base = a.close + (b.close - a.close) * ((t - a.t) / Math.max(1, b.t - a.t));
    const close = t >= end - 86_400_000 ? TRADE_QUOTE.price : base * (1 + wobble(i) * 0.006);
    const open = prev;
    bars.push({
      time: new Date(t).toISOString().slice(0, 10),
      open: round(open),
      close: round(close),
      high: round(Math.max(open, close) * (1 + Math.abs(wobble(i + 3)) * 0.003)),
      low: round(Math.min(open, close) * (1 - Math.abs(wobble(i + 7)) * 0.003)),
      volume: 5_000_000 + Math.round(Math.abs(wobble(i)) * 1_500_000),
    });
    prev = close;
  }
  return bars;
})();

function round(value: number) {
  return Math.round(value * 100) / 100;
}

/** The heatmap at the open: every tile flat, filling to the day's real moves as `t` goes 0 -> 1. */
export function quotesAt(t: number): UniverseQuote[] {
  return QUOTES.map((q) => {
    const changePercent = q.changePercent * t;
    const previousClose = q.previousClose;
    const price = round(previousClose * (1 + changePercent / 100));
    return { ...q, changePercent, price, change: round(price - previousClose) };
  });
}
