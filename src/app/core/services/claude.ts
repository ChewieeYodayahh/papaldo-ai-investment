import 'server-only'

/**
 * Thin server-only wrapper around the Claude API.
 *
 * INTENTIONALLY UNUSED IN THIS PHASE. Risk profiling is fully deterministic --
 * see `features/onboarding/scoring.ts` -- so nothing here is called yet and the app
 * builds and runs without an ANTHROPIC_API_KEY. This module exists so the
 * later phases (portfolio recommendations, plain-language profile narratives)
 * have one place to add the integration rather than scattering fetch calls
 * through route handlers.
 */

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const DEFAULT_MODEL = 'claude-sonnet-5'

export type ClaudeMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ClaudeRequest = {
  messages: ClaudeMessage[]
  system?: string
  model?: string
  maxTokens?: number
}

/**
 * Sends a message to Claude and returns the concatenated text content.
 *
 * Throws if ANTHROPIC_API_KEY is absent, so a caller added in a later phase
 * fails loudly during development rather than silently degrading.
 */
export async function createMessage({
  messages,
  system,
  model = DEFAULT_MODEL,
  maxTokens = 1024,
}: ClaudeRequest): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    throw new Error('Missing ANTHROPIC_API_KEY. Claude features are not configured.')
  }

  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: maxTokens, system, messages }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error ${response.status}: ${await response.text()}`)
  }

  const payload = (await response.json()) as {
    content: Array<{ type: string; text?: string }>
  }

  return payload.content
    .filter((block) => block.type === 'text')
    .map((block) => block.text ?? '')
    .join('')
}
