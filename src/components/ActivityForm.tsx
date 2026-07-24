import { format } from 'date-fns'
import { Pencil, Plus, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { createActivity, updateActivity } from '../data/activities'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import type { Activity } from '../lib/types'

function toDatetimeLocal(isoString: string): string {
  return format(new Date(isoString), "yyyy-MM-dd'T'HH:mm")
}

function toIso(datetimeLocal: string): string {
  return new Date(datetimeLocal).toISOString()
}

interface ActivityFormProps {
  tripId: string
  activity?: Activity | null
  onSaved: (activity: Activity) => void
  onCancelEdit: () => void
}

export function ActivityForm({
  tripId,
  activity,
  onSaved,
  onCancelEdit,
}: ActivityFormProps) {
  const isOnline = useOnlineStatus()
  const isEditing = Boolean(activity)

  const [summary, setSummary] = useState(activity?.summary ?? '')
  const [place, setPlace] = useState(activity?.place ?? '')
  const [mapUrl, setMapUrl] = useState(activity?.map_url ?? '')
  const [agency, setAgency] = useState(activity?.agency ?? '')
  const [phoneNumber, setPhoneNumber] = useState(activity?.phone_number ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [notes, setNotes] = useState<string[]>(activity?.notes ?? [])
  const [startDatetime, setStartDatetime] = useState(
    activity ? toDatetimeLocal(activity.start_datetime) : '',
  )
  const [endDatetime, setEndDatetime] = useState(
    activity ? toDatetimeLocal(activity.end_datetime) : '',
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  function updateNote(index: number, value: string) {
    setNotes((prev) => prev.map((note, i) => (i === index ? value : note)))
  }

  function removeNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index))
  }

  function resetForm() {
    setSummary('')
    setPlace('')
    setMapUrl('')
    setAgency('')
    setPhoneNumber('')
    setDescription('')
    setNotes([])
    setStartDatetime('')
    setEndDatetime('')
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    if (new Date(endDatetime) <= new Date(startDatetime)) {
      setFormError('La fecha de fin debe ser posterior a la de inicio.')
      return
    }

    const activityData = {
      trip_id: tripId,
      summary,
      description: description.trim() === '' ? null : description.trim(),
      place: place.trim() === '' ? null : place.trim(),
      map_url: mapUrl.trim() === '' ? null : mapUrl.trim(),
      agency: agency.trim() === '' ? null : agency.trim(),
      phone_number: phoneNumber.trim() === '' ? null : phoneNumber.trim(),
      notes: notes.map((note) => note.trim()).filter((note) => note !== ''),
      start_datetime: toIso(startDatetime),
      end_datetime: toIso(endDatetime),
    }

    setIsSaving(true)
    try {
      const saved = activity
        ? await updateActivity(activity.id, activityData)
        : await createActivity(activityData)
      if (!activity) resetForm()
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
        <div className="flex items-center gap-2 text-sm font-medium text-teal-600">
          <Pencil className="h-4 w-4" />
          Editando actividad
        </div>
      )}

      {!isOnline && (
        <p className="rounded-xl bg-slate-200 px-3 py-2 text-sm text-slate-600">
          Sin conexión. Necesitas internet para guardar actividades.
        </p>
      )}

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Summary</span>
        <input
          type="text"
          required
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          placeholder="Ej. City tour"
        />
      </label>

      <div className="flex gap-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Inicio</span>
          <input
            type="datetime-local"
            required
            value={startDatetime}
            onChange={(e) => setStartDatetime(e.target.value)}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          />
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">Fin</span>
          <input
            type="datetime-local"
            required
            value={endDatetime}
            onChange={(e) => setEndDatetime(e.target.value)}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          />
        </label>
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Lugar</span>
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
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
        <span className="text-sm font-medium text-slate-700">Agencia</span>
        <input
          type="text"
          value={agency}
          onChange={(e) => setAgency(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Número</span>
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
        <span className="text-sm font-medium text-slate-700">Descripción</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={formDisabled}
          rows={3}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
        />
      </label>

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Notas</span>
        {notes.map((note, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="text"
              value={note}
              onChange={(e) => updateNote(index, e.target.value)}
              disabled={formDisabled}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => removeNote(index)}
              disabled={formDisabled}
              aria-label="Quitar nota"
              className="text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setNotes((prev) => [...prev, ''])}
          disabled={formDisabled}
          className="flex items-center gap-1 self-start text-sm font-medium text-teal-600"
        >
          <Plus className="h-4 w-4" />
          Agregar nota
        </button>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-3">
        {isEditing && (
          <button
            type="button"
            onClick={onCancelEdit}
            className="flex-1 rounded-xl border border-slate-300 px-4 py-2 font-medium text-slate-600"
          >
            Cancelar edición
          </button>
        )}
        <button
          type="submit"
          disabled={formDisabled}
          className="flex-1 rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm disabled:opacity-60"
        >
          {isEditing ? 'Guardar cambios' : 'Agregar actividad'}
        </button>
      </div>
    </form>
  )
}
