import type { Task } from '../types'
import { todayKey } from './dates'

const DAY = 24 * 60 * 60 * 1000

export function sampleTasks(): Task[] {
  const today = todayKey()
  const inDays = (n: number) =>
    new Date(Date.now() + n * DAY).toISOString().slice(0, 10)
  const base = Date.now()
  return [
    {
      id: crypto.randomUUID(),
      title: 'Finish history essay draft',
      description: 'Rough draft, intro + two body paragraphs',
      deadline: inDays(0),
      estimatedMinutes: 60,
      priority: 'high',
      status: 'in_progress',
      createdAt: new Date(base).toISOString(),
      steps: [],
    },
    {
      id: crypto.randomUUID(),
      title: 'Calculus problem set',
      description: 'Problems 1–12, show all working',
      deadline: today,
      estimatedMinutes: 45,
      priority: 'high',
      status: 'todo',
      createdAt: new Date(base).toISOString(),
      steps: [],
    },
    {
      id: crypto.randomUUID(),
      title: 'Email professor about extension',
      description: '',
      deadline: inDays(1),
      estimatedMinutes: 15,
      priority: 'medium',
      status: 'todo',
      createdAt: new Date(base).toISOString(),
      steps: [],
    },
    {
      id: crypto.randomUUID(),
      title: 'Buy groceries',
      description: 'Milk, eggs, rice, vegetables',
      deadline: inDays(1),
      estimatedMinutes: 30,
      priority: 'low',
      status: 'todo',
      createdAt: new Date(base).toISOString(),
      steps: [],
    },
    {
      id: crypto.randomUUID(),
      title: 'Group project slides',
      description: 'Slides for the Thursday presentation',
      deadline: inDays(3),
      estimatedMinutes: 90,
      priority: 'medium',
      status: 'todo',
      createdAt: new Date(base).toISOString(),
      steps: [],
    },
  ]
}
