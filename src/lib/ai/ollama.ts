import type {
  BreakdownResult,
  DailyPlan,
  ParsedTaskDraft,
  Task,
} from '../../types'
import { todayKey } from '../dates'
import {
  parseJsonLoose,
  validateExplanation,
  validateParsedTasks,
  validatePlanItems,
  validateSteps,
} from '../validate'
import { addStartTimes } from '../planner'
import type { AIClient, AIStatus, PlanContext } from './types'

const BASE_URL = (import.meta.env.VITE_OLLAMA_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? 'http://localhost:11434'
const MODEL = (import.meta.env.VITE_OLLAMA_MODEL as string | undefined) ?? 'gemma3:4b'

export async function ollamaAvailable(): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(`${BASE_URL}/api/tags`, { signal: AbortSignal.timeout(3000) })
    if (!res.ok) return { ok: false, detail: `Ollama responded with HTTP ${res.status}` }
    const data = await res.json()
    const models: string[] = Array.isArray(data?.models)
      ? data.models.map((m: { name?: string }) => m.name ?? '')
      : []
    const found = models.some((n) => n === MODEL || n.startsWith(`${MODEL}:`) || n.startsWith(MODEL.split(':')[0]))
    return {
      ok: true,
      detail: found
        ? `Connected to Ollama (${BASE_URL}), model "${MODEL}" is available.`
        : `Connected to Ollama (${BASE_URL}), but model "${MODEL}" was not found. Available: ${models.join(', ') || 'none'}. Run: ollama pull ${MODEL}`,
    }
  } catch {
    return {
      ok: false,
      detail: `Could not reach Ollama at ${BASE_URL}. Make sure it is running (ollama serve) and that your browser origin is allowed via OLLAMA_ORIGINS.`,
    }
  }
}

async function generateJSON(prompt: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: AbortSignal.timeout(120_000),
    body: JSON.stringify({
      model: MODEL,
      prompt,
      stream: false,
      format: 'json',
      options: { temperature: 0.3 },
    }),
  })
  if (!res.ok) {
    throw new Error(`Ollama error HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`)
  }
  const data = await res.json()
  const parsed = parseJsonLoose(typeof data?.response === 'string' ? data.response : '')
  if (parsed === null) {
    throw new Error('The model returned malformed JSON. Try regenerating, or simplify the request.')
  }
  return parsed
}

export class OllamaClient implements AIClient {
  status: AIStatus
  constructor(detail: string) {
    this.status = { mode: 'live', model: MODEL, detail }
  }

  async parseTaskDump(text: string): Promise<ParsedTaskDraft[]> {
    const today = todayKey()
    const raw = await generateJSON(
      `You convert a student's messy to-do list into structured tasks. Today is ${today}.
Return ONLY JSON of the form {"tasks":[{"title":string,"deadline":"YYYY-MM-DD"|"","estimatedMinutes":number,"priority":"high"|"medium"|"low","description":string}]}.
Estimate durations realistically (15-120 minutes). If no date is given, use "".
User input:
${text.slice(0, 4000)}`,
    )
    const tasks = validateParsedTasks(raw)
    if (tasks.length === 0) throw new Error('The model did not produce any usable tasks. Try rephrasing.')
    return tasks
  }

  async generatePlan(ctx: PlanContext): Promise<Omit<DailyPlan, 'generatedAt' | 'source'>> {
    const raw = await generateJSON(planPrompt(ctx))
    const items = validatePlanItems(raw)
    const { explanation, warnings } = validateExplanation(raw)
    if (items.length === 0) throw new Error('The model returned an empty plan. Please try again.')
    // Never trust model arithmetic — recompute start times and totals deterministically.
    const { withTimes, total } = addStartTimes(
      items.map((it) => ({ taskId: it.taskId ?? '', title: it.title, durationMinutes: it.durationMinutes, note: it.note })),
    )
    return {
      items: withTimes.map((it) => ({
        taskId: it.taskId,
        title: it.title,
        start: it.start,
        durationMinutes: it.durationMinutes,
        note: it.note,
      })),
      breaks: withTimes
        .map((_, i) => i)
        .filter((i) => i > 0 && i % 2 === 0)
        .map((i) => ({ afterItemIndex: i - 1, minutes: 10 })),
      totalMinutes: total,
      availableMinutes: ctx.availableMinutes,
      explanation: explanation || 'Plan ordered by deadline and priority.',
      warnings,
    }
  }

