'use client'

import { usePreferences, type Language } from '@/app/features/userData/preferences/store'

import type { IsqChoice, IsqQuestion } from './types'

/**
 * The quiz in slang and brainrot (Carlos, 2026-10-10). English lives in
 * `questions.ts`, which the scorer also reads; this file only overrides the
 * words on screen, keyed by question and choice id, and anything missing
 * falls back to English. Scoring never sees it.
 */
type QuestionText = { prompt?: string; helperText?: string }
type ChoiceText = { label?: string; description?: string }
type Register = { questions: Record<string, QuestionText>; choices: Record<string, ChoiceText> }

const slang: Register = {
  questions: {
    age: { prompt: 'How old are you?', helperText: 'The more time your money has, the more ups and downs it can ride out.' },
    experience: { prompt: 'How long have you been investing?', helperText: 'Picking “Not yet” fills in the next one for you.' },
    instruments: { prompt: 'What have you put money into before?', helperText: 'Pick the riskiest thing you’ve held.' },
    horizon: { prompt: 'How long can this money stay put?', helperText: 'Investing works best for goals at least five years out.' },
    volatility: {
      prompt: 'Your ₱100,000 drops to ₱90,000 in a rough month. You…',
      helperText: 'No wrong answer. It’s about what you can live with.',
    },
    objective: { prompt: 'What do you want this money to do?' },
  },
  choices: {
    age_56_up: { label: '56 or older', description: 'Closer to spending it than growing it' },
    age_36_55: { label: '36 to 55', description: 'Building up, retirement on the radar' },
    age_18_35: { label: '18 to 35', description: 'Decades for your money to grow' },
    exp_none: { label: 'Not yet', description: 'This’d be my first time' },
    exp_under_3y: { label: 'Under 3 years', description: 'I’ve dabbled a bit' },
    exp_3y_plus: { label: '3 years or more', description: 'I’ve seen markets go up and down' },
    inst_savings: { label: 'Nothing, or savings and bonds', description: 'Bank or time deposits, Pag-IBIG MP2, bonds' },
    inst_funds_fx: { label: 'Funds or foreign currency', description: 'UITFs, mutual funds, dollar accounts' },
    inst_equity_leverage: { label: 'Stocks, crypto or leverage', description: 'Shares, crypto, margin or options' },
    horizon_5y: { label: 'About 5 years', description: 'A medium-term thing' },
    horizon_6_10y: { label: '6 to 10 years', description: 'Medium to long term' },
    horizon_11y_plus: { label: '11 years or more', description: 'The long game' },
    vol_pull_out: { label: 'Bail', description: 'Losing money? Can’t deal' },
    vol_wait: { label: 'Ride it out', description: 'Small dips are fine if it bounces back' },
    vol_buy_more: { label: 'Buy more while it’s cheap', description: 'Big swings don’t faze me' },
    obj_protect: { label: 'Keep it safe', description: 'Small losses, even if gains are small too' },
    obj_balance: { label: 'Grow it steady', description: 'Beat inflation with a bit of income and growth' },
    obj_grow_fast: { label: 'Grow it fast', description: 'Go for the biggest gains, big risks included' },
  },
}

const brainrot: Register = {
  questions: {
    age: { prompt: 'How old are you fr?', helperText: 'More years = more time for your bag to survive the ups and downs.' },
    experience: { prompt: 'How long have you been in your investing arc?', helperText: 'Pick “Not yet” and the next quest auto-completes.' },
    instruments: { prompt: 'What have you aped into before?', helperText: 'Pick the most unhinged thing you’ve held.' },
    horizon: { prompt: 'How long can this bread stay locked in?', helperText: 'Investing hits different for goals five-plus years out.' },
    volatility: {
      prompt: 'Your ₱100,000 gets cooked down to ₱90,000 in one bad month. You…',
      helperText: 'No wrong answer, no cap. Just what your aura can handle.',
    },
    objective: { prompt: 'What’s this bread’s main quest?' },
  },
  choices: {
    age_56_up: { label: '56 or older', description: 'Spending era, not grinding era' },
    age_36_55: { label: '36 to 55', description: 'Mid-grind, retirement arc loading' },
    age_18_35: { label: '18 to 35', description: 'Decades of glow-up time' },
    exp_none: { label: 'Not yet', description: 'Total NPC, first time fr' },
    exp_under_3y: { label: 'Under 3 years', description: 'Side quests done, still learning' },
    exp_3y_plus: { label: '3 years or more', description: 'Seen the W’s and the L’s' },
    inst_savings: { label: 'Nothing, or savings and bonds', description: 'Bank or time deposits, Pag-IBIG MP2, bonds' },
    inst_funds_fx: { label: 'Funds or foreign currency', description: 'UITFs, mutual funds, dollar accounts' },
    inst_equity_leverage: { label: 'Stonks, crypto or leverage', description: 'Shares, crypto, margin or options — full send' },
    horizon_5y: { label: 'About 5 years', description: 'Mid-term side quest' },
    horizon_6_10y: { label: '6 to 10 years', description: 'Medium to long arc' },
    horizon_11y_plus: { label: '11 years or more', description: 'The long-term lore' },
    vol_pull_out: { label: 'Crash out and dip', description: 'Losing bread? Not my vibe' },
    vol_wait: { label: 'Stay locked in', description: 'Small dips are mid, it’ll bounce' },
    vol_buy_more: { label: 'Buy the dip, sigma', description: 'Big swings? Unbothered' },
    obj_protect: { label: 'Protect the bag', description: 'Tiny L’s, even if the W’s are tiny too' },
    obj_balance: { label: 'Steady glow-up', description: 'Mog inflation with some income and some growth' },
    obj_grow_fast: { label: 'Full send', description: 'Chase the biggest W’s, accept the big risks' },
  },
}

const REGISTERS: Record<Language, Register | null> = { en: null, slang, brainrot }

/** On-screen wording for a question and its choices, in the viewer's register. */
export function useIsqText() {
  const register = REGISTERS[usePreferences((s) => s.language)]
  return {
    prompt: (question: Pick<IsqQuestion, 'id' | 'prompt'>) => register?.questions[question.id]?.prompt ?? question.prompt,
    helperText: (question: Pick<IsqQuestion, 'id' | 'helperText'>) =>
      question.helperText ? (register?.questions[question.id]?.helperText ?? question.helperText) : undefined,
    label: (choice: Pick<IsqChoice, 'id' | 'label'>) => register?.choices[choice.id]?.label ?? choice.label,
    description: (choice: Pick<IsqChoice, 'id' | 'description'>) =>
      register?.choices[choice.id]?.description ?? choice.description,
  }
}
