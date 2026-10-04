import { beforeEach, describe, expect, it } from 'vitest'
import { clearAllLocalData, loadPlan, loadTasks, savePlan, saveTasks } from './storage'
import { sampleTasks } from './seed'

describe('storage', () => {
  beforeEach(() => localStorage.clear())

  it('round-trips tasks', () => {
    const tasks = sampleTasks()
    saveTasks(tasks)
    expect(loadTasks()).toHaveLength(tasks.length)
  })

  it('returns null when nothing stored', () => {
    expect(loadTasks()).toBeNull()
    expect(loadPlan()).toBeNull()
  })

  it('clearAllLocalData wipes everything', () => {
    saveTasks(sampleTasks())
    savePlan({
      generatedAt: '', source: 'demo', items: [], breaks: [], totalMinutes: 0,
      availableMinutes: 0, explanation: '', warnings: [],
    })
    clearAllLocalData()
    expect(loadTasks()).toBeNull()
    expect(loadPlan()).toBeNull()
  })

  it('ignores corrupt JSON', () => {
    localStorage.setItem('lifebuddy:tasks:v1', '{not json')
    expect(loadTasks()).toBeNull()
  })
})
