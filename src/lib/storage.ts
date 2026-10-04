import type { DailyPlan, Task } from '../types'

const TASKS_KEY = 'lifebuddy:tasks:v1'
const PLAN_KEY = 'lifebuddy:plan:v1'
const PROFILE_KEY = 'lifebuddy:profile:v1'

export interface Profile {
  name: string
}

function readJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // quota or privacy mode — fail silently, app still works in-memory
  }
}

export function loadTasks(): Task[] | null {
  const data = readJSON<Task[]>(TASKS_KEY)
  if (!Array.isArray(data)) return null
  return data.filter(isStoredTask)
}

export function saveTasks(tasks: Task[]): void {
  writeJSON(TASKS_KEY, tasks)
}

export function loadPlan(): DailyPlan | null {
  return readJSON<DailyPlan>(PLAN_KEY)
}

export function savePlan(plan: DailyPlan | null): void {
  if (plan === null) localStorage.removeItem(PLAN_KEY)
  else writeJSON(PLAN_KEY, plan)
}

export function loadProfile(): Profile | null {
  return readJSON<Profile>(PROFILE_KEY)
}

export function saveProfile(profile: Profile): void {
  writeJSON(PROFILE_KEY, profile)
}

export function clearAllLocalData(): void {
  localStorage.removeItem(TASKS_KEY)
  localStorage.removeItem(PLAN_KEY)
  localStorage.removeItem(PROFILE_KEY)
}

function isStoredTask(t: unknown): t is Task {
  if (typeof t !== 'object' || t === null) return false
  const task = t as Record<string, unknown>
  return (
    typeof task.id === 'string' &&
    typeof task.title === 'string' &&
    typeof task.deadline === 'string' &&
    typeof task.estimatedMinutes === 'number' &&
    typeof task.priority === 'string' &&
    typeof task.status === 'string' &&
    Array.isArray(task.steps)
  )
}
