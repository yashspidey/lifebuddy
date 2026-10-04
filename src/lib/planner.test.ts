import { describe, expect, it } from 'vitest'
import { addStartTimes, buildPlanItems, progressStats, sortTasksForPlanning } from './planner'
import type { Task } from '../types'

function task(p: Partial<Task>): Task {
  return {
    id: p.id ?? crypto.randomUUID(),
    title: p.title ?? 't',
    description: '',
    deadline: p.deadline ?? '',
    estimatedMinutes: p.estimatedMinutes ?? 30,
    priority: p.priority ?? 'medium',
    status: p.status ?? 'todo',
    createdAt: '',
    steps: [],
  }
}

describe('sortTasksForPlanning', () => {
  it('orders by deadline then priority, done last', () => {
    const a = task({ title: 'a', deadline: '2026-10-06', priority: 'low' })
    const b = task({ title: 'b', deadline: '2026-10-05', priority: 'low' })
    const c = task({ title: 'c', deadline: '2026-10-05', priority: 'high' })
    const d = task({ title: 'd', status: 'done', deadline: '2026-10-01' })
    const sorted = sortTasksForPlanning([a, b, c, d])
    expect(sorted.map((t) => t.title)).toEqual(['c', 'b', 'a', 'd'])
  })
})

describe('buildPlanItems', () => {
  it('never exceeds available minutes and reports overflow', () => {
    const tasks = [
      task({ estimatedMinutes: 60, deadline: '2026-10-05' }),
      task({ estimatedMinutes: 60, deadline: '2026-10-05' }),
      task({ estimatedMinutes: 60, deadline: '2026-10-05' }),
    ]
    const { items, usedMinutes, overflow } = buildPlanItems(tasks, 70)
    expect(usedMinutes).toBeLessThanOrEqual(70)
    expect(items.length).toBeGreaterThan(0)
    expect(overflow).toBeGreaterThan(0)
  })
})

describe('addStartTimes', () => {
  it('assigns sequential start times', () => {
    const { withTimes } = addStartTimes(
      [
        { taskId: '1', title: 'A', durationMinutes: 30, note: '' },
        { taskId: '2', title: 'B', durationMinutes: 30, note: '' },
      ],
      9,
      99,
    )
    expect(withTimes[0].start).toBe('09:00')
    expect(withTimes[1].start).toBe('09:30')
  })
})

describe('progressStats', () => {
  it('computes percentages', () => {
    const s = progressStats([task({ status: 'done' }), task({}), task({})])
    expect(s.done).toBe(1)
    expect(s.total).toBe(3)
    expect(s.pct).toBe(33)
  })
})
