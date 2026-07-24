import { Plus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ActivityForm } from '../../components/ActivityForm'
import { ActivityTimeline } from '../../components/ActivityTimeline'
import { listActivities } from '../../data/activities'
import type { Activity } from '../../lib/types'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; activity: Activity }

export function Actividades() {
  const { tripId } = useParams()
  const [activities, setActivities] = useState<Activity[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const formRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!tripId) return

    let cancelled = false

    listActivities(tripId)
      .then((data) => {
        if (!cancelled) {
          setActivities(data)
          setStatus('ready')
        }
      })
      .catch(() => {
        if (!cancelled) setStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [tripId])

  function handleSaved(activity: Activity) {
    setActivities((prev) => {
      const exists = prev.some((a) => a.id === activity.id)
      const next = exists
        ? prev.map((a) => (a.id === activity.id ? activity : a))
        : [...prev, activity]
      return next.sort(
        (a, b) =>
          new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
      )
    })
    setFormState({ mode: 'closed' })
  }

  function handleAddNew() {
    setFormState({ mode: 'create' })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function handleEdit(activity: Activity) {
    setFormState({ mode: 'edit', activity })
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  if (!tripId) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div ref={formRef}>
        {formState.mode === 'closed' ? (
          <button
            type="button"
            onClick={handleAddNew}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm"
          >
            <Plus className="h-4 w-4" />
            Nueva actividad
          </button>
        ) : (
          <ActivityForm
            key={formState.mode === 'edit' ? formState.activity.id : 'new'}
            tripId={tripId}
            activity={formState.mode === 'edit' ? formState.activity : null}
            onSaved={handleSaved}
            onCancel={() => setFormState({ mode: 'closed' })}
          />
        )}
      </div>

      <div className="mt-6">
        {status === 'loading' && (
          <p className="text-center text-slate-500">Cargando actividades…</p>
        )}
        {status === 'error' && (
          <p className="text-center text-slate-500">
            No se pudieron cargar las actividades. Revisa tu conexión.
          </p>
        )}
        {status === 'ready' && activities.length === 0 && (
          <p className="text-center text-slate-500">Todavía no hay actividades.</p>
        )}
        {status === 'ready' && activities.length > 0 && (
          <ActivityTimeline
            activities={activities}
            expandedIds={expandedIds}
            onToggleExpand={toggleExpand}
            onEdit={handleEdit}
          />
        )}
      </div>
    </div>
  )
}
