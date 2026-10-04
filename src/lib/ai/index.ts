import { MockAIClient } from './mock'
import { OllamaClient, ollamaAvailable } from './ollama'
import type { AIClient, AIStatus } from './types'

let client: AIClient = new MockAIClient()
let status: AIStatus = client.status

export function getAI(): AIClient {
  return client
}

export function getAIStatus(): AIStatus {
  return status
}

/** Try to connect to a local Ollama server; fall back to demo mode. */
export async function detectAI(): Promise<AIStatus> {
  const check = await ollamaAvailable()
  if (check.ok && check.detail.includes('is available')) {
    client = new OllamaClient(check.detail)
  } else {
    client = new MockAIClient()
    client.status = { mode: 'demo', model: 'demo-mode', detail: check.detail }
  }
  status = client.status
  return status
}
