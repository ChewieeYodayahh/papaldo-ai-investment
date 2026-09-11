import { NextResponse } from 'next/server'
import { SessionContextMonitor, ContextWindowExceededError } from '@/app/core/services/claude'
import { getCachedOutlook, generateOutlook } from '@/app/features/advisory/api/outlook'

export const dynamic = 'force-dynamic'

const monitor = new SessionContextMonitor(200000)

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const riskBand = searchParams.get('risk_band') || 'Medium'
  
  if (!['Low', 'Medium', 'High'].includes(riskBand)) {
    return NextResponse.json(
      { success: false, error: 'Invalid risk band. Must be Low, Medium, or High.' },
      { status: 400 }
    )
  }
  
  try {
    monitor.check()
    
    const cached = await getCachedOutlook(riskBand)
    if (cached) {
      return NextResponse.json({
        success: true,
        data: cached.outlookText,
        cached: true,
        contextUsagePercent: cached.contextPct,
        timestamp: new Date().toISOString(),
      })
    }
    
    const result = await generateOutlook(riskBand)
    
    return NextResponse.json({ 
      success: true, 
      data: result.outlookText,
      cached: false,
      contextUsagePercent: result.contextPct,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof ContextWindowExceededError) {
      console.error('Context window threshold reached:', error.message)
      return NextResponse.json(
        { success: false, error: error.message, code: 'CONTEXT_WINDOW_EXCEEDED' },
        { status: 507 }
      )
    }
    
    console.error('Advisory error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate advisory' },
      { status: 500 }
    )
  }
}

