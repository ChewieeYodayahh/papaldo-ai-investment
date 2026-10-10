import { redirect } from 'next/navigation'

import { getExportData } from '../api/data'
import { ExportBuilder } from '../components/ExportBuilder'
import { T } from '@/app/features/userData/preferences/copy'

/** `/tools/export` -- build a CSV or HTML report of your own data, entirely in the browser. */
export async function ExportPage() {
  const data = await getExportData()
  if (!data) redirect('/login')

  return (
    <>
      <p className="mb-4 max-w-3xl text-[0.8125rem] text-muted-foreground">
        <T k="exp.intro" />
      </p>
      <ExportBuilder data={data} />
    </>
  )
}
