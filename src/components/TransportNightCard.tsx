import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { createElement } from 'react'
import { getSubcategoryIcon } from '../lib/activityCategories'
import type { TransportNightEntry } from '../lib/transportNights'

interface TransportNightCardProps {
  entry: TransportNightEntry
}

export function TransportNightCard({ entry }: TransportNightCardProps) {
  const { activity, dayKeys } = entry
  const icon = getSubcategoryIcon(activity.subcategory)

  const range =
    dayKeys.length === 1
      ? format(parseISO(dayKeys[0]), 'd MMM yyyy', { locale: es })
      : `${format(parseISO(dayKeys[0]), 'd MMM', { locale: es })} – ${format(
          parseISO(dayKeys[dayKeys.length - 1]),
          'd MMM yyyy',
          { locale: es },
        )}`

  return (
    <div className="flex items-center gap-3 rounded-xl bg-green-50 p-3 shadow-sm">
      {icon && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-teal-600">
          {createElement(icon, { className: 'h-4 w-4' })}
        </div>
      )}
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800">{activity.summary}</p>
        <p className="text-sm text-slate-500">Noche en tránsito · {range}</p>
      </div>
    </div>
  )
}
