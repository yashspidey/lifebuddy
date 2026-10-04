import type { EnergyLevel, ParsedTaskDraft, Priority } from '../types'

const PRIORITIES: Priority[] = ['high', 'medium', 'low']
const ENERGIES: EnergyLevel[] = ['low', 'medium', 'high']

export function asPriority(v: unknown, fallback: Priority = 'medium'): Priority {
  return PRIORITIES.includes(v as Priority) ? (v as Priority) : fallback
}

export function asEnergy(v: unknown, fallback: EnergyLevel = 'medium'): EnergyLevel {
  return ENERGIES.includes(v as EnergyLevel) ? (v as EnergyLevel) : fallback
}

export function asMinutes(v: unknown, fallback = 30): number {
  const n = typeof v === 'string' ? Number(v) : v
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0) return fallback
  return Math.min(Math.round(n), 24 * 60)
}

/** Strip a leading/trailing ```json ... ``` fence and parse. Returns null on failure. */
export function parseJsonLoose(text: string): unknown | null {
  if (typeof text !== 'string') return null
  let t = text.trim()
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fence) t = fence[1].trim()
  // grab first { or [ block if there's stray prose
  const firstBrace = Math.min(
    ...['{', '[']
      .map((c) => t.indexOf(c))
      .filter((i) => i >= 0),
  )
  const start = Number.isFinite(firstBrace) ? firstBrace : 0
  const lastEnd = Math.max(t.lastIndexOf('}'), t.lastIndexOf(']'))
  if (lastEnd > start) t = t.slice(start, lastEnd + 1)
  try {
    return JSON.parse(t)
  } catch {
    return null
  }
}

export function validateParsedTasks(value: unknown): ParsedTaskDraft[] {
  if (typeof value !== 'object' || value === null) return []
  const arr = (value as Record<string, unknown>).tasks
  if (!Array.isArray(arr)) return []
  const out: ParsedTaskDraft[] = []
  for (const item of arr) {
    if (typeof item !== 'object' || item === null) continue
    const it = item as Record<string, unknown>
    if (typeof it.title !== 'string' || !it.title.trim()) continue
    out.push({
      title: it.title.trim().slice(0, 200),
      deadline: typeof it.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(it.deadline) ? it.deadline : '',
      estimatedMinutes: asMinutes(it.estimatedMinutes, 30),
      priority: asPriority(it.priority),
      description: typeof it.description === 'string' ? it.description.slice(0, 500) : '',
    })
  }
  return out
}

export interface RawPlanItem {
  title: string
  durationMinutes: number
  note: string
  taskId?: string
}

export function validatePlanItems(value: unknown): RawPlanItem[] {
  if (typeof value !== 'object' || value === null) return []
  const arr = (value as Record<string, unknown>).items
  if (!Array.isArray(arr)) return []
  const out: RawPlanItem[] = []
  for (const item of arr) {
    if (typeof item !== 'object' || item === null) continue
    const it = item as Record<string, unknown>
    if (typeof it.title !== 'string' || !it.title.trim()) continue
    out.push({
      title: it.title.trim().slice(0, 200),
      durationMinutes: asMinutes(it.durationMinutes, 30),
      note: typeof it.note === 'string' ? it.note.slice(0, 300) : '',
      taskId: typeof it.taskId === 'string' ? it.taskId : undefined,
    })
  }
  return out
}

export function validateExplanation(value: unknown): { explanation: string; warnings: string[] } {
  if (typeof value !== 'object' || value === null) return { explanation: '', warnings: [] }
  const v = value as Record<string, unknown>
  return {
    explanation: typeof v.explanation === 'string' ? v.explanation.slice(0, 1000) : '',
    warnings: Array.isArray(v.warnings)
      ? v.warnings.filter((w): w is string => typeof w === 'string').slice(0, 5)
      : [],
  }
}

export function validateSteps(value: unknown): string[] {
  if (typeof value !== 'object' || value === null) return []
  const arr = (value as Record<string, unknown>).steps
  if (!Array.isArray(arr)) return []
  return arr
    .filter((s): s is string => typeof s === 'string' && s.trim().length > 0)
    .map((s) => s.trim().slice(0, 200))
    .slice(0, 12)
}
