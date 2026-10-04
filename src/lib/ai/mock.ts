import type {
  BreakdownResult,
  DailyPlan,
  ParsedTaskDraft,
  Task,
} from '../../types'
import { addStartTimes, buildPlanItems, energyTip, sortTasksForPlanning } from '../planner'
import type { AIClient, PlanContext } from './types'

export const DEMO_STATUS = {
  mode: 'demo' as const,
  model: 'demo-mode',
  detail: 'Using built-in demo responses. Start Ollama to enable live local AI.',
}

function parseDumpDemo(text: string): ParsedTaskDraft[] {
  // Split on newlines or commas that look like list separators
  const lines = text
    .split(/\n|;|·|•|-\s/)
    .map((l) => l.replace(/^\s*[-*\d.()]+\s*/, '').trim())
    .filter((l) => l.length > 2)
  if (lines.length === 0 && text.trim()) lines.push(text.trim())
  return lines.slice(0, 15).map((title) => {
    const urgent = /today|tonight|asap|urgent|due/i.test(title)
    const mins = /30|thirty/.test(title) ? 30 : /hour|hr/i.test(title) ? 60 : 45
    return {
      title: title.slice(0, 120),
      deadline: urgent ? new Date().toISOString().slice(0, 10) : '',
      estimatedMinutes: mins,
      priority: urgent ? 'high' : 'medium',
      description: '',
    }
  })
}

function planDemo(ctx: PlanContext): Omit<DailyPlan, 'generatedAt' | 'source'> {
  const { items, usedMinutes, overflow } = buildPlanItems(ctx.tasks, ctx.availableMinutes)
  const { withTimes } = addStartTimes(items)
  const breaks = withTimes
    .map((_, i) => i)
    .filter((i) => i > 0 && i % 2 === 0)
    .map((i) => ({ afterItemIndex: i - 1, minutes: 10 }))
  const warnings: string[] = []
  if (overflow > 0) {
    warnings.push(
      `You have about ${Math.ceil(overflow / 60)} hr more of work than the ${Math.round(ctx.availableMinutes / 60)} hr available. Some tasks may need another day or a smaller scope.`,
    )
  }
  if (ctx.energy === 'low') {
    warnings.push('Low energy day: only essential tasks are scheduled, with extra breaks.')
  }
  return {
    items: withTimes.map((it) => ({
      taskId: it.taskId,
      title: it.title,
      start: it.start,
      durationMinutes: it.durationMinutes,
      note: it.note,
    })),
    breaks,
    totalMinutes: usedMinutes,
    availableMinutes: ctx.availableMinutes,
    explanation: `Prioritized by deadline and priority, then fit into your ${Math.round(ctx.availableMinutes / 60)}-hour window. ${energyTip(ctx.energy)}`,
    warnings,
  }
}

export class MockAIClient implements AIClient {
  status = DEMO_STATUS
  source = 'demo' as const

  async parseTaskDump(text: string): Promise<ParsedTaskDraft[]> {
    await delay(400)
    return parseDumpDemo(text)
  }

  async generatePlan(ctx: PlanContext) {
    await delay(600)
    return planDemo(ctx)
  }

  async breakdownTask(task: Task): Promise<BreakdownResult> {
    await delay(500)
    const t = task.title.toLowerCase()
    const steps = /essay|paper|report|article/.test(t)
      ? [
          'Write a rough outline with main points',
          'Find or list 2–3 supporting sources',
          'Write the introduction',
          'Draft the body sections',
          'Write the conclusion and title',
          'Proofread and fix formatting',
        ]
      : /present|slide|deck/.test(t)
        ? [
            'List the 3–5 key messages',
            'Create a slide outline',
            'Draft the slides',
            'Add visuals or charts',
            'Rehearse out loud once',
          ]
        : /study|exam|review|problem set|homework|assignment/.test(t)
          ? [
              'Gather notes and past material',
              'List the topics or problems to cover',
              'Work through the first 2–3 items',
              'Check answers or key concepts',
              'Review mistakes and summarize',
            ]
          : [
              `Clarify what “${task.title}” is done when`,
              'Gather any materials you need',
              'Do the first small part',
              'Finish the main part',
              'Review and mark complete',
            ]
    return { source: 'demo', steps }
  }

  async replan(ctx: PlanContext & { reason: string }) {
    await delay(600)
    const penalty =
      ctx.reason === 'Less time available' ? 0.6 : ctx.reason === 'Low energy' ? 0.7 : 0.8
    const plan = planDemo({
      ...ctx,
      availableMinutes: Math.max(20, Math.round(ctx.availableMinutes * penalty)),
    })
    return {
      ...plan,
      explanation: `Adjusted for “${ctx.reason}”. Completed work was kept as-is; remaining tasks were re-sequenced into a lighter plan. ${plan.explanation}`,
    }
  }

  async summarizeDay(tasks: Task[]): Promise<string> {
    await delay(400)
    const done = tasks.filter((t) => t.status === 'done')
    const remaining = tasks.filter((t) => t.status !== 'done')
    const lines = [
      done.length > 0
        ? `Nice work — you completed ${done.length} task${done.length > 1 ? 's' : ''}: ${done
            .map((t) => t.title)
            .join(', ')}.`
        : 'Nothing marked complete yet today — that’s okay.',
      remaining.length > 0
        ? `Still open: ${remaining.map((t) => t.title).join(', ')}. Anything that feels too big can be broken down with the AI planner.`
        : 'Everything on the list is done. Enjoy the evening!',
    ]
    return lines.join('\n\n')
  }
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export function sortedForDisplay(tasks: Task[]): Task[] {
  return sortTasksForPlanning(tasks)
}
