import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type Kind = 'success' | 'error' | 'info'
interface Toast {
  id: number
  kind: Kind
  text: string
}

const Ctx = createContext<{ push: (kind: Kind, text: string) => void }>({ push: () => {} })

export function useToast() {
  return useContext(Ctx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idRef = useRef(0)
  const push = useCallback((kind: Kind, text: string) => {
    const id = ++idRef.current
    setToasts((t) => [...t, { id, kind, text }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500)
  }, [])
  const value = useMemo(() => ({ push }), [push])
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex w-80 flex-col gap-2" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="flex items-start gap-2 rounded-xl border border-stone-200 bg-white p-3 text-sm shadow-md"
          >
            {t.kind === 'success' && <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />}
            {t.kind === 'error' && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />}
            {t.kind === 'info' && <Info className="mt-0.5 h-4 w-4 shrink-0 text-stone-500" />}
            <span className="flex-1">{t.text}</span>
            <button
              aria-label="Dismiss"
              className="text-stone-400 hover:text-stone-600"
              onClick={() => setToasts((ts) => ts.filter((x) => x.id !== t.id))}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  )
}
