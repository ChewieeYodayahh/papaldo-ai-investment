/**
 * The white pill toggles from the mockups (Gainers / Losers, 1D ... MAX),
 * as class overrides on the shadcn Tabs primitive rather than a second tab
 * component. Active pills take the secondary token -- near-white in dark
 * mode -- and inactive ones a faint wash of it.
 */
export const PILL_LIST = 'h-auto! gap-2 bg-transparent p-0'

export const PILL_TRIGGER =
  'h-7 flex-none rounded-full border-0 bg-secondary/15 px-3 text-xs text-foreground/80 hover:text-foreground data-active:bg-secondary! data-active:text-secondary-foreground! data-active:shadow-none dark:text-foreground/80'
