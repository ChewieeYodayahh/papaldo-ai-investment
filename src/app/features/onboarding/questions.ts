import type { IsqChoice, IsqQuestion } from './types'

/**
 * The six-item Investment Suitability Questionnaire.
 *
 * Rewritten in plain language on 2026-09-26 (Carlos's call). The six topics
 * and their low-to-high risk ordering still follow Manulife's Client
 * Suitability Assessment, but the wording is now ours and every question has
 * exactly three choices -- one per risk band -- each with a short title, a
 * one-line description and an icon. The verbatim transcription it replaces
 * is in git history (before this date) if the source wording is ever needed.
 *
 * Choices are listed in on-screen order, lowest risk first. Weights are
 * derived from that position rather than typed by hand -- see `withPoints`.
 * Reordering a question's choices changes its scoring; that is deliberate.
 *
 * Choice ids are new with this version. Old `isq_responses` rows keep their
 * old ids (the table is append-only), so the results page must tolerate ids
 * it cannot find here.
 */

/**
 * Every question is normalized onto a 0-20 scale so each contributes equally
 * to the final score. With three choices everywhere the weights are simply
 * 0, 10, 20; the general rule is kept so a future question with 5 or 6
 * choices still normalizes (20 is the LCM of 2, 4 and 5 gaps).
 */
export const NORMALIZED_MAX = 20

function withPoints(choices: Array<Omit<IsqChoice, 'points'>>): IsqChoice[] {
  const gaps = choices.length - 1
  if (gaps < 1 || NORMALIZED_MAX % gaps !== 0) {
    throw new Error(
      `A question with ${choices.length} choices cannot be evenly normalized onto a 0-${NORMALIZED_MAX} scale.`,
    )
  }
  const step = NORMALIZED_MAX / gaps
  return choices.map((choice, index) => ({ ...choice, points: index * step }))
}

export const ISQ_QUESTIONS: IsqQuestion[] = [
  {
    id: 'age',
    prompt: 'How old are you?',
    helperText: 'The longer your money has to grow, the more ups and downs it can ride out.',
    choices: withPoints([
      { id: 'age_56_up', label: '56 or older', description: 'Closer to using this money than growing it', icon: 'sunset' },
      { id: 'age_36_55', label: '36 to 55', description: 'Building up, with retirement on the horizon', icon: 'briefcase' },
      { id: 'age_18_35', label: '18 to 35', description: 'Decades ahead for your money to grow', icon: 'sprout' },
    ]),
  },
  {
    id: 'experience',
    prompt: 'How long have you been investing?',
    helperText: 'Picking “Not yet” also answers the next question for you.',
    choices: withPoints([
      { id: 'exp_none', label: 'Not yet', description: 'This would be my first time', icon: 'footprints' },
      { id: 'exp_under_3y', label: 'Less than 3 years', description: 'I have tried a few things', icon: 'compass' },
      { id: 'exp_3y_plus', label: '3 years or more', description: 'I have seen markets rise and fall', icon: 'mountain' },
    ]),
  },
  {
    id: 'instruments',
    prompt: 'What have you invested in before?',
    helperText: 'Pick the riskiest one you have held.',
    choices: withPoints([
      {
        id: 'inst_savings',
        label: 'Nothing, or savings and bonds',
        description: 'Bank or time deposits, Pag-IBIG MP2, bonds',
        icon: 'piggy-bank',
      },
      {
        id: 'inst_funds_fx',
        label: 'Funds or foreign currency',
        description: 'UITFs, mutual funds, dollar accounts',
        icon: 'layers',
      },
      {
        id: 'inst_equity_leverage',
        label: 'Stocks, crypto or leverage',
        description: 'Individual shares, crypto, margin or options',
        icon: 'candlestick',
      },
    ]),
  },
  {
    id: 'horizon',
    prompt: 'How long can you leave this money invested?',
    helperText: 'Investing suits goals at least five years away.',
    choices: withPoints([
      { id: 'horizon_5y', label: 'About 5 years', description: 'A medium-term goal', icon: 'hourglass' },
      { id: 'horizon_6_10y', label: '6 to 10 years', description: 'Medium to long term', icon: 'calendar' },
      { id: 'horizon_11y_plus', label: '11 years or more', description: 'A long-term goal', icon: 'telescope' },
    ]),
  },
  {
    id: 'volatility',
    prompt: 'If your ₱100,000 dipped to ₱90,000 in a bad month, you would…',
    helperText: 'There is no wrong answer. This is about what you could live with.',
    choices: withPoints([
      { id: 'vol_pull_out', label: 'Pull out', description: 'I can’t stomach losing money', icon: 'shield' },
      { id: 'vol_wait', label: 'Wait it out', description: 'Small dips are fine if it recovers', icon: 'scale' },
      { id: 'vol_buy_more', label: 'Buy more while it’s cheap', description: 'Big swings don’t scare me', icon: 'rocket' },
    ]),
  },
  {
    id: 'objective',
    prompt: 'What do you want this money to do?',
    choices: withPoints([
      { id: 'obj_protect', label: 'Protect it', description: 'Keep losses small, even if returns are small', icon: 'shield' },
      { id: 'obj_balance', label: 'Grow it steadily', description: 'Beat inflation with some income and some growth', icon: 'scale' },
      { id: 'obj_grow_fast', label: 'Grow it fast', description: 'Chase the biggest returns and accept big risks', icon: 'rocket' },
    ]),
  },
]

/**
 * Answering Q2 with "Not yet" pre-selects the matching "Nothing, or savings
 * and bonds" answer on Q3, as the source questionnaire did. Consumed only by
 * the form's auto-select (`IsqForm`); `scoreIsq` does not enforce the
 * pairing, so it is a UI convenience, not a server-side invariant.
 */
export const ANSWER_DEPENDENCIES = [
  {
    whenQuestionId: 'experience',
    whenChoiceId: 'exp_none',
    thenQuestionId: 'instruments',
    thenChoiceId: 'inst_savings',
  },
] as const

function getQuestion(questionId: string): IsqQuestion | undefined {
  return ISQ_QUESTIONS.find((question) => question.id === questionId)
}

export function getChoice(questionId: string, choiceId: string): IsqChoice | undefined {
  return getQuestion(questionId)?.choices.find((choice) => choice.id === choiceId)
}
