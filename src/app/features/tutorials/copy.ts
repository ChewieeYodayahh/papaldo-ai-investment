'use client'

import { usePreferences, type Language } from '@/app/features/userData/preferences/store'

/**
 * Tutorial Mode's words (Carlos, 2026-09-30), kept apart from the main
 * dictionary so it does not balloon. English is complete; slang and brainrot
 * cover the controls and step titles, and fall back to English elsewhere.
 * `{name}`-style placeholders are filled by `t(key, vars)`.
 */
const en = {
  'ui.enter': 'Enter Tutorial Mode',
  'ui.finding': 'Getting the tour ready…',
  'ui.step': 'Step {n} of {m}',
  'ui.back': 'Back',
  'ui.next': 'Next',
  'ui.done': 'Done',
  'ui.exit': 'Exit Tutorial Mode',
  'ui.showMe': 'Show me',
  'ui.none': 'Nothing to point at on this screen yet. Try a wider window, or come back once the page has loaded.',
  'ui.completed': 'Done ✓',
  'ui.start': 'Start the tour',

  'returns.asset.title': 'Pick what to invest in',
  'returns.asset.body': 'An index, a fund or one of Papaldo’s stocks. The calculator replays its real monthly prices.',
  'returns.amounts.title': 'Start amount and top-ups',
  'returns.amounts.body': 'What you put in on day one, then what you add every month. Monthly top-ups are how most people really invest.',
  'returns.window.title': 'How far back',
  'returns.window.body': 'Start 10 or 15 years ago, or as far back as Papaldo has prices. Longer windows smooth out bad years.',
  'returns.ahead.title': 'Look ahead',
  'returns.ahead.body': 'Carries the result forward at the asset’s own yearly growth. It is a projection, not a promise.',
  'returns.result.title': 'The answer',
  'returns.result.body': 'What your money would be worth today, with what you put in and how much of it is growth.',
  'returns.chart.title': 'Month by month',
  'returns.chart.body': 'The solid line is real history, the dashed one the projection, and the thin line what you put in.',
  'returns.share.title': 'Share it',
  'returns.share.body': 'Save the result as a PNG or JPG with the chart drawn in. It is made on your device; nothing is uploaded.',

  'savings.goal.title': 'Your goal',
  'savings.goal.body': 'The amount, the deadline and the yearly return you expect. About 7% is a common planning figure for an index fund.',
  'savings.result.title': 'What to set aside',
  'savings.result.body': 'How much to save each week, fortnight or month to hit the goal on time, and how much of it is growth.',
  'savings.bank.title': 'An emergency fund first',
  'savings.bank.body': 'Pick a bank and a term. Each rate shows the date it was checked and links to the bank’s own page.',
  'savings.tax.title': 'The 20% tax',
  'savings.tax.body': 'Banks withhold 20% of deposit interest. Since July 2025 that includes long-term deposits too.',
  'savings.compare.title': 'Deposit or invest?',
  'savings.compare.body': 'The deposit before and after tax, next to investing the same money. Investing can grow more, and can also fall.',

  'purchasing.currency.title': 'Peso or dollar',
  'purchasing.currency.body': 'Each uses its own country’s consumer prices from the World Bank, back to 1960.',
  'purchasing.years.title': 'Two years to compare',
  'purchasing.years.body': 'Enter an amount, the year it is from and the year to compare with.',
  'purchasing.result.title': 'Then vs now',
  'purchasing.result.body': 'What that money buys in the later year, how much prices rose, and the average inflation in between.',
  'purchasing.chart.title': 'Cash loses value',
  'purchasing.chart.body': 'The line is what the same amount kept as cash would buy each year. The dashed part continues the trend.',
  'purchasing.future.title': 'Your own inflation guess',
  'purchasing.future.body': 'Change the rate and the years ahead to see how fast savings lose buying power when they sit still.',

  'budget.region.title': 'Where you live',
  'budget.region.body': 'Philippines loads local lines like Meralco, load and padala; abroad loads the usual list in dollars.',
  'budget.pay.title': 'Take-home pay',
  'budget.pay.body': 'Your monthly pay after tax, SSS, PhilHealth and Pag-IBIG: the money you actually get.',
  'budget.lines.title': 'Give every peso a job',
  'budget.lines.body': 'Enter each monthly cost and tag it a need, a want or savings. Rename, add or remove lines freely.',
  'budget.buckets.title': 'How it splits',
  'budget.buckets.body': 'Needs aim for 50%, wants 30% and savings 20%. Red means over (or, for savings, under) the target.',
  'budget.tips.title': 'What to change',
  'budget.tips.body': 'The one or two changes that would help most, based on your numbers.',

  'statements.sample.title': 'Start from the sample',
  'statements.sample.body': 'A sari-sari store’s year where everything ties. Change a number and watch the checks react.',
  'statements.checks.title': 'The checks',
  'statements.checks.body': 'Assets must equal liabilities plus equity, and the cash flow must end on the cash in the balance sheet.',
  'statements.tabs.title': 'Three statements',
  'statements.tabs.body': 'Income statement: earned and spent. Balance sheet: owned and owed. Cash flow: where cash came and went.',
  'statements.export.title': 'Take it with you',
  'statements.export.body': 'Download a spreadsheet or a report. It stays only in this browser, and clears after 5 days without edits.',

  'quiz.question.title': 'Six short questions',
  'quiz.question.body': 'About your goals, timeline and how you would feel if an investment dropped. There are no wrong answers.',
  'quiz.choices.title': 'Pick the closest',
  'quiz.choices.body': 'Choose the answer that sounds most like you today. You can go back and change it before the end.',
  'quiz.progress.title': 'Your progress',
  'quiz.progress.body': 'The result is a risk band: it shapes the ideas Papaldo shows you. Retake it any time from Tools.',

  'account.nav.title': 'Getting around',
  'account.nav.body': 'Home, your portfolio, the markets, every tool and the community. Tools and Community open into lists.',
  'account.bell.title': 'Notifications',
  'account.bell.body': 'Your simulated trades and friend requests land here. The dot shows what is new.',
  'account.settings.title': 'Make it yours',
  'account.settings.body': 'Light or dark, a colour palette, the font, and the language: English, slang or brainrot.',
  'account.menu.title': 'Your account',
  'account.menu.body': 'Your profile, member page and friends, exporting your data, and signing out.',

  'markets.search.title': 'Search anything',
  'markets.search.body': 'Type a company or ticker. Papaldo’s 50 names come first, then thousands of US listings.',
  'markets.table.title': 'What you can buy',
  'markets.table.body': 'Every stock and fund Papaldo trades, with live prices. Click one to open its trade page.',
  'markets.movers.title': 'Today’s movers',
  'markets.movers.body': 'The biggest gainers and losers among Papaldo’s names, plus market news.',
  'markets.heatmap.title': 'The heatmap',
  'markets.heatmap.body': 'Each tile is a company, sized by market value and coloured by today’s move. On a phone, switch to the list.',
  'markets.benchmarks.title': 'Compare the indices',
  'markets.benchmarks.body': 'How the PSEi did against the NYSE, NASDAQ and S&P 500 over fifteen years.',

  'trade.chart.title': 'The price chart',
  'trade.chart.body': 'Switch the range to see today, this year or years back. Hover or tap for the price on any day.',
  'trade.stats.title': 'Key stats',
  'trade.stats.body': 'Tap the “?” next to any figure for what it means, with a link to learn more.',
  'trade.side.title': 'Buy or sell',
  'trade.side.body': 'Green buys, red sells. You can only sell shares you hold.',
  'trade.quantity.title': 'How many',
  'trade.quantity.body': 'Enter the number of shares. The estimate shows roughly what it costs and the cash you will have left.',
  'trade.review.title': 'Review, then execute',
  'trade.review.body': 'A summary appears before anything happens. It fills at the live price when you confirm, so it can differ a little.',
} as const

