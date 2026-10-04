import { useState } from 'react'
import type { Task } from '../types'
import { getAI } from '../lib/ai'
import { progressStats } from '../lib/planner'
import { useToast } from './Toast'
import { MessageSquareHeart } from 'lucide-react'

export default function ProgressView({ tasks }: { tasks: Task[] }) {
  const { push } = useToast()
  const [summary, setSummary] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const stats = progressStats(tasks)

  // Simple weekly view: group tasks by deadline weekday
  const byDay: Record<string, { done: number; total: number }> = {}
  for (const t of tasks) {
    if (!t.deadline) continue
    byDay[t.deadline] = byDay[t.deadline] ?? { done: 0, total: 0 }
    byDay[t.deadline].total += 1
    if (t.status === 'done') byDay[t.deadline].done += 1
  }
  const days = Object.entries(byDay).sort(([a], [b]) => a.localeCompare(b)).slice(0, 7)
  const maxTotal = Math.max(1, ...days.map(([, v]) => v.total))

  const reflect = async () => {
    setLoading(true)
    try {
      const text = await getAI().summarizeDay(tasks)
      setSummary(text)
    } catch (e) {
      push('error', e instanceof Error ? e.message : 'Could not summarize the day.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Progress & reflection</h1>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Completed vs. remaining</h2>
        <div className="mt-3 flex items-center gap-6 text-sm">
          <Donut pct={stats.pct} />
          <div>
            <p><strong>{stats.done}</strong> done</p>
            <p><strong>{stats.total - stats.done}</strong> remaining</p>
            {stats.overdue > 0 && <p className="text-amber-700"><strong>{stats.overdue}</strong> overdue</p>}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Upcoming workload by deadline</h2>
        {days.length === 0 ? (
          <p className="mt-2 text-sm text-stone-400">No dated tasks yet.</p>
        ) : (
          <div className="mt-3 flex items-end gap-3">
            {days.map(([day, v]) => (
              <div key={day} className="flex w-12 flex-col items-center gap-1">
                <div className="flex h-24 w-full items-end rounded-md bg-stone-100">
                  <div className="w-full rounded-md bg-teal-600" style={{ height: `${Math.round((v.total / maxTotal) * 100)}%` }} title={`${v.done}/${v.total} done`} />
                </div>
                <span className="text-[10px] text-stone-500">{day.slice(5)}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">End-of-day reflection</h2>
        <button
          onClick={reflect}
          disabled={loading}
          className="mt-2 inline-flex items-center gap-1.5 rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-50"
        >
          <MessageSquareHeart className="h-4 w-4" /> {loading ? 'Summarizing…' : 'Summarize my day'}
        </button>
        {summary && (
          <div className="mt-3 whitespace-pre-line rounded-xl bg-stone-50 p-3 text-sm text-stone-700">
            {summary}
          </div>
        )}
      </section>
    </div>
  )
}

function Donut({ pct }: { pct: number }) {
  const r = 30
  const c = 2 * Math.PI * r
  return (
    <svg width="80" height="80" viewBox="0 0 80 80" role="img" aria-label={`${pct}% complete`}>
      <circle cx="40" cy="40" r={r} fill="none" stroke="#e7e5e4" strokeWidth="10" />
      <circle cx="40" cy="40" r={r} fill="none" stroke="#0d9488" strokeWidth="10" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)} strokeLinecap="round" transform="rotate(-90 40 40)" />
      <text x="40" y="45" textAnchor="middle" className="fill-stone-700 text-sm font-semibold">{pct}%</text>
    </svg>
  )
}
