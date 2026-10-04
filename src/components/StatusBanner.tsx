import { useEffect, useState } from 'react'
import { CloudOff, Wifi } from 'lucide-react'
import { detectAI, getAIStatus } from '../lib/ai'

export default function StatusBanner() {
  const [status, setStatus] = useState(getAIStatus())
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let alive = true
    detectAI().then((s) => {
      if (alive) {
        setStatus(s)
        setChecking(false)
      }
    })
    return () => {
      alive = false
    }
  }, [])

  const live = status.mode === 'live'
  return (
    <div
      className={`mb-4 flex items-start gap-2 rounded-xl border p-3 text-sm ${
        live ? 'border-teal-200 bg-teal-50 text-teal-900' : 'border-amber-200 bg-amber-50 text-amber-900'
      }`}
      role="status"
    >
      {live ? <Wifi className="mt-0.5 h-4 w-4 shrink-0" /> : <CloudOff className="mt-0.5 h-4 w-4 shrink-0" />}
      <p>
        <strong>{checking ? 'Checking for local AI…' : live ? `Live local AI (${status.model})` : 'Demo mode — AI answers are built-in examples.'}</strong>{' '}
        {!checking && status.detail}
      </p>
    </div>
  )
}
