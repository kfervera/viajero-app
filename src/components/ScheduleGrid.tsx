import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { createElement, useEffect, useRef } from 'react'
import { getSubcategoryIcon } from '../lib/activityCategories'
import {
  DAY_HEIGHT_PX,
  SLOT_HEIGHT_PX,
  SLOT_MINUTES,
  getActivitySegmentsForDay,
  getScheduleDays,
  getSlotLabels,
  minutesFromMidnight,
} from '../lib/schedule'
import type { Activity, Trip } from '../lib/types'

interface ScheduleGridProps {
  trip: Trip
  activities: Activity[]
  now: Date
}

const SLOT_LABELS = getSlotLabels()

function isSameCalendarDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

// Vista de solo lectura tipo calendario en modo "Día": una fila por cada día
// del viaje, con columna de fecha + columna de hora (franjas de 30 min, 24
// horas) + columna de actividades, en scroll continuo. Ver PLAN2.md Fase 5.
export function ScheduleGrid({ trip, activities, now }: ScheduleGridProps) {
  const days = getScheduleDays(trip)
  const nowMarkerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    nowMarkerRef.current?.scrollIntoView({ block: 'center' })
  }, [])

  return (
    <div className="flex flex-col">
      {days.map((day) => {
        const segments = getActivitySegmentsForDay(activities, day)
        const isToday = isSameCalendarDay(day, now)

        return (
          <div
            key={day.toISOString()}
            className="flex border-t border-slate-200 first:border-t-0"
          >
            <div className="flex w-8 shrink-0 flex-col items-center justify-center border-r border-slate-200 py-1 text-center">
              <span className="text-[10px] uppercase text-slate-500">
                {format(day, 'EEE', { locale: es })}
              </span>
              <span className="text-sm font-semibold text-slate-700">{format(day, 'd')}</span>
            </div>

            <div className="flex flex-1">
              <div className="w-12 shrink-0">
                {SLOT_LABELS.map((label) => (
                  <div
                    key={label}
                    style={{ height: SLOT_HEIGHT_PX }}
                    className="flex items-start justify-end border-b border-slate-100 pr-1 pt-0.5 text-[10px] text-slate-500"
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div
                className="relative flex-1 border-l border-slate-100"
                style={{ height: DAY_HEIGHT_PX }}
              >
                {SLOT_LABELS.map((label) => (
                  <div
                    key={label}
                    style={{ height: SLOT_HEIGHT_PX }}
                    className="border-b border-slate-100"
                  />
                ))}

                {isToday && (
                  <div
                    ref={nowMarkerRef}
                    aria-hidden="true"
                    className="absolute inset-x-0 z-10 flex items-center gap-1"
                    style={{ top: (minutesFromMidnight(now) / SLOT_MINUTES) * SLOT_HEIGHT_PX }}
                  >
                    <div className="h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    <div className="h-px flex-1 bg-red-500" />
                  </div>
                )}

                {segments.map(({ activity, topPx, heightPx }) => {
                  const icon = getSubcategoryIcon(activity.subcategory)
                  return (
                    <div
                      key={activity.id}
                      className="absolute inset-x-1 overflow-hidden rounded-lg bg-teal-100 px-2 py-0.5 text-teal-800"
                      style={{ top: topPx, height: heightPx }}
                    >
                      <p className="flex items-center gap-1 truncate text-xs font-medium">
                        {icon && createElement(icon, { className: 'h-3 w-3 shrink-0' })}
                        <span className="truncate">{activity.summary}</span>
                      </p>
                      <p className="truncate text-[10px] text-teal-700">
                        {format(new Date(activity.start_datetime), 'HH:mm')}–
                        {format(new Date(activity.end_datetime), 'HH:mm')}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
