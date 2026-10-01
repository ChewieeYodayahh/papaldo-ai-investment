import { Archivo } from 'next/font/google'

/**
 * The landing page's display face (2026-10-02): Archivo, with its width axis.
 * Expanded for headlines, the way the lettering on Ayala's towers reads;
 * condensed with tabular figures for the street ticker. Body text stays in
 * the app's Figtree, so the landing page and the app read as one product.
 * Loaded on the landing page only.
 */
export const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-archivo',
  display: 'swap',
})
