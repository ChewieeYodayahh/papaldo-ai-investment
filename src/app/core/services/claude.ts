import 'server-only'

import { GoogleGenAI } from '@google/genai'

/**
 * Thin server-only wrapper around the AI service.
 * Now targeting Gemini 2.5 Flash as the primary adapter.
 */

export type Message = {
  role: 'user' | 'assistant'
  content: string
}

export type AIRequest = {
  messages: Message[]
  system?: string
  model?: string
  maxTokens?: number
}

export type AIAdapterResponse = {
  text: string
}

export type AIAdapterParams = {
  messages: Message[]
  system?: string
  maxTokens?: number
}

/**
 * Session context monitor to enforce the 95% token window halt rule.
 * Prevents runaway token consumption by halting coding when threshold is reached.
 */
export class ContextWindowExceededError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ContextWindowExceededError'
  }
}

export class SessionContextMonitor {
  private maxTokens: number
  private usedTokens: number = 0

  constructor(maxTokens: number = 200000) {
    this.maxTokens = maxTokens
  }

  /**
   * Add token usage to the session counter.
   * @param tokens Number of tokens to add
   */
  addUsage(tokens: number): void {
    if (tokens < 0) {
      throw new Error('Token usage cannot be negative')
    }
    this.usedTokens += tokens
  }

  /**
   * Check if the session has exceeded 95% of the token window.
   * @throws ContextWindowExceededError when threshold is reached
   */
  check(): void {
    const usagePercent = this.usagePercent()
    if (usagePercent >= 0.95) {
      throw new ContextWindowExceededError(
        `Session context window exceeded ${Math.round(usagePercent * 100)}% threshold. ` +
        `Used ${this.usedTokens}/${this.maxTokens} tokens. ` +
        `Stop coding immediately and document progress.`
      )
    }
  }

  /**
   * Get remaining tokens in the window.
   */
  remaining(): number {
    return Math.max(0, this.maxTokens - this.usedTokens)
  }

  /**
   * Get usage percentage (0.0 to 1.0).
   */
  usagePercent(): number {
    return this.usedTokens / this.maxTokens
  }

  /**
   * Reset the session counter.
   */
  reset(): void {
    this.usedTokens = 0
  }
}

/**
 * Adapter interface for LLM providers.
 * Concrete adapters implement the generate contract.
 */
export interface AIAdapter {
  generate(params: AIAdapterParams): Promise<AIAdapterResponse>
}

/**
 * Gemini adapter using @google/genai SDK targeting gemini-2.5-flash.
 */
export class GeminiAdapter implements AIAdapter {
  private apiKey: string
  private model: string

  constructor(model = 'gemini-2.5-flash') {
    this.apiKey = process.env.GEMINI_API_KEY || ''
    this.model = model
    if (!this.apiKey) {
      console.warn('WARNING: GEMINI_API_KEY not set. Gemini adapter will fail.')
    }
  }

  async generate(params: AIAdapterParams): Promise<AIAdapterResponse> {
    if (!this.apiKey) {
      throw new Error('Missing GEMINI_API_KEY. AI features are not configured.')
    }

    const ai = new GoogleGenAI({ apiKey: this.apiKey })
    
    const response = await ai.models.generateContent({
      model: this.model,
      contents: params.messages.map(m => m.content).join('\n'),
      config: {
        systemInstruction: params.system,
        maxOutputTokens: params.maxTokens,
      },
    })

    const text = response.text || ''
    return { text }
  }
}

/**
 * Creates the primary AI adapter instance.
 * The secondary slot is typed but intentionally undefined —
 * wired for future provider without dead code.
 */
export function createAdapter(model?: string): {
  primary: AIAdapter
  secondary: AIAdapter | undefined
} {
  const primary = new GeminiAdapter(model)
  return {
    primary,
    secondary: undefined,
  }
}

/**
 * Sends a message to Gemini 2.5 Flash via the primary adapter
 * and returns the concatenated text content.
 * Signature preserved to avoid breaking advisory route.
 */
export async function createMessage({
  messages,
  system,
  model = 'gemini-2.5-flash',
  maxTokens = 1024,
}: AIRequest): Promise<string> {
  // `model` used to be accepted and silently dropped; the adapter now honours it.
  const { primary } = createAdapter(model)

  const response = await primary.generate({
    messages,
    system,
    maxTokens,
  })

  return response.text
}
