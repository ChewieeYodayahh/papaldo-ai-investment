'use client'

import { usePreferences, type Language } from './store'

/**
 * UI copy in three registers (Settings -> Language).
 *
 *   en        plain English, the default and the fallback for every key
 *   slang     casual English
 *   brainrot  Gen Alpha, per Carlos's glossary (2026-09-25)
 *
 * Scope is the app shell, the dashboard and the markets page. Legal-ish text
 * -- the "simulated trading only" disclaimers, error messages, the ISQ itself
 * -- stays in plain English in every register: a joke is fine on a label,
 * not on the sentence telling someone no real money is involved.
 *
 * `{name}` placeholders are filled by `t(key, { name })`.
 */
const en = {
  'nav.home': 'Home',
  'nav.portfolio': 'Portfolio',
  'nav.market': 'Market',
  'nav.tools': 'Tools',
  'nav.about': 'About Papaldo Ka',
  'nav.soon': 'Soon',

  'header.notifications': 'Notifications',
  'header.noNotifications': 'Nothing yet. Your simulated fills will show up here.',
  'header.settings': 'Settings',
  'header.profile': 'Profile',
  'header.themes': 'Themes',
  'header.mode': 'Mode',
  'header.mode.light': 'Light',
  'header.mode.dark': 'Dark',
  'header.mode.system': 'System',
  'header.palette.forest': 'Forest',
  'header.palette.orchid': 'Orchid',
  'header.palette.midnight': 'Midnight',
  'header.fonts': 'Fonts',
  'header.language': 'Language',
  'header.lang.en': 'English',
  'header.lang.slang': 'Slang English',
  'header.lang.brainrot': 'Brainrot English',
  'header.login': 'Log in',
  'header.signup': 'Sign up',
  'header.signout': 'Sign out',
  'header.bought': 'Bought',
  'header.sold': 'Sold',

  'dash.totalHoldings': 'Total Holdings',
  'dash.today': 'today',
  'dash.cash': 'Cash',
  'dash.invested': 'Invested',
  'dash.fxNote': 'Converted at ₱{rate} per $1',
  'dash.fxOff': 'Peso rate unavailable — showing USD.',
  'dash.riskAppetite': 'Risk Appetite',
  'dash.youAre': 'You are',
  // The article lives with the band so "an Aggressive" reads right.
  'dash.band.Low': 'a Conservative',
  'dash.band.Medium': 'a Moderate',
  'dash.band.High': 'an Aggressive',
  'dash.band.none': 'not assessed yet',
  'dash.blurb.Low': 'Capital first. Your model leans on broad ETFs and steady dividend payers.',
  'dash.blurb.Medium': 'A balance of growth and stability across sectors.',
  'dash.blurb.High': 'Growth first. You accept bigger swings for a bigger upside.',
  'dash.blurb.none': 'Take the six-question quiz so your dashboard can be tailored to you.',
  'dash.completeProfile': 'Complete your user profile',
  'dash.whatIsProfile': 'What is your investment profile?',
  'dash.retake': 'Retake the quiz',
  'dash.markets': 'Markets',
  'dash.gainers': 'Gainers',
  'dash.losers': 'Losers',
  'dash.myPortfolio': 'My Portfolio',
  'dash.seeAll': 'See all',
  'dash.units': 'Units',
  'dash.emptyPortfolio': 'No positions yet. Your first simulated trade shows up here.',
  'dash.browseMarkets': 'Browse markets',
  'dash.performance': 'Portfolio Performance',
  'dash.performanceNote': 'Reconstructed from your fills and daily closes.',
  'dash.quizTitle': 'Investment Profile Quiz',
  'dash.quizBody':
    '{name}, this quiz helps us learn your investment preferences. It takes about 5 minutes and there are no right or wrong answers.',
  'dash.maybeLater': 'Maybe later',
  'dash.startNow': 'Start now',
  'dash.yourPortfolio': 'Your Portfolio',
  'dash.marketsPage': 'Markets page',
  'dash.portfolioPage': 'Portfolio page',
  'dash.topHoldings': 'Top Holdings',
  'dash.bySector': 'By sector',

  'mkt.title': 'Markets',
  'mkt.subtitle': 'Live US stock and ETF prices from Alpaca. Pick something to simulate a trade.',
  'mkt.indexes': 'Benchmarks',
  'mkt.universe': 'Tradable on Papaldo',
  'mkt.all': 'All',
  'mkt.symbol': 'Symbol',
  'mkt.price': 'Price',
  'mkt.change': '24h change',
  'mkt.range': 'Day range',
  'mkt.volume': 'Volume',
  'mkt.trend': 'Last 30 days',
  'mkt.trade': 'Trade',
  'mkt.topGainers': 'Top Gainers',
  'mkt.topLosers': 'Top Losers',
  'mkt.heatmap': 'Sector Heatmap',
  'mkt.catalogue': 'Browse all US stocks',
  'mkt.news': 'Market News',

  'pf.title': 'Portfolio',
  'pf.subtitle': 'Everything you hold, what it is worth, and how you got here.',
} as const

export type CopyKey = keyof typeof en
type Dictionary = Partial<Record<CopyKey, string>>

