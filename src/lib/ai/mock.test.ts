import { describe, expect, it } from 'vitest'
import { MockAIClient } from './mock'

const client = new MockAIClient()

describe('MockAIClient', () => {
  it('parses a task dump into drafts', async () => {
    const out = await client.parseTaskDump('Finish essay due today\nBuy groceries\nStudy for quiz')
    expect(out.length).toBeGreaterThanOrEqual(2)
    expect(out[0].title.length).toBeGreaterThan(0)
  })

  it('rejects empty dump gracefully by returning empty list or items', async () => {
    const out = await client.parseTaskDump('   ')
    expect(Array.isArray(out)).toBe(true)
  })

  it('breaks down a task into steps', async () => {
    const r = await client.breakdownTask({
      id: '1', title: 'Write history essay', description: '', deadline: '',
      estimatedMinutes: 60, priority: 'high', status: 'todo', createdAt: '', steps: [],
    })
    expect(r.steps.length).toBeGreaterThanOrEqual(4)
    expect(r.source).toBe('demo')
  })

  it('summarizes the day without guilt language', async () => {
    const s = await client.summarizeDay([])
    expect(s.toLowerCase()).not.toContain('lazy')
  })
})
