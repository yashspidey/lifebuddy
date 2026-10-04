import { useState } from 'react'
import type { DailyPlan, Task } from './types'
import {
  clearAllLocalData,
  loadPlan,
  loadProfile,
  loadTasks,
  savePlan,
  saveProfile,
  saveTasks,
} from './lib/storage'
import { sampleTasks } from './lib/seed'
import Sidebar, { type View } from './components/Sidebar'
import Dashboard from './components/Dashboard'
import TasksView from './components/TasksView'
import PlannerView from './components/PlannerView'
import BreakdownView from './components/BreakdownView'
import ProgressView from './components/ProgressView'
import SettingsView from './components/SettingsView'
import { ToastProvider } from './components/Toast'
import StatusBanner from './components/StatusBanner'

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [tasks, setTasksState] = useState<Task[]>(() => loadTasks() ?? sampleTasks())
  const [plan, setPlanState] = useState<DailyPlan | null>(() => loadPlan())
  const [name, setNameState] = useState<string>(() => loadProfile()?.name ?? 'Friend')

  const setTasks = (next: Task[]) => {
    setTasksState(next)
    saveTasks(next)
  }

  const updatePlan = (p: DailyPlan | null) => {
    setPlanState(p)
    savePlan(p)
  }

  const setName = (n: string) => {
    setNameState(n)
    saveProfile({ name: n })
  }

  const handleClearData = () => {
    clearAllLocalData()
    const fresh = sampleTasks()
    setTasksState(fresh)
    setPlanState(null)
    setNameState('Friend')
    saveTasks(fresh)
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-stone-100 text-stone-800">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 p-4 md:flex-row md:p-8">
          <Sidebar view={view} onNavigate={setView} />
          <main className="min-w-0 flex-1">
            <StatusBanner />
            {view === 'dashboard' && (
              <Dashboard tasks={tasks} plan={plan} name={name} goPlan={() => setView('planner')} />
            )}
            {view === 'tasks' && <TasksView tasks={tasks} setTasks={setTasks} />}
            {view === 'planner' && (
              <PlannerView tasks={tasks} plan={plan} updatePlan={updatePlan} setTasks={setTasks} />
            )}
            {view === 'breakdown' && <BreakdownView tasks={tasks} setTasks={setTasks} />}
            {view === 'progress' && <ProgressView tasks={tasks} />}
            {view === 'settings' && (
              <SettingsView name={name} setName={setName} onClearData={handleClearData} />
            )}
          </main>
        </div>
      </div>
    </ToastProvider>
  )
}
