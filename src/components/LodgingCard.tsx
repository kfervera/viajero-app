import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { Pencil } from 'lucide-react'
import type { Lodging } from '../lib/types'

interface LodgingCardProps {
  lodging: Lodging
  onEdit: () => void
}

export function LodgingCard({ lodging, onEdit }: LodgingCardProps) {
  // checkin_date/checkout_date son `date` (sin hora): parseISO las lee como
  // medianoche LOCAL. `new Date(...)` las lee como medianoche UTC y
  // desplazaba un día para atrás en husos horarios negativos.
  const range = `${format(parseISO(lodging.checkin_date), 'd MMM', { locale: es })} – ${format(
    parseISO(lodging.checkout_date),
    'd MMM yyyy',
    { locale: es },
  )}`

  return (
    <div className="flex items-start justify-between gap-2 rounded-xl bg-white p-3 shadow-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-slate-800">{lodging.name}</p>
        <p className="text-sm text-slate-500">{range}</p>
        {lodging.notes && (
          <p className="mt-1 text-sm text-slate-600">{lodging.notes}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label="Editar estadía"
        className="shrink-0 text-indigo-600"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </div>
  )
}
