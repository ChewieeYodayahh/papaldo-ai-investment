'use client'

import { usePathname } from 'next/navigation'

import { useCopy } from '@/app/features/preferences/copy'

import { titleFor } from '../titles'

/** The page name for the signed-out frame, which has no app header to carry it. */
export function PageTitle() {
  const t = useCopy()
  const title = titleFor(usePathname())
  if (title === 'greeting') return null
  return <h1 className="mb-4 text-xl font-medium tracking-tight lg:text-[1.625rem]">{t(title)}</h1>
}
