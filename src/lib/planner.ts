import type { EnergyLevel, Priority, Task } from '../types'
import { isOverdue, todayKey } from './dates'

const PRIORITY_RANK: Record<Priority, number> = { high: 0, medium: 1, low: 2 }

/** Deterministic ordering: overdue/today first, then deadline asc, then priority. */
export function sortTasksForPlanning(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    const aRank = a.status === 'done' ? 1 : 0
    const bRank = b.status === 'done' ? 1 : 0
    if (aRank !== bRank) return aRank - bRank
    const dd = (a.deadline || '9999-12-31').localeCompare(b.deadline || '9999-12-31')
    if (dd !== 0) return dd
    return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
  })
}

export function tasksDueToday(tasks: Task[]): Task[] {
  return tasks.filter((t) => t.status !== 'done' && t.deadline === todayKey())
}

export function overdueTasks(tasks: Task[]): Task[] {
  return tasks.filter((t) => isOverdue(t.deadline, t.status))
}

export function upcomingTasks(tasks: Task[], withinDays = 7): Task[] {
  const today = todayKey()
  const limit = new Date(Date.now() + withinDays * 86400000).toISOString().slice(0, 10)
  return tasks.filter(
    (t) => t.status !== 'done' && t.deadline > today && t.deadline <= limit,
  )
}

export function progressStats(tasks: Task[]) {
  const total = tasks.length
  const done = tasks.filter((t) => t.status === 'done').length
  const overdue = overdueTasks(tasks).length
  return {
    total,
    done,
    overdue,
    pct: total === 0 ? 0 : Math.round((done / total) * 100),
  }
}

/** Build a deterministic schedule the mock AI and the live fallback share. */
export function buildPlanItems(
  tasks: Task[],
  availableMinutes: number,
): { items: { taskId: string; title: string; durationMinutes: number; note: string }[]; usedMinutes: number; overflow: number } {
  const candidates = sortTasksForPlanning(tasks).filter((t) => t.status !== 'done')
  let remaining = availableMinutes
  const items: { taskId: string; title: string; durationMinutes: number; note: string }[] = []
  let used = 0
  for (const t of candidates) {
    if (remaining <= 0) break
    const dur = Math.min(t.estimatedMinutes, remaining)
    if (dur < 10) break
    items.push({
      taskId: t.id,
      title: t.title,
      durationMinutes: dur,
      note: t.deadline === todayKey() ? 'Due today — tackle early' : '',
    })
    used += dur
    remaining -= dur
  }
  const needed = candidates.reduce((s, t) => s + t.estimatedMinutes, 0)
  return { items, usedMinutes: used, overflow: Math.max(0, needed - availableMinutes) }
}

export function addStartTimes(
  items: { taskId: string; title: string; durationMinutes: number; note: string }[],
  startHour = 9,
  breakEvery = 2,
): { withTimes: (typeof items[number] & { start: string })[]; total: number } {
  let cursor = startHour * 60
  const withTimes: (typeof items[number] & { start: string })[] = []
  items.forEach((item, i) => {
    if (i > 0 && i % breakEvery === 0) cursor += 10
    const h = Math.floor(cursor / 60)
    const m = cursor % 60
    withTimes.push({ ...item, start: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}` })
    cursor += item.durationMinutes
  })
  return { withTimes, total: cursor - startHour * 60 }
}

export function energyTip(level: EnergyLevel): string {
  if (level === 'low') return 'Lighter session: front-load easy wins, keep sessions short.'
  if (level === 'high') return 'Great energy — schedule deep work in this window.'
  return 'Steady session: mix focused work with short breaks.'
}
