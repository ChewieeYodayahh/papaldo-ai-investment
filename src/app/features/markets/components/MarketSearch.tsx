'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useId, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Command, CommandEmpty, CommandItem, CommandList } from '@/components/ui/command'
import { Spinner } from '@/components/ui/spinner'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import type { SearchHit } from '../api/search'
import { SymbolMark } from './SymbolMark'

const DEBOUNCE_MS = 200

/**
 * The /markets search bar (Carlos, 2026-09-30): every asset Papaldo can show,
 * by ticker or name, with a "Trade now…" hint that types itself out while the
 * box is empty. Results come from /api/markets/search -- Papaldo's buyable
 * names first -- and Enter or a click opens the asset's trade page.
 *
 * cmdk's Command supplies the listbox semantics and arrow-key navigation; with
 * `shouldFilter={false}` it only presents what the server ranked.
 */
export function MarketSearch() {
  const t = useCopy()
  const router = useRouter()
  const listId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<SearchHit[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const needle = query.trim()
    if (!needle) {
      setHits([])
      setLoading(false)
      return
    }
    setLoading(true)
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/markets/search?q=${encodeURIComponent(needle)}`, { signal: controller.signal })
        const payload = (await response.json()) as { ok: boolean; hits?: SearchHit[] }
        setHits(payload.hits ?? [])
      } catch (error) {
        if ((error as DOMException)?.name !== 'AbortError') setHits([])
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }, DEBOUNCE_MS)
    return () => {
      window.clearTimeout(timer)
      controller.abort()
    }
  }, [query])

  const go = (symbol: string) => {
    setOpen(false)
    setQuery('')
    router.push(`/markets/${encodeURIComponent(symbol)}`)
  }

  const showList = open && query.trim().length > 0

  return (
    <Command
      shouldFilter={false}
      loop
      className="relative overflow-visible rounded-2xl! bg-transparent p-0"
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          setOpen(false)
          inputRef.current?.blur()
        }
      }}
    >
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden />
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => window.setTimeout(() => setOpen(false), 120)}
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-label={t('mkt.searchLabel')}
          autoComplete="off"
          spellCheck={false}
          className="peer h-12 w-full rounded-2xl border border-border bg-card pr-11 pl-12 text-base shadow-sm transition-colors outline-none placeholder:text-transparent focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30"
          placeholder={t('mkt.searchPlaceholder')}
        />
        {/* The typing hint: pure CSS, hidden once there is text, and static for reduced motion. */}
        {!query ? (
          <span
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-12 -translate-y-1/2 overflow-hidden text-base whitespace-nowrap text-muted-foreground"
          >
            <span className="search-hint inline-block">{t('mkt.searchPlaceholder')}</span>
          </span>
        ) : null}
        {loading ? (
          <Spinner className="absolute top-1/2 right-4 size-4 -translate-y-1/2 text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              inputRef.current?.focus()
            }}
            aria-label={t('mkt.heatmapClear')}
            className="absolute top-1/2 right-3 grid size-7 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        ) : null}
      </div>

      {showList ? (
        <CommandList
          id={listId}
          className="absolute top-full right-0 left-0 z-40 mt-2 max-h-96 rounded-2xl border border-border bg-popover p-1.5 shadow-xl"
        >
          {!loading ? <CommandEmpty>{t('mkt.searchEmpty')}</CommandEmpty> : null}
          {hits.map((hit) => (
            <CommandItem
              key={hit.symbol}
              value={hit.symbol}
              onSelect={() => go(hit.symbol)}
              onMouseDown={(event) => event.preventDefault()}
              className="gap-3 rounded-xl px-2.5 py-2"
            >
              <SymbolMark symbol={hit.symbol} className="size-8" />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-2">
                  <span className="font-semibold">{hit.symbol}</span>
                  {hit.papaldo ? (
                    <Badge className="rounded-full bg-primary/15 px-1.5 text-[0.625rem] text-primary">{t('mkt.searchPapaldo')}</Badge>
                  ) : null}
                </span>
                <span className={cn('block truncate text-xs text-muted-foreground')}>{hit.name}</span>
              </span>
              {hit.sector && hit.sector !== 'ETF' ? <span className="text-xs text-muted-foreground">{hit.sector}</span> : null}
              {hit.sector === 'ETF' ? <span className="text-xs text-muted-foreground">ETF</span> : null}
            </CommandItem>
          ))}
        </CommandList>
      ) : null}
    </Command>
  )
}
