import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { ActivityCard } from './ActivityCard'
import type { Activity } from '../lib/types'

interface ActivityTimelineProps {
  activities: Activity[]
  expandedIds: Set<string>
  onToggleExpand: (id: string) => void
  onEdit: (activity: Activity) => void
}

export function ActivityTimeline({
  activities,
  expandedIds,
  onToggleExpand,
  onEdit,
}: ActivityTimelineProps) {
  // `activities` ya viene ordenado por start_datetime desde Supabase, así
  // que un Map conserva el orden cronológico dentro de cada día sin resortear.
  const groups = new Map<string, { date: Date; activities: Activity[] }>()

  for (const activity of activities) {
    const date = new Date(activity.start_datetime)
    const key = format(date, 'yyyy-MM-dd')
    const group = groups.get(key)
    if (group) {
      group.activities.push(activity)
    } else {
      groups.set(key, { date, activities: [activity] })
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {[...groups.entries()].map(([key, group]) => (
        <div key={key}>
          <h2 className="mb-2 text-sm font-semibold text-slate-500 first-letter:uppercase">
            {format(group.date, "EEEE d 'de' MMMM", { locale: es })}
          </h2>
          <div className="flex flex-col gap-2">
            {group.activities.map((activity) => (
              <ActivityCard
                key={activity.id}
                activity={activity}
                expanded={expandedIds.has(activity.id)}
                onToggleExpand={() => onToggleExpand(activity.id)}
                onEdit={() => onEdit(activity)}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
