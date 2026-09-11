import 'server-only'

import { cache } from 'react'

import { createClient } from '@/app/core/services/supabase/server'
import { createMessage, SessionContextMonitor } from '@/app/core/services/claude'
import { getSymbolNewsForAnalysis, type NewsItem } from '@/app/features/markets/api/news'
import { getQuotes, type Quote } from '@/app/features/markets/api/quotes'

export type ModelPortfolio = {
  symbol: string
  targetWeight: number
  method: string
}

export type MarketOutlook = {
  riskBand: 'Low' | 'Medium' | 'High'
  asOfDate: string
  outlookText: string
  modelUsed: string
  contextPct: number
}

const MONITOR = new SessionContextMonitor(200000)

export const getModelPortfolios = cache(async (): Promise<Map<string, ModelPortfolio[]>> => {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data } = await supabase
    .from('model_portfolios')
    .select('risk_band, symbol, target_weight, method')
    .eq('as_of_date', today)
    .order('risk_band')
  
  const map = new Map<string, ModelPortfolio[]>()
  for (const row of data ?? []) {
    const band = row.risk_band as 'Low' | 'Medium' | 'High'
    const existing = map.get(band) ?? []
    existing.push({
      symbol: row.symbol,
      targetWeight: row.target_weight,
      method: row.method,
    })
    map.set(band, existing)
  }
  return map
})

export const getCachedOutlook = cache(async (riskBand: string): Promise<MarketOutlook | null> => {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  
  const { data } = await supabase
    .from('market_outlooks')
    .select('risk_band, as_of_date, outlook_text, model_used, context_pct')
    .eq('risk_band', riskBand)
    .eq('as_of_date', today)
    .maybeSingle()
  
  if (!data) return null
  
  return {
    riskBand: data.risk_band as 'Low' | 'Medium' | 'High',
    asOfDate: data.as_of_date,
    outlookText: data.outlook_text,
    modelUsed: data.model_used,
    contextPct: data.context_pct,
  }
})

export async function generateOutlook(riskBand: string): Promise<MarketOutlook> {
  const modelPortfolios = await getModelPortfolios()
  const portfolios = modelPortfolios.get(riskBand) ?? []
  
  if (portfolios.length === 0) {
    throw new Error('No model portfolio found for risk band: ' + riskBand)
  }
  
  const topSymbols = portfolios.slice(0, 5).map(p => p.symbol)
  const newsMap = new Map<string, NewsItem[]>()
  for (const symbol of topSymbols) {
    const news = await getSymbolNewsForAnalysis(symbol)
    if (news.ok) {
      newsMap.set(symbol, news.data)
    }
  }
  
  const quotesResult = await getQuotes(topSymbols)
  const quotesMap = new Map<string, Quote>()
  if (quotesResult.ok) {
    for (const quote of quotesResult.data) {
      quotesMap.set(quote.symbol, quote)
    }
  }
  
  const portfolioText = portfolios.map(p => 
    p.symbol + ': ' + (p.targetWeight * 100).toFixed(1) + '% (' + p.method + ')'
  ).join('\n')
  
  const newsText = Array.from(newsMap.entries()).map(([symbol, items]) => {
    const headlines = items.map(i => '- ' + i.headline).join('\n')
    return symbol + ':\n' + headlines
  }).join('\n\n')
  
  const prompt = 'You are an AI investment advisor for Filipino investors. Analyze the market outlook for the ' + riskBand + ' risk band portfolio.\n\nTop holdings:\n' + portfolioText + '\n\nRecent news:\n' + (newsText || 'No recent news available.') + '\n\nProvide a concise, actionable market outlook (2-3 paragraphs) that explains:\n1. Overall market sentiment for this risk profile\n2. Key opportunities and risks in the current holdings\n3. One practical action item for investors in this band\n\nKeep it under 300 words. Use simple language suitable for beginner investors.'

  MONITOR.check()

  const responseText = await createMessage({
    messages: [{ role: 'user', content: prompt }],
    maxTokens: 1024,
  })

  const promptTokens = Math.ceil(prompt.length / 4)
  const responseTokens = Math.ceil(responseText.length / 4)
  MONITOR.addUsage(promptTokens + responseTokens)

  await cacheOutlook(riskBand, responseText, MONITOR.usagePercent())

  return {
    riskBand: riskBand as 'Low' | 'Medium' | 'High',
    asOfDate: new Date().toISOString().split('T')[0],
    outlookText: responseText,
    modelUsed: 'gemini-2.5-flash',
    contextPct: MONITOR.usagePercent(),
  }
}

async function cacheOutlook(riskBand: string, text: string, contextPct: number) {
  const supabase = await createClient()
  const today = new Date().toISOString().split('T')[0]
  
  await supabase
    .from('market_outlooks')
    .upsert({
      risk_band: riskBand,
      as_of_date: today,
      outlook_text: text,
      model_used: 'gemini-2.5-flash',
      context_pct: contextPct,
    }, { onConflict: 'risk_band,as_of_date' })
}

