import { Pencil } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { createLodging, updateLodging } from '../data/lodgings'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import type { Lodging } from '../lib/types'

interface LodgingFormProps {
  tripId: string
  tripStartDate: string
  tripEndDate: string
  lodging?: Lodging | null
  onSaved: (lodging: Lodging) => void
  onCancel: () => void
}

export function LodgingForm({
  tripId,
  tripStartDate,
  tripEndDate,
  lodging,
  onSaved,
  onCancel,
}: LodgingFormProps) {
  const isOnline = useOnlineStatus()
  const isEditing = Boolean(lodging)

  const [name, setName] = useState(lodging?.name ?? '')
  const [checkinDate, setCheckinDate] = useState(lodging?.checkin_date ?? '')
  const [checkoutDate, setCheckoutDate] = useState(lodging?.checkout_date ?? '')
  const [mapUrl, setMapUrl] = useState(lodging?.map_url ?? '')
  const [phoneNumber, setPhoneNumber] = useState(lodging?.phone_number ?? '')
  const [notes, setNotes] = useState(lodging?.notes ?? '')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (checkoutDate <= checkinDate) {
      setFormError('El checkout debe ser posterior al checkin.')
      return
    }

    if (checkinDate < tripStartDate || checkoutDate > tripEndDate) {
      setFormError('La estadía debe estar dentro de las fechas del viaje.')
      return
    }

    const lodgingData = {
      trip_id: tripId,
      name,
      checkin_date: checkinDate,
      checkout_date: checkoutDate,
      map_url: mapUrl.trim() === '' ? null : mapUrl.trim(),
      phone_number: phoneNumber.trim() === '' ? null : phoneNumber.trim(),
      notes: notes.trim() === '' ? null : notes.trim(),
    }

    setIsSaving(true)
    try {
      const saved = lodging
        ? await updateLodging(lodging.id, lodgingData)
        : await createLodging(lodgingData)
      onSaved(saved)
    } catch {
      setFormError('No se pudo guardar. Revisa tu conexión e intenta de nuevo.')
    } finally {
      setIsSaving(false)
    }
  }

  const formDisabled = !isOnline || isSaving

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm"
    >
      {isEditing && (
        <div className="flex items-center gap-2 text-sm font-medium text-indigo-600">
          <Pencil className="h-4 w-4" />
          Editando estadía
        </div>
      )}

      {!isOnline && (
        <p className="rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-600">
          Sin conexión. Necesitas internet para guardar estadías.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">
          Nombre / lugar
        </span>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          placeholder="Ej. Hotel Central"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Check-in</span>
        <input
          type="date"
          required
          min={tripStartDate}
          max={tripEndDate}
          value={checkinDate}
          onChange={(e) => setCheckinDate(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Check-out</span>
        <input
          type="date"
          required
          min={tripStartDate}
          max={tripEndDate}
          value={checkoutDate}
          onChange={(e) => setCheckoutDate(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">URL de mapa</span>
        <input
          type="url"
          value={mapUrl}
          onChange={(e) => setMapUrl(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          placeholder="https://maps.google.com/…"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Contacto</span>
        <input
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          placeholder="Ej. 5491122334455"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Notas</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          disabled={formDisabled}
          rows={2}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
        />
      </label>

      {formError && (
        <p role="alert" className="text-sm text-red-600">
          {formError}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-600"
        >
          {isEditing ? 'Cancelar edición' : 'Cancelar'}
        </button>
        <button
          type="submit"
          disabled={formDisabled}
          className="flex-1 rounded-xl bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm disabled:opacity-60"
        >
          {isEditing ? 'Guardar cambios' : 'Agregar estadía'}
        </button>
      </div>
    </form>
  )
}