const slang: Dictionary = {
  'nav.home': 'Home Base',
  'nav.portfolio': 'My Stack',
  'nav.market': 'The Market',
  'nav.tools': 'Toolbox',
  'header.noNotifications': 'Quiet in here. Your trades will pop up soon.',
  'header.lang.slang': 'Slang English',
  'dash.totalHoldings': 'Your Stack',
  'dash.cash': 'Cash on hand',
  'dash.riskAppetite': 'Risk Vibe',
  'dash.youAre': "You're a",
  'dash.band.Low': 'a play-it-safe type',
  'dash.band.Medium': 'a middle-of-the-road type',
  'dash.band.High': 'a go-big type',
  'dash.band.none': 'mystery (for now)',
  'dash.blurb.none': 'Run the quick quiz and we’ll tune things to your style.',
  'dash.whatIsProfile': "What's my investing style?",
  'dash.markets': "What's moving",
  'dash.gainers': 'Winners',
  'dash.losers': 'Losers',
  'dash.myPortfolio': 'My Stack',
  'dash.seeAll': 'See it all',
  'dash.emptyPortfolio': 'Nothing here yet. Make your first move.',
  'dash.browseMarkets': 'Go shopping',
  'dash.performance': 'How you’re doing',
  'dash.quizTitle': 'Investing Style Quiz',
  'dash.maybeLater': 'Nah, later',
  'dash.startNow': "Let's go",
  'dash.yourPortfolio': 'Your Stack',
  'dash.topHoldings': 'Your big ones',
  'mkt.title': 'The Market',
  'mkt.topGainers': 'Biggest winners',
  'mkt.topLosers': 'Taking a hit',
  'mkt.trade': 'Trade it',
  'mkt.heatmap': 'Heat check',
  'pf.title': 'My Stack',
}

const brainrot: Dictionary = {
  'nav.home': 'Home Base fr',
  'nav.portfolio': 'Asset Flex',
  'nav.market': 'The Stonks',
  'nav.tools': 'Sigma Tools',
  'header.notifications': 'Pings',
  'header.noNotifications': 'No pings yet. Ape in and it’ll be lit.',
  'header.settings': 'Settings (mid)',
  'header.profile': 'My Lore',
  'header.themes': 'Drip',
  'header.language': 'Lingo',
  'dash.totalHoldings': 'The Bag',
  'dash.today': 'today no cap',
  'dash.cash': 'Infinite Stash',
  'dash.invested': 'Aped In',
  'dash.riskAppetite': 'Vibe Check',
  'dash.youAre': 'You are giving',
  'dash.band.Low': 'Safe Mode',
  'dash.band.Medium': 'Lowkey Balanced',
  'dash.band.High': 'Full Send Sigma',
  'dash.band.none': 'NPC (unassessed)',
  'dash.blurb.Low': 'Zero risk energy. Your bag stays chill.',
  'dash.blurb.Medium': 'Mid in the best way. Balanced aura.',
  'dash.blurb.High': 'Crash Out Mode unlocked. Big swings, big W potential.',
  'dash.blurb.none': 'Do the Mewing & Risk Assessment to unlock your aura.',
  'dash.completeProfile': 'Finish your lore',
  'dash.whatIsProfile': "What's my aura?",
  'dash.retake': 'Run it back',
  'dash.markets': 'Stonks Rn',
  'dash.gainers': 'W Rizz',
  'dash.losers': 'Cooked',
  'dash.myPortfolio': 'Asset Flex',
  'dash.seeAll': 'See the whole flex',
  'dash.units': 'Units fr',
  'dash.emptyPortfolio': 'Empty bag. Ape in to start the lore.',
  'dash.browseMarkets': 'Go cop',
  'dash.performance': 'Aura Graph',
  'dash.quizTitle': 'Mewing & Risk Assessment',
  'dash.quizBody':
    '{name}, this quiz reads your investing aura. Takes like 5 minutes and there are no wrong answers, no cap.',
  'dash.maybeLater': 'Later, bro',
  'dash.startNow': 'Bet, start',
  'dash.yourPortfolio': 'Your Asset Flex',
  'dash.marketsPage': 'Stonks page',
  'dash.portfolioPage': 'Flex page',
  'dash.topHoldings': 'Main Characters',
  'dash.bySector': 'By sector fr',
  'mkt.title': 'The Stonks',
  'mkt.subtitle': 'Live US stonks from Alpaca. Pick one and ape in (simulated, chill).',
  'mkt.indexes': 'The Big Dawgs',
  'mkt.universe': 'Copable on Papaldo',
  'mkt.change': 'Aura shift',
  'mkt.trade': 'Ape In',
  'mkt.topGainers': 'Up Only (+1000 Aura)',
  'mkt.topLosers': 'Fanum Taxed',
  'mkt.heatmap': 'Vibe Map',
  'mkt.catalogue': 'Every stonk in the lore',
  'mkt.news': 'The Tea',
  'pf.title': 'Asset Flex',
  'pf.subtitle': 'Your whole bag, its aura, and the lore behind it.',
}

const DICTIONARIES: Record<Language, Dictionary> = { en, slang, brainrot }

export function translate(language: Language, key: CopyKey, vars?: Record<string, string>): string {
  const template = DICTIONARIES[language][key] ?? en[key]
  if (!vars) return template
  return template.replace(/\{(\w+)\}/g, (match, name: string) => vars[name] ?? match)
}

/** `const t = useCopy(); t('dash.gainers')` -- re-renders when the language changes. */
export function useCopy() {
  const language = usePreferences((s) => s.language)
  return (key: CopyKey, vars?: Record<string, string>) => translate(language, key, vars)
}

/** For a server component that needs a label: renders the key in the viewer's language. */
export function T({ k, vars }: { k: CopyKey; vars?: Record<string, string> }) {
  return useCopy()(k, vars)
}
