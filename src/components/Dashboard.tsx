import type { Task } from '../types'
import { formatDateLabel, isOverdue } from '../lib/dates'
import { overdueTasks, progressStats, tasksDueToday, upcomingTasks } from '../lib/planner'
import { useToast } from './Toast'
import { Clock, Flame, Sparkles } from 'lucide-react'

interface Props {
  tasks: Task[]
  plan: unknown
  name: string
  goPlan: () => void
}

export default function Dashboard({ tasks, name, goPlan }: Props) {
  const { push } = useToast()
  const today = new Date()
  const stats = progressStats(tasks)
  const dueToday = tasksDueToday(tasks)
  const overdue = overdueTasks(tasks)
  const upcoming = upcomingTasks(tasks, 7)

  return (
    <div className="flex flex-col gap-4">
      <header className="rounded-2xl border border-stone-200 bg-white p-5">
        <h1 className="text-2xl font-semibold tracking-tight">
          Good {greeting(today)}, {name} 👋
        </h1>
        <p className="mt-1 text-sm text-stone-500">
          {today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{stats.done} of {stats.total} tasks done</span>
            <span className="text-stone-500">{stats.pct}%</span>
          </div>
          <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-stone-100">
            <div className="h-full rounded-full bg-teal-600 transition-all" style={{ width: `${stats.pct}%` }} />
          </div>
        </div>
        <button
          onClick={() => {
            goPlan()
            push('info', 'Opening the AI planner')
          }}
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-teal-800"
        >
          <Sparkles className="h-4 w-4" /> Plan my day
        </button>
      </header>

      {overdue.length > 0 && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <Flame className="h-4 w-4" /> Overdue
          </h2>
          <TaskRows tasks={overdue} />
        </section>
      )}

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Due today</h2>
        {dueToday.length === 0 ? (
          <p className="mt-2 text-sm text-stone-400">Nothing due today. Nice breathing room.</p>
        ) : (
          <TaskRows tasks={dueToday} />
        )}
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Upcoming (next 7 days)</h2>
        {upcoming.length === 0 ? (
          <p className="mt-2 text-sm text-stone-400">No upcoming deadlines.</p>
        ) : (
          <TaskRows tasks={upcoming} />
        )}
      </section>
    </div>
  )
}

function TaskRows({ tasks }: { tasks: Task[] }) {
  return (
    <ul className="mt-2 divide-y divide-stone-100">
      {tasks.map((t) => (
        <li key={t.id} className="flex items-center justify-between py-2 text-sm">
          <span className={isOverdue(t.deadline, t.status) ? 'font-medium text-amber-800' : ''}>{t.title}</span>
          <span className="flex items-center gap-1 text-stone-400">
            <Clock className="h-3.5 w-3.5" />
            {formatDateLabel(t.deadline)} · {t.estimatedMinutes}m
          </span>
        </li>
      ))}
    </ul>
  )
}

function greeting(d: Date) {
  const h = d.getHours()
  if (h < 12) return 'morning'
  if (h < 18) return 'afternoon'
  return 'evening'
}
