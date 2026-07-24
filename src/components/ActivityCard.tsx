import { format } from 'date-fns'
import { MapPin, MessageCircle, Pencil } from 'lucide-react'
import type { Activity } from '../lib/types'

interface ActivityCardProps {
  activity: Activity
  expanded: boolean
  onToggleExpand: () => void
  onEdit: () => void
}

export function ActivityCard({
  activity,
  expanded,
  onToggleExpand,
  onEdit,
}: ActivityCardProps) {
  const timeRange = `${format(new Date(activity.start_datetime), 'HH:mm')} – ${format(
    new Date(activity.end_datetime),
    'HH:mm',
  )}`

  const hasExpandedContent =
    activity.description || activity.agency || activity.notes.length > 0

  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={onToggleExpand}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-xs text-slate-500">{timeRange}</p>
          <p className="truncate font-medium text-slate-800">{activity.summary}</p>
          {activity.place && (
            <p className="truncate text-sm text-slate-500">{activity.place}</p>
          )}
        </button>

        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          {activity.map_url && (
            <a
              href={activity.map_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir mapa"
              className="text-teal-600"
            >
              <MapPin className="h-4 w-4" />
            </a>
          )}
          {activity.phone_number && (
            <a
              href={`https://wa.me/${activity.phone_number}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir WhatsApp"
              className="text-teal-600"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar actividad"
            className="text-teal-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>

      {expanded && hasExpandedContent && (
        <div className="mt-3 flex flex-col gap-2 border-t border-slate-100 pt-3 text-sm text-slate-600">
          {activity.description && <p>{activity.description}</p>}
          {activity.agency && (
            <p>
              <span className="font-medium text-slate-700">Agencia: </span>
              {activity.agency}
            </p>
          )}
          {activity.notes.length > 0 && (
            <ul className="list-disc pl-4">
              {activity.notes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
