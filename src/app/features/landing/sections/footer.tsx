const FOOTER_COLUMNS = [
  {
    title: 'Product',
    links: [
      { href: '#how-it-works', label: 'How it works' },
      { href: '/markets', label: 'Markets' },
      { href: '/tools', label: 'Tools' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
  {
    title: 'Company',
    links: [
      { href: '#trust', label: 'About' },
      { href: '/community', label: 'Community' },
      { href: '/blog', label: 'Blog' },
      { href: '/support', label: 'Contact support' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { href: '#', label: 'Privacy' },
      { href: '#', label: 'Terms' },
      { href: '#', label: 'Cookie policy' },
    ],
  },
] as const

export function Footer() {
  return (
    <footer className="border-t border-border bg-street">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <p className="text-[0.9375rem] font-semibold tracking-[0.22em]">PAPALDO KA</p>
            <p className="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
              A practice stock market for Filipino first-time investors.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold">{column.title}</h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© 2026 Papaldo. Practice only: not investment advice, and no real money moves.</p>
          <a href="mailto:hello@papaldo.ph" className="hover:text-foreground">
            hello@papaldo.ph
          </a>
        </div>
      </div>
    </footer>
  )
}
