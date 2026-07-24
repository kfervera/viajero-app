import { Outlet, useParams } from 'react-router-dom'
import { BottomTabBar } from '../../components/BottomTabBar'

export function TripDetail() {
  const { tripId } = useParams()

  return (
    <div className="min-h-svh pb-20">
      <Outlet />
      <BottomTabBar tripId={tripId} />
    </div>
  )
}
