import { T, type CopyKey } from '@/app/features/userData/preferences/copy'

const FOOTER_COLUMNS = [
  {
    title: 'land.foot.product',
    links: [
      // Absolute (`/#…`), so they also work from /privacy and /how-its-built.
      { href: '/#how-it-works', label: 'pub.how' },
      { href: '/markets', label: 'pub.markets' },
      { href: '/tools', label: 'nav.tools' },
      { href: '/#faq', label: 'pub.faq' },
    ],
  },
  {
    title: 'land.foot.company',
    links: [
      { href: '/#trust', label: 'land.foot.about' },
      { href: '/how-its-built', label: 'pub.built' },
      { href: '/community', label: 'nav.community' },
      { href: '/blog', label: 'land.foot.blog' },
      { href: '/support', label: 'land.foot.support' },
    ],
  },
  {
    title: 'land.foot.legal',
    links: [
      { href: '/privacy', label: 'land.foot.privacy' },
      { href: '#', label: 'land.foot.terms' },
      { href: '/privacy#cookies', label: 'land.foot.cookies' },
    ],
  },
] as const satisfies ReadonlyArray<{ title: CopyKey; links: ReadonlyArray<{ href: string; label: CopyKey }> }>

export function Footer() {
  return (
    <footer className="border-t border-border bg-street">
      <div className="mx-auto max-w-6xl px-4 py-12 md:px-6">
        <div className="grid gap-10 sm:grid-cols-[minmax(0,1.2fr)_repeat(3,minmax(0,1fr))]">
          <div>
            <p className="text-[0.9375rem] font-semibold tracking-[0.22em]">PAPALDO KA</p>
            <p className="mt-3 max-w-xs text-sm text-pretty text-muted-foreground">
              <T k="land.foot.tagline" />
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="mb-4 text-sm font-semibold"><T k={column.title} /></h3>
              <ul className="space-y-2">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href} className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                      <T k={link.label} />
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
