/**
 * Everything Papaldo is built with (2026-10-02, /how-its-built): the app's
 * libraries, the services it calls, the pipelines, the AI and MCP servers
 * used to build it, and the tools around them. Kept in step with
 * package.json and EXTERNAL_SERVICES.md; a service the app no longer uses
 * comes off this list.
 *
 * Audited 2026-10-02 (Carlos: only what is really used right now). Taken off:
 * Alpha Vantage and its MCP (no fund data yet, 18 MCP calls ever), Cloudinary
 * (no keys, no uploads), GSAP and Motion (only in components nothing renders),
 * the shadcn MCP (3 calls), Claude Code Security Review (runs on pull
 * requests; one merge in 34 commits), Prettier and uv (no script, one-off
 * setup). Evidence: integration_logs, live table counts, session tool calls.
 *
 * Logos load from a CDN in the visitor's browser: Simple Icons where it has
 * the brand, otherwise the site's own favicon through Google's favicon
 * service (the same one the savings tool uses for bank logos).
 */

export type Logo =
  /** A Simple Icons slug. `mono`: a black mark, inverted to white in dark mode. */
  | { icon: string; mono?: boolean }
  /** No Simple Icons mark: the site's favicon. */
  | { site: string }

export type StackItem = { name: string; role: string; href: string; logo: Logo }
export type StackGroup = { id: string; title: string; blurb: string; items: StackItem[] }

export function logoUrl(logo: Logo): string {
  if ('site' in logo) return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(logo.site)}&sz=128`
  return `https://cdn.simpleicons.org/${logo.icon}${logo.mono ? '/black' : ''}`
}

