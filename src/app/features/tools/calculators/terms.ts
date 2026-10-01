/**
 * Every [?] in the tools (Carlos, 2026-10-01): a field or a key term, its
 * one-line meaning in plain words, and where to read more. The tools are for
 * learning, so a term a beginner might not know always has one.
 *
 * English only for now; the slang and brainrot dictionaries fall back to it.
 */
export const TERMS = {
  // Inputs
  age: { label: 'Your age', text: 'How old you are today.' },
  retireAge: { label: 'Retirement age', text: 'The age you want to stop working.' },
  retirementIncome: {
    label: 'Retirement income',
    text: 'What you want to live on each month once you stop working, in today’s money. Prices rise, so the tool grows it with inflation.',
  },
  expectedReturn: {
    label: 'Expected return',
    text: 'How much your money grows in a typical year. About 7% is a common planning figure for an index fund. Not guaranteed.',
    href: 'https://www.investopedia.com/terms/e/expectedreturn.asp',
  },
  monthlyAmount: { label: 'Monthly amount', text: 'What you would put in each month, like part of every payday.' },
  period: { label: 'Period', text: 'How far back to replay, ending today.' },
  investment: {
    label: 'What to invest in',
    text: 'An index (a basket of many companies), a fund that tracks one, or a single company’s stock.',
  },
  goal: { label: 'Goal', text: 'The amount you want to have saved, like a house down payment or a trip.' },
  takeHome: {
    label: 'Take-home pay',
    text: 'Your pay after tax and deductions: what actually lands in your account.',
    href: 'https://www.investopedia.com/terms/t/take-home-pay.asp',
  },

  // Key terms in the lessons
  dca: {
    label: 'Cost averaging',
    text: 'Investing the same amount on a schedule, like every payday. You buy more shares when prices are low and fewer when they are high.',
    href: 'https://www.investopedia.com/terms/d/dollarcostaveraging.asp',
  },
  lumpSum: { label: 'Lump sum', text: 'Investing all of your money at once, on day one.' },
  compound: {
    label: 'Compound growth',
    text: 'Growth on top of growth: what your money earns starts earning too, so the earliest money grows the most.',
    href: 'https://www.investopedia.com/terms/c/compoundinterest.asp',
  },
  fourPercent: {
    label: '4% rule',
    text: 'A planning rule of thumb: in retirement you can spend about 4% of your savings a year, so you need about 25 times what you spend in a year.',
    href: 'https://www.investopedia.com/terms/f/four-percent-rule.asp',
  },
  inflation: {
    label: 'Inflation',
    text: 'Prices rising over time, so the same money buys a little less every year.',
    href: 'https://www.investopedia.com/terms/i/inflation.asp',
  },
  cpi: {
    label: 'CPI',
    text: 'The consumer price index: the price of a typical basket of things people buy, tracked every year to measure inflation.',
    href: 'https://www.investopedia.com/terms/c/consumerpriceindex.asp',
  },
  indexFund: {
    label: 'Index fund',
    text: 'One fund that holds every company in an index, like the S&P 500, so you own a small slice of all of them.',
    href: 'https://www.investopedia.com/terms/i/indexfund.asp',
  },
  cagr: {
    label: 'Average yearly growth',
    text: 'The steady yearly rate that would turn the starting amount into the final one (CAGR). Real years go up and down around it.',
    href: 'https://www.investopedia.com/terms/c/cagr.asp',
  },
  projection: { label: 'Projection', text: 'The past trend carried forward. A guide, not a promise: the future can be better or worse.' },
  emergencyFund: {
    label: 'Emergency fund',
    text: 'Three to six months of expenses kept safe and easy to reach, for a job loss or a hospital bill.',
    href: 'https://www.investopedia.com/terms/e/emergency_fund.asp',
  },
  timeDeposit: {
    label: 'Time deposit',
    text: 'Money left in the bank for a fixed term, like 6 or 12 months, for a higher rate than a regular savings account.',
    href: 'https://www.investopedia.com/terms/t/timedeposit.asp',
  },
  withholdingTax: {
    label: '20% withholding tax',
    text: 'In the Philippines, the bank keeps 20% of the interest a deposit earns as tax before you receive it.',
    href: 'https://www.investopedia.com/terms/w/withholdingtax.asp',
  },
  pdic: {
    label: 'PDIC insurance',
    text: 'The Philippine Deposit Insurance Corporation covers up to ₱1,000,000 per depositor, per bank, if a bank closes.',
    href: 'https://www.pdic.gov.ph/',
  },
  budgetRule: {
    label: '50/30/20',
    text: 'A starting split for take-home pay: 50% for needs, 30% for wants and 20% for savings or paying down debt.',
    href: 'https://www.investopedia.com/ask/answers/022916/what-502030-budget-rule.asp',
  },
  needs: { label: 'Needs', text: 'Bills you must pay to live and work: rent, food, power, water, transport.' },
  wants: { label: 'Wants', text: 'Nice to have: eating out, shopping, streaming, trips.' },
  savings: { label: 'Savings', text: 'Money for future you: an emergency fund, investing, paying debt early.' },
  assets: {
    label: 'Assets',
    text: 'What you own that has value: cash, equipment, money others owe you.',
    href: 'https://www.investopedia.com/terms/a/asset.asp',
  },
  liabilities: {
    label: 'Liabilities',
    text: 'What you owe others: loans, unpaid bills.',
    href: 'https://www.investopedia.com/terms/l/liability.asp',
  },
  equity: {
    label: 'Equity',
    text: 'What is left for the owners after paying everything you owe: assets minus liabilities. Non-profits call it net assets.',
    href: 'https://www.investopedia.com/terms/e/equity.asp',
  },
  netIncome: {
    label: 'Net income',
    text: 'Profit: everything earned minus everything spent in the period.',
    href: 'https://www.investopedia.com/terms/n/netincome.asp',
  },
  diversification: {
    label: 'Diversification',
    text: 'Spreading money across many companies and markets, so one bad one hurts less.',
    href: 'https://www.investopedia.com/terms/d/diversification.asp',
  },
} satisfies Record<string, { label: string; text: string; href?: string }>

export type TermId = keyof typeof TERMS