  async breakdownTask(task: Task): Promise<BreakdownResult> {
    const raw = await generateJSON(
      `Break this task into 4-8 small, concrete, achievable steps for a student. Return ONLY JSON: {"steps":[string,...]}.
Task: ${task.title}
Description: ${task.description || '(none)'}`,
    )
    const steps = validateSteps(raw)
    if (steps.length === 0) throw new Error('The model did not return usable steps. Please try again.')
    return { source: 'live', steps }
  }

  async replan(ctx: PlanContext & { reason: string }): Promise<Omit<DailyPlan, 'generatedAt' | 'source'>> {
    const remaining = ctx.tasks.filter((t) => t.status !== 'done')
    const raw = await generateJSON(
      planPrompt({
        ...ctx,
        tasks: remaining,
      }) + `\nThe user said: "${ctx.reason}". Adjust the plan accordingly (fewer/shorter tasks if less time or low energy, add the new task if they added one). Mention the adjustment in explanation.`,
    )
    const items = validatePlanItems(raw)
    const { explanation, warnings } = validateExplanation(raw)
    if (items.length === 0) throw new Error('The model returned an empty adjusted plan. Please try again.')
    const { withTimes, total } = addStartTimes(
      items.map((it) => ({ taskId: it.taskId ?? '', title: it.title, durationMinutes: it.durationMinutes, note: it.note })),
    )
    return {
      items: withTimes.map((it) => ({
        taskId: it.taskId,
        title: it.title,
        start: it.start,
        durationMinutes: it.durationMinutes,
        note: it.note,
      })),
      breaks: [],
      totalMinutes: total,
      availableMinutes: ctx.availableMinutes,
      explanation: explanation || `Adjusted plan for: ${ctx.reason}`,
      warnings,
    }
  }

  async summarizeDay(tasks: Task[]): Promise<string> {
    const done = tasks.filter((t) => t.status === 'done').map((t) => t.title)
    const open = tasks.filter((t) => t.status !== 'done').map((t) => t.title)
    try {
      const raw = await generateJSON(
        `Summarize this student's day kindly and briefly in 2-4 sentences. No guilt, no medical or motivational claims. Return ONLY JSON: {"summary": string}.
Completed: ${done.join(', ') || 'none'}
Still open: ${open.join(', ') || 'none'}`,
      )
      const s = (raw as Record<string, unknown>)?.summary
      if (typeof s === 'string' && s.trim()) return s.trim()
      return fallbackSummary(done, open)
    } catch {
      return fallbackSummary(done, open)
    }
  }
}

function planPrompt(ctx: PlanContext): string {
  const list = ctx.tasks
    .filter((t) => t.status !== 'done')
    .map(
      (t) =>
        `- id=${t.id} | ${t.title} | deadline=${t.deadline || 'none'} | ~${t.estimatedMinutes}min | priority=${t.priority}`,
    )
    .join('\n')
  return `You are a planning assistant for a busy student. Build a realistic schedule for today.
Available time: ${ctx.availableMinutes} minutes. Energy level: ${ctx.energy}.
Tasks:
${list || '(no tasks)'}
Return ONLY JSON: {"items":[{"taskId":string,"title":string,"durationMinutes":number,"note":string}],"explanation":string,"warnings":[string]}.
Rules: total durationMinutes must not exceed ${ctx.availableMinutes}. Put the most urgent tasks first. If work exceeds available time, say so in warnings rather than overfilling the plan.`
}

function fallbackSummary(done: string[], open: string[]): string {
  return `Completed ${done.length} task(s)${done.length ? `: ${done.join(', ')}` : ''}. Still open: ${open.join(', ') || 'none'}.`
}
