import { format } from 'date-fns'
import { House } from 'lucide-react'
import { type FormEvent, useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { createTrip, getTrip, updateTrip } from '../../data/trips'
import { useOnlineStatus } from '../../hooks/useOnlineStatus'
import type { Trip } from '../../lib/types'

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
  const isNew = tripId === undefined

  const [loadStatus, setLoadStatus] = useState<'loading' | 'ready' | 'error'>(
    isNew ? 'ready' : 'loading',
  )
  const [name, setName] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [startDatetime, setStartDatetime] = useState('')
  const [endDatetime, setEndDatetime] = useState('')
  const [imageError, setImageError] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (isNew || tripId === undefined) return

    let cancelled = false

    getTrip(tripId)
      .then((trip: Trip) => {
        if (cancelled) return
        setName(trip.name)
        setCoverImageUrl(trip.cover_image_url ?? '')
        setStartDatetime(toDatetimeLocal(trip.start_datetime))
        setEndDatetime(toDatetimeLocal(trip.end_datetime))
        setLoadStatus('ready')
      })
      .catch(() => {
        if (!cancelled) setLoadStatus('error')
      })

    return () => {
      cancelled = true
    }
  }, [isNew, tripId])

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
        const trip = await createTrip(tripData)
        navigate(`/viajes/${trip.id}`, { replace: true })
      } else if (tripId) {
        await updateTrip(tripId, tripData)
      }
    } catch {
      setFormError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  if (loadStatus === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-slate-500">Cargando datos del viaje…</p>
      </div>
    )
  }

  if (loadStatus === 'error') {
    return (
      <div className="mx-auto max-w-2xl px-4 py-6">
        <p className="text-slate-500">
          No se pudo cargar este viaje. Revisa tu conexión e intenta de nuevo.
        </p>
      </div>
    )
  }

  const formDisabled = !isOnline || isSaving

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <div className="mb-6 flex items-center gap-2">
        <House className="h-5 w-5 text-sky-600" />
        <h1 className="text-xl font-semibold text-slate-800">
          {isNew ? 'Nuevo viaje' : 'Datos del viaje'}
        </h1>
      </div>

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

        <button
          type="submit"
          disabled={formDisabled}
          className="mt-2 rounded-xl bg-sky-600 px-4 py-2 font-medium text-white shadow-sm disabled:opacity-60"
        >
          {isNew ? 'Crear viaje' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}
