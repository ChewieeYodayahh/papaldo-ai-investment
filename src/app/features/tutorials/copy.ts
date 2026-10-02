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
  'account.settings.body': 'Light or dark, a palette (Midnight, Forest, Orchid, Black, White) or your own colours, the font, and the language: English, slang or brainrot.',
  'account.menu.title': 'Your account',
  'account.menu.body': 'Your profile, member page and friends, exporting your data, and signing out.',

  'markets.search.title': 'Search anything',
  'markets.search.body': 'Type a company or ticker to find any of the 70 companies and funds you can trade here.',
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

  // Tool tours: the question, your inputs, the result, the lesson (2026-10-01).
  'returns.question.title': 'What if you had invested back then?',
  'returns.question.body': 'This replays real prices to show what money invested years ago would be worth today.',
  'returns.amounts.title': 'Your money',
  'returns.amounts.body': 'Pick what to invest in, what you put in on day one, and what you add each month.',
  'returns.result.title': 'What it is worth now',
  'returns.result.body': 'Today’s value, how much you put in, and how much came from growth.',
  'returns.lesson.title': 'The lesson',
  'returns.lesson.body': 'Staying invested through the dips did most of the work. A projection is a guide, not a promise.',
  'savings.question.title': 'How much to save?',
  'savings.question.body': 'Set a goal and a deadline; this shows what to put away each month to get there.',
  'savings.goal.title': 'Your goal',
  'savings.goal.body': 'The amount, the years and the return you expect. Tick the emergency fund to add a bank deposit.',
  'savings.result.title': 'What to set aside',
  'savings.result.body': 'The amount to save each week, fortnight or month, and how much of the goal is growth.',
  'savings.compare.title': 'One chart, both plans',
  'savings.compare.body': 'Investing for the goal next to your emergency fund in the bank. Keep the fund safe first.',
  'purchasing.question.title': 'Then vs now',
  'purchasing.question.body': 'This shows what money from a past year is worth today, from real price data.',
  'purchasing.years.title': 'An amount and two years',
  'purchasing.years.body': 'An amount, the year it is from, and the year to compare. The $ / ₱ switch picks whose prices.',
  'purchasing.result.title': 'What it buys now',
  'purchasing.result.body': 'What you need today to buy what that money bought then, and how much value cash lost.',
  'purchasing.lesson.title': 'The lesson',
  'purchasing.lesson.body': 'Money that sits still shrinks every year. Investing aims to grow faster than prices rise.',
  'budget.question.title': 'Where does your pay go?',
  'budget.question.body': 'Plan a month against the 50/30/20 guide: half for needs, 30% for wants, 20% for savings.',
  'budget.lines.title': 'Give every peso a job',
  'budget.lines.body': 'Enter your take-home pay and each monthly cost, tagged as a need, a want or savings.',
  'budget.buckets.title': 'How it splits',
  'budget.buckets.body': 'Needs, wants and savings against their targets. Red means over, or under for savings.',
  'budget.lesson.title': 'The lesson',
  'budget.lesson.body': 'Needs first, a little fun, then pay yourself. Even 10% saved every month builds the habit.',
  'statements.question.title': 'Three statements, one story',
  'statements.question.body': 'Build an income statement, balance sheet and cash flow, and see how they connect.',
  'statements.sample.title': 'Start from the sample',
  'statements.sample.body': 'A sari-sari store’s year where everything ties. Change a number and watch the checks react.',
  'statements.checks.title': 'The checks',
  'statements.checks.body': 'Assets must equal liabilities plus equity, and the cash flow must end on the balance-sheet cash.',
  'statements.lesson.title': 'The lesson',
  'statements.lesson.body': 'Profit, what you own and owe, and where the cash went: three views of the same year.',
  'dca.question.title': 'All at once, or monthly?',
  'dca.question.body': 'This replays both ways of investing the same money on real prices, so you can compare.',
  'dca.period.title': 'Your plan',
  'dca.period.body': 'What to buy, the monthly amount and how far back. “All at once” invests the same total on day one.',
  'dca.result.title': 'Who came out ahead',
  'dca.result.body': 'What you put in and when, which way ended ahead, and the average price each paid.',
  'dca.history.title': 'The lesson',
  'dca.history.body': 'Money in sooner usually wins, but investing monthly protects you from bad timing. Starting matters most.',
  'waiting.question.title': 'The price of waiting',
  'waiting.question.body': 'Tell it the income you want in retirement. It shows what to save each month, starting now or later.',
  'waiting.inputs.title': 'Your retirement',
  'waiting.inputs.body': 'Your age, when you want to retire, the monthly income you want, and a steady return.',
  'waiting.results.title': 'What each start needs',
  'waiting.results.body': 'The monthly saving needed if you start now, or 5, 10 or 15 years later.',
  'waiting.lesson.title': 'The lesson',
  'waiting.lesson.body': 'Early money has more years to grow. Each year you wait, every month has to carry more.',
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
