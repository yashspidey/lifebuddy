import { CalendarDays, CheckSquare, LayoutDashboard, ListTodo, Settings, Sparkles, TrendingUp } from 'lucide-react'

export type View = 'dashboard' | 'tasks' | 'planner' | 'breakdown' | 'progress' | 'settings'

const items: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'planner', label: 'AI Planner', icon: Sparkles },
  { id: 'breakdown', label: 'Break it down', icon: CheckSquare },
  { id: 'progress', label: 'Progress', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
]

export default function Sidebar({ view, onNavigate }: { view: View; onNavigate: (v: View) => void }) {
  return (
    <nav
      aria-label="Main navigation"
      className="flex shrink-0 gap-1 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 md:w-52 md:flex-col md:gap-1.5"
    >
      <div className="mb-1 hidden items-center gap-2 px-2 py-1 md:flex">
        <CalendarDays className="h-5 w-5 text-teal-700" />
        <span className="text-lg font-semibold tracking-tight">LifeBuddy</span>
      </div>
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={view === id ? 'page' : undefined}
          className={`flex items-center gap-2.5 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition ${
            view === id
              ? 'bg-teal-50 text-teal-800'
              : 'text-stone-600 hover:bg-stone-100'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </nav>
  )
}
