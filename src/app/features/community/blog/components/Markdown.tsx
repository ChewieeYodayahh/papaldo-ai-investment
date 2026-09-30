import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

import { cn } from '@/lib/utils'

/**
 * Article bodies are Markdown. react-markdown builds React elements, not raw
 * HTML, so an article cannot inject scripts; `rehype-raw` is deliberately not
 * installed. Links to other sites open in a new tab.
 */
export function Markdown({ source, className }: { source: string; className?: string }) {
  return (
    <div className={cn('space-y-4 text-[0.9875rem] leading-7 text-foreground/90', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h2 className="pt-2 text-2xl font-semibold tracking-tight text-foreground">{children}</h2>,
          h2: ({ children }) => <h2 className="pt-2 text-xl font-semibold tracking-tight text-foreground">{children}</h2>,
          h3: ({ children }) => <h3 className="pt-1 text-lg font-semibold text-foreground">{children}</h3>,
          p: ({ children }) => <p>{children}</p>,
          a: ({ href, children }) => {
            const external = href?.startsWith('http')
            return (
              <a
                href={href}
                className="font-medium text-primary underline underline-offset-4"
                {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
              >
                {children}
              </a>
            )
          },
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-6">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-6">{children}</ol>,
          blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/50 pl-4 text-muted-foreground">{children}</blockquote>,
          code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 text-[0.875em]">{children}</code>,
          pre: ({ children }) => <pre className="overflow-x-auto rounded-xl bg-muted p-4 text-sm">{children}</pre>,
          hr: () => <hr className="border-border" />,
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => <th className="border-b border-border px-3 py-2 text-left font-semibold">{children}</th>,
          td: ({ children }) => <td className="border-b border-border/60 px-3 py-2">{children}</td>,
          img: ({ src, alt }) =>
            // eslint-disable-next-line @next/next/no-img-element -- author-supplied remote image of unknown size
            typeof src === 'string' ? <img src={src} alt={alt ?? ''} className="rounded-xl" loading="lazy" /> : null,
        }}
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
