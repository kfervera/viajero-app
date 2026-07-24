import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ActivityForm } from '../../components/ActivityForm'
import { ActivityTimeline } from '../../components/ActivityTimeline'
import { listActivities } from '../../data/activities'
import type { Activity } from '../../lib/types'

export function Actividades() {
  const { tripId } = useParams()
  const [activities, setActivities] = useState<Activity[]>([])
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
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
    setEditingActivity(null)
  }

  function handleEdit(activity: Activity) {
    setEditingActivity(activity)
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
        <ActivityForm
          key={editingActivity?.id ?? 'new'}
          tripId={tripId}
          activity={editingActivity}
          onSaved={handleSaved}
          onCancelEdit={() => setEditingActivity(null)}
        />
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
