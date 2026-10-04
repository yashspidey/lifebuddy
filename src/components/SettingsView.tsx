import { useState } from 'react'
import { useToast } from './Toast'
import { getAIStatus } from '../lib/ai'
import { Trash2, ShieldCheck } from 'lucide-react'

interface Props {
  name: string
  setName: (n: string) => void
  onClearData: () => void
}

export default function SettingsView({ name, setName, onClearData }: Props) {
  const { push } = useToast()
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState(name)
  const status = getAIStatus()

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">Your name</h2>
        <div className="mt-2 flex gap-2">
          <input
            aria-label="Your name"
            className="rounded-lg border border-stone-200 px-3 py-2 text-sm"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <button
            onClick={() => {
              setName(draft.trim() || 'Friend')
              push('success', 'Name saved.')
            }}
            className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
          >
            Save
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="text-sm font-semibold text-stone-700">AI status</h2>
        <p className="mt-1 text-sm text-stone-600">
          Mode: <strong>{status.mode === 'live' ? 'Live local AI' : 'Demo mode'}</strong> ({status.model})
        </p>
        <p className="mt-1 text-sm text-stone-500">{status.detail}</p>
      </section>

      <section className="rounded-2xl border border-stone-200 bg-white p-4">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-stone-700">
          <ShieldCheck className="h-4 w-4 text-teal-700" /> Privacy & data
        </h2>
        <p className="mt-1 text-sm text-stone-600">
          Tasks, plans, and your name are stored only in this browser's localStorage. When live AI mode is on, requests go only to your own Ollama server on this machine — nothing is sent to a third-party cloud.
        </p>
        {confirming ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-amber-700">This deletes all saved tasks and plans. Are you sure?</p>
            <button
              onClick={() => {
                onClearData()
                setConfirming(false)
                push('info', 'Local data cleared. Sample tasks were loaded.')
              }}
              className="rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Yes, clear it
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-xl px-4 py-2 text-sm text-stone-500 hover:bg-stone-100">
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-red-200 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" /> Clear all local data
          </button>
        )}
      </section>
    </div>
  )
}
