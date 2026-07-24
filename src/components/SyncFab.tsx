import { Check, RefreshCw, TriangleAlert } from 'lucide-react'
import { useState } from 'react'

type SyncState = 'idle' | 'syncing' | 'success' | 'error'

interface SyncFabProps {
  onSync: () => Promise<void>
  disabled: boolean
}

export function SyncFab({ onSync, disabled }: SyncFabProps) {
  const [state, setState] = useState<SyncState>('idle')

  async function handleClick() {
    if (disabled || state === 'syncing') return
    setState('syncing')
    try {
      await onSync()
      setState('success')
      setTimeout(() => setState('idle'), 2000)
    } catch {
      setState('error')
      setTimeout(() => setState('idle'), 2500)
    }
  }

  const Icon = state === 'success' ? Check : state === 'error' ? TriangleAlert : RefreshCw

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || state === 'syncing'}
      aria-label="Sincronizar viaje para verlo sin conexión"
      className="fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-md disabled:opacity-50"
    >
      <Icon className={`h-6 w-6 ${state === 'syncing' ? 'animate-spin' : ''}`} />
    </button>
  )
}
