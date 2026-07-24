// Formato libre con segmentos "Xh"/"Xm" en cualquier combinación: "1h 25m",
// "45m", "2h". Ver PLAN.md §6.
const SEGMENT_PATTERN = /(\d+)\s*([hm])/gi

export function parseDurationToMinutes(input: string): number | null {
  let totalMinutes = 0
  let matched = false

  for (const match of input.matchAll(SEGMENT_PATTERN)) {
    matched = true
    const value = Number(match[1])
    const unit = match[2].toLowerCase()
    totalMinutes += unit === 'h' ? value * 60 : value
  }

  return matched && totalMinutes > 0 ? totalMinutes : null
}

export function formatMinutesAsDuration(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  const parts: string[] = []

  if (hours > 0) parts.push(`${hours}h`)
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)

  return parts.join(' ')
}
