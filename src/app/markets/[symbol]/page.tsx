import { normalizeSymbol } from '@/app/features/markets/api/symbol'
import { SymbolPage } from '@/app/features/markets/pages/symbol.page'

export async function generateMetadata({ params }: { params: Promise<{ symbol: string }> }) {
  return { title: normalizeSymbol((await params).symbol) }
}

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
  return <SymbolPage symbol={normalizeSymbol((await params).symbol)} />
}