export const STACK: StackGroup[] = [
  {
    id: 'app',
    title: 'The app',
    blurb: 'What every page is made of.',
    items: [
      { name: 'Next.js 15', role: 'Pages, server rendering and the API routes', href: 'https://nextjs.org', logo: { icon: 'nextdotjs', mono: true } },
      { name: 'React 19', role: 'Every screen and component', href: 'https://react.dev', logo: { icon: 'react' } },
      { name: 'TypeScript', role: 'Types across the app, the database included', href: 'https://www.typescriptlang.org', logo: { icon: 'typescript' } },
      { name: 'Tailwind CSS v4', role: 'Styling, themes and the colour palettes', href: 'https://tailwindcss.com', logo: { icon: 'tailwindcss' } },
      { name: 'shadcn/ui', role: 'Buttons, dialogs, menus and forms', href: 'https://ui.shadcn.com', logo: { icon: 'shadcnui', mono: true } },
      { name: 'Base UI', role: 'The accessible parts under shadcn/ui', href: 'https://base-ui.com', logo: { site: 'base-ui.com' } },
      { name: 'Zustand', role: 'Your display settings: theme, currency, language', href: 'https://zustand.docs.pmnd.rs', logo: { site: 'pmnd.rs' } },
      { name: 'Zod', role: 'Checks every form and API request', href: 'https://zod.dev', logo: { icon: 'zod' } },
      { name: 'Lucide', role: 'The icons', href: 'https://lucide.dev', logo: { icon: 'lucide' } },
      { name: 'Google Fonts', role: 'Archivo, the landing page type', href: 'https://fonts.google.com/specimen/Archivo', logo: { icon: 'googlefonts' } },
    ],
  },
  {
    id: 'charts',
    title: 'Charts',
    blurb: 'How prices and plans are drawn.',
    items: [
      { name: 'Lightweight Charts', role: 'Price charts on every company page', href: 'https://www.tradingview.com/lightweight-charts/', logo: { icon: 'tradingview', mono: true } },
      { name: 'Recharts', role: 'Portfolio performance and the calculators', href: 'https://recharts.org', logo: { site: 'recharts.org' } },
      { name: 'D3', role: 'Lays out the sector heatmap', href: 'https://d3js.org', logo: { icon: 'd3' } },
    ],
  },
  {
    id: 'data',
    title: 'Accounts and data',
    blurb: 'Where your practice account lives, and who can see it.',
    items: [
      { name: 'Supabase', role: 'Accounts, sign-in and the database, with row-level security on every table', href: 'https://supabase.com', logo: { icon: 'supabase' } },
      { name: 'PostgreSQL', role: 'The database under Supabase; orders run as one transaction', href: 'https://www.postgresql.org', logo: { icon: 'postgresql' } },
      { name: 'Google sign-in', role: 'One-tap sign-in, handled by Supabase Auth', href: 'https://developers.google.com/identity', logo: { icon: 'google' } },
    ],
  },
  {
    id: 'apis',
    title: 'Market data',
    blurb: 'Real prices and real companies, from these sources.',
    items: [
      { name: 'Alpaca', role: 'Live US stock and fund prices', href: 'https://alpaca.markets', logo: { site: 'alpaca.markets' } },
      { name: 'Finnhub', role: 'Market news and company profiles', href: 'https://finnhub.io', logo: { site: 'finnhub.io' } },
      { name: 'ExchangeRate-API', role: 'The dollar-to-peso rate for the ₱ toggle', href: 'https://www.exchangerate-api.com', logo: { site: 'exchangerate-api.com' } },
      { name: 'Financial Modeling Prep', role: 'Company logos', href: 'https://site.financialmodelingprep.com', logo: { site: 'financialmodelingprep.com' } },
      { name: 'Yahoo Finance', role: 'Index history and company sizes, weekly', href: 'https://finance.yahoo.com', logo: { site: 'finance.yahoo.com' } },
      { name: 'Stooq', role: "The PSEi's history", href: 'https://stooq.com', logo: { site: 'stooq.com' } },
    ],
  },
  {
    id: 'ops',
    title: 'Pipelines and hosting',
    blurb: 'What runs behind the scenes, and where the site lives.',
    items: [
      { name: 'Vercel', role: 'Hosts the site', href: 'https://vercel.com', logo: { icon: 'vercel', mono: true } },
      { name: 'GitHub', role: 'The code and its history', href: 'https://github.com', logo: { icon: 'github', mono: true } },
      { name: 'GitHub Actions', role: 'Checks every change; refreshes market data every Sunday', href: 'https://github.com/features/actions', logo: { icon: 'githubactions' } },
      { name: 'Python', role: 'The weekly market-data pipelines', href: 'https://www.python.org', logo: { icon: 'python' } },
      { name: 'pandas', role: 'Cleans the index and company data', href: 'https://pandas.pydata.org', logo: { icon: 'pandas', mono: true } },
    ],
  },
  {
    id: 'ai',
    title: 'AI and MCP servers',
    blurb: 'The assistant that helped build Papaldo, and the servers it worked through. None of them run inside the app.',
    items: [
      {
        name: 'Claude Code',
        role: "Anthropic's coding agent, running Claude. It wrote and checked much of the code alongside David, who planned each feature and made every call.",
        href: 'https://www.anthropic.com/claude-code',
        logo: { icon: 'claude' },
      },
      { name: "Claude's browser", role: 'Checks every changed page at phone and desktop sizes, in light and dark', href: 'https://claude.com/download', logo: { icon: 'claude' } },
      { name: 'Model Context Protocol', role: 'How Claude reaches the services below while building', href: 'https://modelcontextprotocol.io', logo: { icon: 'modelcontextprotocol', mono: true } },
      { name: 'Supabase MCP', role: 'Database changes, types and security advisors', href: 'https://supabase.com/docs/guides/getting-started/mcp', logo: { icon: 'supabase' } },
      { name: 'Vercel MCP', role: 'Deployments and logs', href: 'https://vercel.com/docs/mcp', logo: { icon: 'vercel', mono: true } },
    ],
  },
  {
    id: 'tools',
    title: 'Development tools',
    blurb: 'The workbench.',
    items: [
      { name: 'Node.js', role: 'Runs the app and the build', href: 'https://nodejs.org', logo: { icon: 'nodedotjs' } },
      { name: 'npm', role: 'Packages and scripts', href: 'https://www.npmjs.com', logo: { icon: 'npm' } },
      { name: 'Git', role: 'Version control', href: 'https://git-scm.com', logo: { icon: 'git' } },
      { name: 'ESLint', role: 'Catches mistakes before they ship', href: 'https://eslint.org', logo: { icon: 'eslint' } },
      { name: 'Vitest', role: 'The unit tests', href: 'https://vitest.dev', logo: { icon: 'vitest' } },
      { name: 'Remotion', role: 'Renders the real app into the landing page screens', href: 'https://www.remotion.dev', logo: { site: 'remotion.dev' } },
      { name: 'Obsidian', role: 'The research notes and API docs behind each feature', href: 'https://obsidian.md', logo: { icon: 'obsidian' } },
    ],
  },
]
