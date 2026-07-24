import { differenceInMinutes, format } from 'date-fns'
import { Pencil, Plus, X } from 'lucide-react'
import { type FormEvent, useState } from 'react'
import { createActivity, updateActivity } from '../data/activities'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { ACTIVITY_CATEGORIES, getSubcategoriesFor } from '../lib/activityCategories'
import { formatMinutesAsDuration, parseDurationToMinutes } from '../lib/duration'
import type { Activity } from '../lib/types'

function toDatetimeLocal(isoString: string): string {
  return format(new Date(isoString), "yyyy-MM-dd'T'HH:mm")
}

interface ActivityFormProps {
  tripId: string
  activity?: Activity | null
  onSaved: (activity: Activity) => void
  onCancel: () => void
}

export function ActivityForm({
  tripId,
  activity,
  onSaved,
  onCancel,
}: ActivityFormProps) {
  const isOnline = useOnlineStatus()
  const isEditing = Boolean(activity)

  const [summary, setSummary] = useState(activity?.summary ?? '')
  const [category, setCategory] = useState(activity?.category ?? '')
  const [subcategory, setSubcategory] = useState(activity?.subcategory ?? '')
  const [place, setPlace] = useState(activity?.place ?? '')
  const [mapUrl, setMapUrl] = useState(activity?.map_url ?? '')
  const [phoneNumber, setPhoneNumber] = useState(activity?.phone_number ?? '')
  const [description, setDescription] = useState(activity?.description ?? '')
  const [notes, setNotes] = useState<string[]>(activity?.notes ?? [])
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(
    activity?.evidence_urls ?? [],
  )
  const [startDatetime, setStartDatetime] = useState(
    activity ? toDatetimeLocal(activity.start_datetime) : '',
  )
  const [duration, setDuration] = useState(
    activity
      ? formatMinutesAsDuration(
          differenceInMinutes(
            new Date(activity.end_datetime),
            new Date(activity.start_datetime),
          ),
        )
      : '',
  )
  const [formError, setFormError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const subcategoryOptions = getSubcategoriesFor(category)

  function updateNote(index: number, value: string) {
    setNotes((prev) => prev.map((note, i) => (i === index ? value : note)))
  }

  function removeNote(index: number) {
    setNotes((prev) => prev.filter((_, i) => i !== index))
  }

  function updateEvidence(index: number, value: string) {
    setEvidenceUrls((prev) => prev.map((url, i) => (i === index ? value : url)))
  }

  function removeEvidence(index: number) {
    setEvidenceUrls((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setFormError(null)

    const durationMinutes = parseDurationToMinutes(duration)
    if (durationMinutes === null) {
      setFormError('Duración inválida. Usa un formato como "1h 25m" o "45m".')
      return
    }

    const start = new Date(startDatetime)
    const end = new Date(start.getTime() + durationMinutes * 60_000)

    const activityData = {
      trip_id: tripId,
      summary,
      category: category === '' ? null : category,
      subcategory: subcategory === '' ? null : subcategory,
      description: description.trim() === '' ? null : description.trim(),
      place: place.trim() === '' ? null : place.trim(),
      map_url: mapUrl.trim() === '' ? null : mapUrl.trim(),
      phone_number: phoneNumber.trim() === '' ? null : phoneNumber.trim(),
      notes: notes.map((note) => note.trim()).filter((note) => note !== ''),
      evidence_urls: evidenceUrls
        .map((url) => url.trim())
        .filter((url) => url !== ''),
      start_datetime: start.toISOString(),
      end_datetime: end.toISOString(),
    }

    setIsSaving(true)
    try {
      const saved = activity
        ? await updateActivity(activity.id, activityData)
        : await createActivity(activityData)
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
          <span className="text-sm font-medium text-slate-700">Categoría</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value)
              setSubcategory('')
            }}
            disabled={formDisabled}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          >
            <option value="">Sin categoría</option>
            {ACTIVITY_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-slate-700">
            Subcategoría
          </span>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            disabled={formDisabled || subcategoryOptions.length === 0}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          >
            <option value="">Sin subcategoría</option>
            {subcategoryOptions.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="flex flex-col gap-1">
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

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">Duración</span>
        <input
          type="text"
          required
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          disabled={formDisabled}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
          placeholder="Ej. 1h 25m"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-slate-700">
          {category === 'transport' ? 'Agencia' : 'Lugar'}
        </span>
        <input
          type="text"
          value={place}
          onChange={(e) => setPlace(e.target.value)}
          disabled={formDisabled}
          placeholder={category === 'transport' ? 'Ej. LATAM, Booking.com' : 'Ej. Plaza principal'}
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

      <div className="flex flex-col gap-2">
        <span className="text-sm font-medium text-slate-700">Evidencias</span>
        {evidenceUrls.map((url, index) => (
          <div key={index} className="flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => updateEvidence(index, e.target.value)}
              disabled={formDisabled}
              className="flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 disabled:opacity-60"
              placeholder="https://drive.google.com/…"
            />
            <button
              type="button"
              onClick={() => removeEvidence(index)}
              disabled={formDisabled}
              aria-label="Quitar evidencia"
              className="text-slate-400"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={() => setEvidenceUrls((prev) => [...prev, ''])}
          disabled={formDisabled}
          className="flex items-center gap-1 self-start text-sm font-medium text-teal-600"
        >
          <Plus className="h-4 w-4" />
          Agregar evidencia
        </button>
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

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
          className="flex-1 rounded-xl bg-teal-600 px-4 py-2 font-medium text-white shadow-sm disabled:opacity-60"
        >
          {isEditing ? 'Guardar cambios' : 'Agregar actividad'}
        </button>
      </div>
    </form>
  )
}