export type TutorialKey = keyof typeof en
type Dictionary = Partial<Record<TutorialKey, string>>

const slang: Dictionary = {
  'ui.enter': 'Enter Tutorial Mode (walk me thru it)',
  'ui.next': 'Next up',
  'ui.back': 'Go back',
  'ui.done': 'Got it',
  'ui.showMe': 'Show me how',
  'returns.result.title': 'The payoff',
  'savings.result.title': 'Your stash plan',
  'budget.lines.title': 'Every peso on a mission',
  'statements.checks.title': 'Does it add up?',
  'markets.movers.title': 'Who’s popping today',
  'trade.review.title': 'Double-check, then send it',
}

const brainrot: Dictionary = {
  'ui.enter': 'Enter Tutorial Mode (no cap)',
  'ui.next': 'Next W',
  'ui.back': 'Rewind',
  'ui.done': 'Ate',
  'ui.showMe': 'Demo it fr',
  'returns.result.title': 'The aura gain',
  'savings.result.title': 'The grind plan',
  'budget.lines.title': 'Pesos on side quests',
  'statements.checks.title': 'Is it mathing?',
  'markets.movers.title': 'Main characters today',
  'trade.review.title': 'Lock in, then send',
}

const DICTIONARIES: Record<Language, Dictionary> = { en, slang, brainrot }

export function translateTutorial(language: Language, key: string, vars?: Record<string, string>): string {
  const template = DICTIONARIES[language]?.[key as TutorialKey] ?? en[key as TutorialKey] ?? key
  return vars ? template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match) : template
}

/** Whether English has a line for `key` (tested for every tour step). */
export function hasTutorialCopy(key: string): boolean {
  return key in en
}

export function useTutorialCopy() {
  const language = usePreferences((s) => s.language)
  return (key: string, vars?: Record<string, string>) => translateTutorial(language, key, vars)
}
