import type { PostgrestError } from '@supabase/supabase-js'
import type { TimeSeriesPoint } from '@/types'

/** PostgREST returns 404 / PGRST202 when an RPC has not been created yet. */
export function isMissingRpcError(error: PostgrestError | null | undefined): boolean {
  if (!error) return false
  return (
    error.code === 'PGRST202' ||
    error.message?.toLowerCase().includes('could not find the function') ||
    (error as { status?: number }).status === 404
  )
}

export function daysAgoIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

export function bucketByDay(
  rows: { at: string }[],
  days: number,
): TimeSeriesPoint[] {
  const start = new Date(daysAgoIso(days))
  const buckets = new Map<string, number>()

  for (const row of rows) {
    const at = new Date(row.at)
    if (at < start) continue
    const day = at.toISOString().slice(0, 10)
    buckets.set(day, (buckets.get(day) ?? 0) + 1)
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, count]) => ({ day, count }))
}
