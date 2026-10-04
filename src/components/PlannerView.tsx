import { useState } from 'react'
import type { DailyPlan, EnergyLevel, Task } from '../types'
import { getAI } from '../lib/ai'
import { useToast } from './Toast'
import { Sparkles, RotateCcw, Clock, Coffee, Trash2 } from 'lucide-react'

interface Props {
  tasks: Task[]
  plan: DailyPlan | null
  updatePlan: (p: DailyPlan | null) => void
  setTasks: (t: Task[]) => void
}

const REPLAN_REASONS = ['Less time available', 'Low energy', 'Unexpected task came up', 'A task is taking longer']

export default function PlannerView({ tasks, plan, updatePlan, setTasks }: Props) {
  const { push } = useToast()
  const [dump, setDump] = useState('')
  const [hours, setHours] = useState(3)
  const [energy, setEnergy] = useState<EnergyLevel>('medium')
  const [loading, setLoading] = useState(false)
  const [reason, setReason] = useState(REPLAN_REASONS[0])
  const [imported, setImported] = useState(0)

  const availableMinutes = Math.max(15, Math.round(hours * 60))

  const run = async (fn: () => Promise<Omit<DailyPlan, 'generatedAt' | 'source'>>) => {
    setLoading(true)
    try {
      const p = await fn()
      updatePlan({ ...p, generatedAt: new Date().toISOString(), source: getAI().status.mode })
      push('success', 'Plan generated.')
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Something went wrong while planning.')
    } finally {
      setLoading(false)
    }
  }

  const handleDump = async () => {
    if (!dump.trim()) {
      push('error', 'Type your task list first.')
      return
    }
    setLoading(true)
    try {
      const parsed = await getAI().parseTaskDump(dump)
      const created: Task[] = parsed.map((d) => ({
        ...d,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'todo',
        steps: [],
      }))
      setTasks([...tasks, ...created])
      setImported(created.length)
      push('success', `Imported ${created.length} task${created.length === 1 ? '' : 's'}.`)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not parse tasks.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">AI Daily Planner</h1>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">1. Brain-dump everything on your plate</h2>
        <textarea
          className="mt-2 w-full rounded-xl border border-stone-200 p-3 text-sm"
          rows={5}
          placeholder={'e.g.\n- Finish history essay by tonight\n- Calculus problem set due tomorrow\n- Email professor, buy groceries, study for quiz Friday'}
          value={dump}
          onChange={(e) => setDump(e.target.value)}
        />
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button
            onClick={handleDump}
            disabled={loading}
            className="rounded-xl bg-stone-800 px-4 py-2 text-sm font-medium text-white hover:bg-stone-900 disabled:opacity-50"
          >
            {loading ? 'Working…' : 'Import tasks'}
          </button>
          {imported > 0 && <span className="text-sm text-stone-500">Imported {imported} tasks — find them in the Tasks tab.</span>}
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">2. Set your time and energy</h2>
        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
          <label>
            <span className="text-stone-600">Available time</span>
            <select className="ml-2 rounded-lg border border-stone-200 px-2 py-1.5" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
              {[0.5, 1, 1.5, 2, 3, 4, 6, 8].map((h) => (
                <option key={h} value={h}>{h} hr</option>
              ))}
            </select>
          </label>
          <label>
            <span className="text-stone-600">Energy</span>
            <select className="ml-2 rounded-lg border border-stone-200 px-2 py-1.5" value={energy} onChange={(e) => setEnergy(e.target.value as EnergyLevel)}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>
          <button
            disabled={loading || tasks.length === 0}
            onClick={() => run(() => getAI().generatePlan({ tasks, availableMinutes, energy }))}
            className="inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4" /> {loading ? 'Planning…' : 'Generate plan'}
          </button>
        </div>
        {tasks.length === 0 && <p className="mt-2 text-sm text-stone-400">Add some tasks first.</p>}
      </section>

      {plan && (
        <section className="rounded-2xl border border-stone-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700">Today's plan {plan.source === 'demo' ? '(demo AI)' : `(live · ${getAI().status.model})`}</h2>
            <span className="text-xs text-stone-400">{Math.round(plan.totalMinutes / 60)}h of {Math.round(plan.availableMinutes / 60)}h planned</span>
          </div>

          {plan.warnings.map((w, i) => (
            <p key={i} className="mt-2 rounded-lg bg-amber-50 p-2 text-sm text-amber-800">{w}</p>
          ))}
          <p className="mt-2 text-sm text-stone-600">{plan.explanation}</p>

          <ol className="mt-3 flex flex-col gap-2">
            {plan.items.map((it, i) => (
              <li key={i} className="rounded-xl border border-stone-100 bg-stone-50 p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{it.start} — {it.title}</span>
                  <span className="flex items-center gap-1 text-xs text-stone-500"><Clock className="h-3.5 w-3.5" />{it.durationMinutes}m</span>
                </div>
                {it.note && <p className="mt-1 text-xs text-stone-500">{it.note}</p>}
                <div className="mt-2 flex gap-2">
                  <input
                    aria-label="Edit duration"
                    type="number"
                    className="w-20 rounded-lg border border-stone-200 px-2 py-1 text-xs"
                    defaultValue={it.durationMinutes}
                    onBlur={(e) => {
                      const v = Math.max(5, Number(e.target.value) || it.durationMinutes)
                      updatePlan({ ...plan, items: plan.items.map((x, j) => (j === i ? { ...x, durationMinutes: v } : x)) })
                    }}
                  />
                  <button aria-label="Remove from plan" onClick={() => updatePlan({ ...plan, items: plan.items.filter((_, j) => j !== i) })} className="rounded-lg p-1.5 text-stone-400 hover:bg-red-50 hover:text-red-600">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ol>
          {plan.breaks.length > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-stone-500">
              <Coffee className="h-3.5 w-3.5" /> While breaks are built in every ~2 items (10 min each).
            </p>
          )}

          <div className="mt-4 border-t border-stone-100 pt-3">
            <h3 className="text-sm font-semibold text-stone-700">Re-plan</h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <select className="rounded-lg border border-stone-200 px-2 py-1.5 text-sm" value={reason} onChange={(e) => setReason(e.target.value)}>
                {REPLAN_REASONS.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
              <button
                disabled={loading}
                onClick={() => run(() => getAI().replan({ tasks, availableMinutes, energy, reason }))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-50 disabled:opacity-50"
              >
                <RotateCcw className="h-4 w-4" /> Re-plan
              </button>
              <button
                disabled={loading}
                onClick={() => run(() => getAI().generatePlan({ tasks, availableMinutes, energy }))}
                className="inline-flex items-center gap-1.5 rounded-xl border border-stone-200 px-3 py-1.5 text-sm hover:bg-stone-50 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" /> Regenerate
              </button>
              <button onClick={() => updatePlan(null)} className="rounded-xl px-3 py-1.5 text-sm text-stone-400 hover:bg-stone-100">
                Clear plan
              </button>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
