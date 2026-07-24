import { Plus } from 'lucide-react'
import { useRef, useState } from 'react'
import { useOutletContext, useParams } from 'react-router-dom'
import { ActivityForm } from '../../components/ActivityForm'
import { ActivityTimeline } from '../../components/ActivityTimeline'
import type { Activity } from '../../lib/types'
import type { TripDetailContext } from './index'

type FormState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; activity: Activity }

export function Actividades() {
  const { tripId } = useParams()
  const { activities, onActivitiesChanged } = useOutletContext<TripDetailContext>()
  const [formState, setFormState] = useState<FormState>({ mode: 'closed' })
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const formRef = useRef<HTMLDivElement>(null)

  function handleSaved(activity: Activity) {
    const exists = activities.some((a) => a.id === activity.id)
    const next = exists
      ? activities.map((a) => (a.id === activity.id ? activity : a))
      : [...activities, activity]
    onActivitiesChanged(
      next.sort(
        (a, b) => new Date(a.start_datetime).getTime() - new Date(b.start_datetime).getTime(),
      ),
    )
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
        {activities.length === 0 && (
          <p className="text-center text-slate-500">Todavía no hay actividades.</p>
        )}
        {activities.length > 0 && (
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
