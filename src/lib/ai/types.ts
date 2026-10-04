import type {
  BreakdownResult,
  DailyPlan,
  EnergyLevel,
  ParsedTaskDraft,
  Task,
} from '../../types'

export type AIMode = 'live' | 'demo'

export interface PlanContext {
  tasks: Task[]
  availableMinutes: number
  energy: EnergyLevel
  reason?: string
}

export interface AIStatus {
  mode: AIMode
  model: string
  detail: string
}

export interface AIClient {
  status: AIStatus
  parseTaskDump(text: string): Promise<ParsedTaskDraft[]>
  generatePlan(ctx: PlanContext): Promise<Omit<DailyPlan, 'generatedAt' | 'source'>>
  breakdownTask(task: Task): Promise<BreakdownResult>
  replan(ctx: PlanContext & { reason: string }): Promise<Omit<DailyPlan, 'generatedAt' | 'source'>>
  summarizeDay(tasks: Task[]): Promise<string>
}
