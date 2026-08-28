import type { IsqChoice, IsqQuestion } from './types'

/**
 * The six-item Investment Suitability Questionnaire.
 *
 * Question and choice wording is transcribed VERBATIM from Manulife's Client
 * Suitability Assessment. Do not paraphrase: the wording is the spec. If a
 * question needs to change, change it here and update CONTEXT.md.
 *
 * Choices are listed in the same order they appear on screen, which in every
 * question runs from lowest risk to highest. Weights are derived from that
 * position rather than typed by hand -- see `withPoints` below.
 */

/**
 * Every question is normalized onto a 0-20 scale so that each contributes
 * equally to the final score regardless of how many options it offers.
 *
 * 20 is the least common multiple of the gap counts across the questionnaire
 * (3 choices -> 2 gaps, 5 -> 4, 6 -> 5), which is what keeps every weight a
 * whole number:
 *
 *   3 choices -> 0, 10, 20
 *   5 choices -> 0, 5, 10, 15, 20
 *   6 choices -> 0, 4, 8, 12, 16, 20
 */
export const NORMALIZED_MAX = 20

function withPoints(choices: Array<{ id: string; label: string }>): IsqChoice[] {
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
    prompt: 'How old are you now?',
    choices: withPoints([
      { id: 'age_56_up', label: '56 years old and up' },
      { id: 'age_36_55', label: '36 to 55 years old' },
      { id: 'age_18_35', label: '18 to 35 years old' },
    ]),
  },
  {
    id: 'experience',
    prompt: 'How would you describe your years of investment experience?',
    helperText:
      'If you choose "No experience", Question 3 is set to "I have not invested in any financial instrument in the past" by default.',
    choices: withPoints([
      { id: 'exp_none', label: 'No experience' },
      { id: 'exp_under_1y', label: 'Less than 1 year' },
      { id: 'exp_1_to_3y', label: '1 to less than 3 Years' },
      { id: 'exp_3_to_5y', label: '3 to less than 5 Years' },
      { id: 'exp_5y_plus', label: '5 years or more' },
    ]),
  },
  {
    id: 'instruments',
    prompt: 'Which of the following financial instruments have you invested in the past?',
    choices: withPoints([
      { id: 'inst_none', label: 'I have not invested in any financial instrument in the past' },
      { id: 'inst_bonds', label: 'Bonds/Fixed Income' },
      { id: 'inst_bonds_fx', label: 'Bonds/Fixed income, or Foreign Currencies' },
      {
        id: 'inst_bonds_fx_balanced',
        label: 'Bonds/Fixed income, Foreign Currencies, or Balanced Funds',
      },
      {
        id: 'inst_bonds_fx_balanced_equity',
        label: 'Bonds/Fixed income, Foreign Currencies, Balanced Funds, or Stocks/ Equity Funds',
      },
      {
        id: 'inst_bonds_fx_balanced_equity_leverage',
        label:
          'Bonds/Fixed income, Foreign Currencies, Balanced Funds, Stocks/ Equity Funds, or Leverage Instruments',
      },
    ]),
  },
  {
    id: 'horizon',
    prompt: 'What is the intended time period for your investment?',
    helperText: 'Our products are suitable for medium to long term goals.',
    choices: withPoints([
      { id: 'horizon_medium', label: 'Medium Term (at least 5 years)' },
      { id: 'horizon_medium_long', label: 'Medium to Long Term (6 to 10 years)' },
      { id: 'horizon_long', label: 'Long Term (11 years or more)' },
    ]),
  },
  {
    id: 'volatility',
    prompt:
      'How comfortable are you with changes in the value of your investments, including the possibility of losing some of the original amount you invested?',
    helperText:
      'For example, if you invest ₱100,000, a 10% change means your investment could increase or decrease by ₱10,000.',
    choices: withPoints([
      { id: 'vol_0_to_2', label: 'I can tolerate minimal fluctuation in my investment of 0% to -2%' },
      { id: 'vol_5', label: 'I can tolerate fluctuations in my investments of around +/-5%' },
      { id: 'vol_10', label: 'I can tolerate fluctuations in my investments of around +/-10%' },
      {
        id: 'vol_15',
        label: 'I can tolerate significant changes in my investment of around +/-15%',
      },
      {
        id: 'vol_20_plus',
        label: 'I can tolerate significant changes in my investment of +/-20% or more',
      },
    ]),
  },
  {
    id: 'objective',
    prompt: 'Which of the following best describes your overall investment objective?',
    choices: withPoints([
      {
        id: 'obj_capital_preservation',
        label: 'Capital Preservation: Keep investment losses at a minimum with little concern for returns',
      },
      {
        id: 'obj_income',
        label: 'Income Orientation: Earn a modest income or aim to beat inflation',
      },
      {
        id: 'obj_income_growth',
        label: 'Income and Growth: Achieve a balance of modest income and capital appreciation',
      },
      {
        id: 'obj_growth',
        label: 'Growth Orientation: Aim for returns with a focus on capital appreciation',
      },
      {
        id: 'obj_aggressive_growth',
        label: 'Aggressive Growth: Seek maximum returns, possibly from high-risk financial investments',
      },
    ]),
  },
]

/**
 * On the source questionnaire, answering Q2 with "No experience" pre-selects
 * the matching "have not invested" answer on Q3. Encoded as data and consumed
 * today only by the form's auto-select (`IsqForm`); `scoreIsq` does not enforce
 * the pairing, so it is a UI convenience, not a server-side invariant.
 */
export const ANSWER_DEPENDENCIES = [
  {
    whenQuestionId: 'experience',
    whenChoiceId: 'exp_none',
    thenQuestionId: 'instruments',
    thenChoiceId: 'inst_none',
  },
] as const

function getQuestion(questionId: string): IsqQuestion | undefined {
  return ISQ_QUESTIONS.find((question) => question.id === questionId)
}

export function getChoice(questionId: string, choiceId: string): IsqChoice | undefined {
  return getQuestion(questionId)?.choices.find((choice) => choice.id === choiceId)
}
