import { useMemo, useState } from 'react'
import type { Priority, Task, TaskStatus } from '../types'
import { formatDateLabel, isOverdue } from '../lib/dates'
import { minutesLabel } from '../lib/dates'
import { useToast } from './Toast'
import { Plus, Trash2, Pencil, CheckCircle2, Circle, Loader2 } from 'lucide-react'

interface Props {
  tasks: Task[]
  setTasks: (t: Task[]) => void
}

const emptyForm = (): Omit<Task, 'id' | 'createdAt' | 'steps' | 'status'> => ({
  title: '',
  description: '',
  deadline: '',
  estimatedMinutes: 30,
  priority: 'medium',
})

export default function TasksView({ tasks, setTasks }: Props) {
  const { push } = useToast()
  const [form, setForm] = useState(emptyForm())
  const [editingId, setEditingId] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [filterPriority, setFilterPriority] = useState<Priority | 'all'>('all')

  const filtered = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (filterStatus === 'all' || t.status === filterStatus) &&
          (filterPriority === 'all' || t.priority === filterPriority),
      ),
    [tasks, filterStatus, filterPriority],
  )

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) {
      push('error', 'Give the task a title first.')
      return
    }
    if (editingId) {
      setTasks(tasks.map((t) => (t.id === editingId ? { ...t, ...form, title: form.title.trim() } : t)))
      push('success', 'Task updated.')
      setEditingId(null)
    } else {
      setTasks([
        ...tasks,
        { ...form, id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: 'todo', steps: [] },
      ])
      push('success', 'Task added.')
    }
    setForm(emptyForm())
  }

  const toggleDone = (t: Task) =>
    setTasks(
      tasks.map((x) => (x.id === t.id ? { ...x, status: x.status === 'done' ? 'todo' : 'done' } : x)),
    )

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>

      <form onSubmit={submit} className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">{editingId ? 'Edit task' : 'Add a task'}</h2>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="text-sm">
            <span className="text-stone-600">Title</span>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Finish essay draft"
            />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">Description (optional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">Deadline</span>
            <input
              type="date"
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
            />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">Estimated minutes</span>
            <input
              type="number"
              min={5}
              max={480}
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              value={form.estimatedMinutes}
              onChange={(e) => setForm({ ...form, estimatedMinutes: Number(e.target.value) || 30 })}
            />
          </label>
          <label className="text-sm">
            <span className="text-stone-600">Priority</span>
            <select
              className="mt-1 w-full rounded-lg border border-stone-200 px-3 py-2"
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value as Priority })}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800">
            <Plus className="h-4 w-4" /> {editingId ? 'Save changes' : 'Add task'}
          </button>
          {editingId && (
            <button type="button" onClick={() => { setEditingId(null); setForm(emptyForm()) }} className="rounded-xl px-4 py-2 text-sm text-stone-500 hover:bg-stone-100">
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="flex flex-wrap gap-2 text-sm">
        <select aria-label="Filter by status" className="rounded-lg border border-stone-200 bg-white px-2 py-1.5" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value as TaskStatus | 'all')}>
          <option value="all">All statuses</option>
          <option value="todo">To do</option>
          <option value="in_progress">In progress</option>
          <option value="done">Done</option>
        </select>
        <select aria-label="Filter by priority" className="rounded-lg border border-stone-200 bg-white px-2 py-1.5" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value as Priority | 'all')}>
          <option value="all">All priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      <ul className="flex flex-col gap-2">
        {filtered.length === 0 && (
          <li className="rounded-2xl border border-dashed border-stone-200 bg-white p-6 text-center text-sm text-stone-400">
            No tasks match these filters.
          </li>
        )}
        {filtered.map((t) => (
          <li key={t.id} className="flex items-center gap-3 rounded-2xl border border-stone-200 bg-white p-3">
            <button onClick={() => toggleDone(t)} aria-label={t.status === 'done' ? 'Mark not done' : 'Mark done'}>
              {t.status === 'done' ? (
                <CheckCircle2 className="h-5 w-5 text-teal-600" />
              ) : t.status === 'in_progress' ? (
                <Loader2 className="h-5 w-5 text-amber-500" />
              ) : (
                <Circle className="h-5 w-5 text-stone-300" />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p className={`truncate text-sm font-medium ${t.status === 'done' ? 'text-stone-400 line-through' : ''}`}>{t.title}</p>
              <p className="text-xs text-stone-500">
                {formatDateLabel(t.deadline)} · {minutesLabel(t.estimatedMinutes)} · {t.priority}
                {isOverdue(t.deadline, t.status) && <span className="ml-1 font-medium text-amber-600">· overdue</span>}
              </p>
            </div>
            <button aria-label="Edit task" onClick={() => { setEditingId(t.id); setForm({ title: t.title, description: t.description, deadline: t.deadline, estimatedMinutes: t.estimatedMinutes, priority: t.priority }) }} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100">
              <Pencil className="h-4 w-4" />
            </button>
            <button aria-label="Delete task" onClick={() => { setTasks(tasks.filter((x) => x.id !== t.id)); push('info', 'Task deleted.') }} className="rounded-lg p-2 text-stone-400 hover:bg-red-50 hover:text-red-600">
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
