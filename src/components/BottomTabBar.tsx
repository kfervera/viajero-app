import { BedDouble, CalendarDays, House } from 'lucide-react'
import { NavLink } from 'react-router-dom'

interface BottomTabBarProps {
  tripId?: string
}

const ACTIVE_TEXT_COLOR: Record<string, string> = {
  principal: 'text-sky-600',
  actividades: 'text-teal-600',
  estadia: 'text-indigo-600',
}

export function BottomTabBar({ tripId }: BottomTabBarProps) {
  const tabs = [
    {
      key: 'principal',
      label: 'Principal',
      icon: House,
      to: tripId ? `/viajes/${tripId}` : '/viajes/nuevo',
      end: true,
    },
    {
      key: 'actividades',
      label: 'Actividades',
      icon: CalendarDays,
      to: tripId ? `/viajes/${tripId}/actividades` : undefined,
      end: false,
    },
    {
      key: 'estadia',
      label: 'Estadía',
      icon: BedDouble,
      to: tripId ? `/viajes/${tripId}/estadia` : undefined,
      end: false,
    },
  ]

  return (
    <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white">
      {tabs.map(({ key, label, icon: Icon, to, end }) => {
        if (!to) {
          return (
            <span
              key={key}
              className="flex flex-1 flex-col items-center gap-1 py-2 text-xs text-slate-300"
            >
              <Icon className="h-5 w-5" />
              {label}
            </span>
          )
        }

        return (
          <NavLink
            key={key}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-1 py-2 text-xs ${
                isActive ? ACTIVE_TEXT_COLOR[key] : 'text-slate-500'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        )
      })}
    </nav>
  )
}
