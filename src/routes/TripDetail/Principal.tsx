import { useParams } from 'react-router-dom'

export function Principal() {
  const { tripId } = useParams()

  return (
    <div className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-xl font-semibold text-slate-800">
        {tripId ? 'Datos del viaje' : 'Nuevo viaje'}
      </h1>
      <p className="mt-2 text-slate-500">Formulario en construcción (Fase 4).</p>
    </div>
  )
}
