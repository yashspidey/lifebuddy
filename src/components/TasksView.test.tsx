import { describe, expect, it } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TasksView from './TasksView'
import { ToastProvider } from './Toast'
import type { Task } from '../types'

const tasks: Task[] = [
  {
    id: '1', title: 'Sample task', description: '', deadline: '', estimatedMinutes: 30,
    priority: 'high', status: 'todo', createdAt: '', steps: [],
  },
]

describe('TasksView', () => {
  it('lists tasks and adds a new one', () => {
    let current = tasks
    render(
      <ToastProvider>
        <TasksView tasks={current} setTasks={(t) => (current = t)} />
      </ToastProvider>,
    )
    expect(screen.getByText('Sample task')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('e.g. Finish essay draft'), {
      target: { value: 'New assignment' },
    })
    fireEvent.click(screen.getByRole('button', { name: /add task/i }))
    expect(current).toHaveLength(2)
    expect(current[1].title).toBe('New assignment')
  })
})
