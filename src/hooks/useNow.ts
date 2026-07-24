import { useEffect, useState } from 'react'

// Refresca cada minuto: suficiente para que el semáforo y la actividad en
// curso del Home avancen sin recargar la página, sin sobrecargar de renders.
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
