import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'

import type { CpiPoint } from '../inflation'

export type CpiData = { USA: CpiPoint[]; PHL: CpiPoint[] }

/**
 * The yearly consumer price index for both countries, oldest first. Public
 * reference data, like the benchmarks: anon may read it, and python/cpi.py
 * is the only writer.
 */
export const getCpi = cache(async (): Promise<CpiData> => {
  const supabase = await createClient()
  const { data, error } = await supabase.from('cpi_annual').select('country, year, cpi').order('year')
  const result: CpiData = { USA: [], PHL: [] }
  if (error || !data) {
    console.error('[cpi] cpi_annual unavailable:', error?.message)
    return result
  }
  for (const row of data) {
    if (row.country === 'USA' || row.country === 'PHL') result[row.country].push({ year: row.year, cpi: Number(row.cpi) })
  }
  return result
})
