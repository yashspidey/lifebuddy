export type Priority = 'high' | 'medium' | 'low'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type EnergyLevel = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description: string
  /** ISO date string (yyyy-mm-dd) or empty string for no deadline */
  deadline: string
  /** estimated duration in minutes */
  estimatedMinutes: number
  priority: Priority
  status: TaskStatus
  createdAt: string
  steps: TaskStep[]
}

export interface TaskStep {
  id: string
  text: string
  done: boolean
}

export interface PlanItem {
  taskId: string
  title: string
  start: string
  durationMinutes: number
  note: string
}

export interface DailyPlan {
  generatedAt: string
  source: 'live' | 'demo'
  items: PlanItem[]
  breaks: { afterItemIndex: number; minutes: number }[]
  totalMinutes: number
  availableMinutes: number
  explanation: string
  warnings: string[]
}

export interface ParsedTaskDraft {
  title: string
  deadline: string
  estimatedMinutes: number
  priority: Priority
  description: string
}

export interface BreakdownResult {
  source: 'live' | 'demo'
  steps: string[]
}
