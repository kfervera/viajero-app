import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { ExternalLink, MapPin, MessageCircle, Pencil } from 'lucide-react'
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
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-800">{lodging.name}</p>
          <p className="text-sm text-slate-500">{range}</p>
          {lodging.notes && (
            <p className="mt-1 text-sm text-slate-600">{lodging.notes}</p>
          )}
          {lodging.evidence.length > 0 && (
            <div className="mt-1 flex flex-col gap-1">
              {lodging.evidence.map((item, index) => (
                <a
                  key={index}
                  href={item.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 text-sm text-indigo-600"
                >
                  <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{item.name.trim() || 'Evidencia'}</span>
                </a>
              ))}
            </div>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-3 pt-0.5">
          {lodging.map_url && (
            <a
              href={lodging.map_url}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir mapa"
              className="text-indigo-600"
            >
              <MapPin className="h-4 w-4" />
            </a>
          )}
          {lodging.phone_number && (
            <a
              href={`https://wa.me/${lodging.phone_number}`}
              target="_blank"
              rel="noreferrer"
              aria-label="Abrir WhatsApp"
              className="text-indigo-600"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          )}
          <button
            type="button"
            onClick={onEdit}
            aria-label="Editar estadía"
            className="text-indigo-600"
          >
            <Pencil className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
