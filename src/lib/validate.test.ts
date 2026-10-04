import { describe, expect, it } from 'vitest'
import { parseJsonLoose, validateParsedTasks, validatePlanItems, validateSteps } from './validate'

describe('parseJsonLoose', () => {
  it('parses plain JSON', () => {
    expect(parseJsonLoose('{"a":1}')).toEqual({ a: 1 })
  })
  it('parses fenced JSON', () => {
    expect(parseJsonLoose('```json\n{"a":2}\n```')).toEqual({ a: 2 })
  })
  it('strips leading prose', () => {
    expect(parseJsonLoose('Sure! Here you go:\n{"a":3} Hope that helps')).toEqual({ a: 3 })
  })
  it('returns null on garbage', () => {
    expect(parseJsonLoose('not json at all')).toBeNull()
    expect(parseJsonLoose('')).toBeNull()
  })
})

describe('validateParsedTasks', () => {
  it('accepts well-formed tasks', () => {
    const out = validateParsedTasks({
      tasks: [{ title: 'Essay', deadline: '2026-10-05', estimatedMinutes: 60, priority: 'high', description: '' }],
    })
    expect(out).toHaveLength(1)
    expect(out[0].title).toBe('Essay')
  })
  it('drops items without titles and coerces bad fields', () => {
    const out = validateParsedTasks({
      tasks: [
        { title: '', estimatedMinutes: 30 },
        { nope: true },
        { title: 'Quiz', estimatedMinutes: '45', priority: 'extreme', deadline: 'tomorrow' },
      ],
    })
    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ title: 'Quiz', estimatedMinutes: 45, priority: 'medium', deadline: '' })
  })
  it('returns empty for non-objects', () => {
    expect(validateParsedTasks(null)).toEqual([])
    expect(validateParsedTasks('[]')).toEqual([])
  })
})

describe('validatePlanItems', () => {
  it('validates and keeps taskId when present', () => {
    const out = validatePlanItems({ items: [{ title: 'A', durationMinutes: 30, note: '', taskId: 'x' }] })
    expect(out[0].taskId).toBe('x')
  })
  it('filters invalid items', () => {
    expect(validatePlanItems({ items: [{ durationMinutes: 10 }, null, { title: 'B' }] })).toHaveLength(1)
  })
})

describe('validateSteps', () => {
  it('keeps only non-empty strings', () => {
    expect(validateSteps({ steps: ['a', '', 3, ' b '] })).toEqual(['a', 'b'])
  })
})
