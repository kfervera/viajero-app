import { useOutletContext, useParams } from 'react-router-dom'
import { ScheduleGrid } from '../../components/ScheduleGrid'
import { useNow } from '../../hooks/useNow'
import type { TripDetailContext } from './index'

export function Horario() {
  const { tripId } = useParams()
  const { trip, activities } = useOutletContext<TripDetailContext>()
  const now = useNow()

  if (!tripId || !trip) return null

  return (
    <div className="mx-auto max-w-2xl px-2 py-4">
      <ScheduleGrid trip={trip} activities={activities} now={now} />
    </div>
  )
}
