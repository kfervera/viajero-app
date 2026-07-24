import { format } from 'date-fns'
import { type FormEvent, useState } from 'react'
import { Link, useNavigate, useOutletContext, useParams } from 'react-router-dom'
import { createTrip, updateTrip } from '../../data/trips'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import type { TripDetailContext } from './index'

function toDatetimeLocal(isoString: string): string {
  return format(new Date(isoString), "yyyy-MM-dd'T'HH:mm")
}

function toIso(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString()
}

export function Principal() {
  const { tripId } = useParams()
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const { trip, onTripSaved } = useOutletContext<TripDetailContext>()
  const isNew = tripId === undefined

  const [name, setName] = useState(trip?.name ?? '')
  const [coverImageUrl, setCoverImageUrl] = useState(trip?.cover_image_url ?? '')
  const [startDatetime, setStartDatetime] = useState(
    trip ? toDatetimeLocal(trip.start_datetime) : '',
  )
  const [endDatetime, setEndDatetime] = useState(
    trip ? toDatetimeLocal(trip.end_datetime) : '',
  )
  const [imageError, setImageError] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (new Date(endDatetime) <= new Date(startDatetime)) {
      setFormError('La fecha de fin debe ser posterior a la de inicio.')
      return
    }

    const tripData = {
      name,
      cover_image_url: coverImageUrl.trim() === '' ? null : coverImageUrl.trim(),
      start_datetime: toIso(startDatetime),
      end_datetime: toIso(endDatetime),
    }

    setIsSaving(true)
    try {
      if (isNew) {
        const created = await createTrip(tripData)
        navigate(`/viajes/${created.id}`, { replace: true })
      } else if (tripId) {
        const updated = await updateTrip(tripId, tripData)
        onTripSaved(updated)
      }
    } catch {
      setFormError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const formDisabled = !isOnline || isSaving

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      {!isOnline && (
        <p className="mb-4 rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-600">
          Sin conexión. Necesitas internet para crear o editar un viaje.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Nombre</span>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
            placeholder="Ej. Bariloche 2026"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">
            URL de imagen de portada
          </span>
          <input
            type="url"
            value={coverImageUrl}
            onChange={(e) => {
              setCoverImageUrl(e.target.value)
              setImageError(false)
            }}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
            placeholder="https://…"
          />
        </label>

        {coverImageUrl.trim() !== '' && (
          <div className="h-40 w-full overflow-hidden rounded-xl bg-slate-100">
            {imageError ? (
              <p className="flex h-full items-center justify-center px-4 text-center text-sm text-slate-400">
                No se pudo cargar la imagen. Revisa la URL.
              </p>
            ) : (
              <img
                src={coverImageUrl}
                alt="Vista previa de la portada"
                className="h-full w-full object-cover"
                onError={() => setImageError(true)}
              />
            )}
          </div>
        )}

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">
            Fecha y hora de inicio
          </span>
          <input
            type="datetime-local"
            required
            value={startDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          />
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">
            Fecha y hora de fin
          </span>
          <input
            type="datetime-local"
            required
            value={endDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          />
        </label>

        {formError && <p className="text-sm text-red-600">{formError}</p>}

        <div className="mt-2 flex gap-3">
          {isNew && (
            <Link
              to="/"
              className="flex-1 rounded-xl border border-slate-300 px-4 py-2 text-center font-medium text-slate-600"
            >
              Cancelar
            </Link>
          )}
          <button
            type="submit"
            disabled={formDisabled}
            className="flex-1 rounded-xl bg-sky-600 px-4 py-2 font-medium text-white shadow-sm disabled:opacity-60"
          >
            {isNew ? 'Crear viaje' : 'Guardar cambios'}
          </button>
        </div>
      </form>
    </div>
  )
}
