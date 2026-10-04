import { useState } from 'react'
import type { Task } from '../types'
import { getAI } from '../lib/ai'
import { useToast } from './Toast'
import { CheckSquare, Sparkles } from 'lucide-react'

export default function BreakdownView({ tasks, setTasks }: { tasks: Task[]; setTasks: (t: Task[]) => void }) {
  const { push } = useToast()
  const [taskId, setTaskId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [draftStep, setDraftStep] = useState('')

  const task = tasks.find((t) => t.id === taskId)

  const breakdown = async () => {
    if (!task) {
      push('error', 'Pick a task first.')
      return
    }
    setLoading(true)
    try {
      const result = await getAI().breakdownTask(task)
      setTasks(
        tasks.map((t) =>
          t.id === task.id
            ? { ...t, steps: result.steps.map((s) => ({ id: crypto.randomUUID(), text: s, done: false })) }
            : t,
        ),
      )
      push('success', `Broke "${task.title}" into ${result.steps.length} steps (${result.source === 'live' ? 'live AI' : 'demo'}).`)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not break down the task.')
    } finally {
      setLoading(false)
    }
  }

  const toggleStep = (stepId: string) => {
    if (!task) return
    setTasks(
      tasks.map((t) =>
        t.id === task.id
          ? { ...t, steps: t.steps.map((s) => (s.id === stepId ? { ...s, done: !s.done } : s)) }
          : t,
      ),
    )
  }

  const addStep = () => {
    if (!task || !draftStep.trim()) return
    setTasks(
      tasks.map((t) =>
        t.id === task.id
          ? { ...t, steps: [...t.steps, { id: crypto.randomUUID(), text: draftStep.trim(), done: false }] }
          : t,
      ),
    )
    setDraftStep('')
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Break it down</h1>
      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Select a task to make it feel smaller</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <select
            aria-label="Select task"
            className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
          >
            <option value="">Choose a task…</option>
            {tasks.filter((t) => t.status !== 'done').map((t) => (
              <option key={t.id} value={t.id}>{t.title}</option>
            ))}
          </select>
          <button
            disabled={loading || !taskId}
            onClick={breakdown}
            className="inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> {loading ? 'Thinking…' : 'Suggest steps'}
          </button>
        </div>

        {task && task.steps.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-stone-500">
              {task.steps.filter((s) => s.done).length} of {task.steps.length} steps done
            </p>
            <ul className="mt-2 flex flex-col gap-1">
              {task.steps.map((s) => (
                <li key={s.id}>
                  <label className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-stone-50">
                    <input type="checkbox" checked={s.done} onChange={() => toggleStep(s.id)} className="h-4 w-4 accent-teal-700" />
                    <span className={s.done ? 'text-stone-400 line-through' : ''}>{s.text}</span>
                  </label>
                </li>
              ))}
            </ul>
          </div>
        )}

        {task && (
          <form
            className="mt-3 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              addStep()
            }}
          >
            <input
              value={draftStep}
              onChange={(e) => setDraftStep(e.target.value)}
              placeholder="Add your own step…"
              className="flex-1 rounded-lg border border-stone-200 px-3 py-1.5 text-sm"
            />
            <button className="rounded-lg border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-50">Add</button>
          </form>
        )}

        {!task && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-stone-400">
            <CheckSquare className="h-4 w-4" /> Pick a task above to get suggested steps.
          </p>
        )}
      </section>
    </div>
  )
}
