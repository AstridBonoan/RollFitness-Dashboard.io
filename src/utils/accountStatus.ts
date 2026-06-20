const ACTIVE_WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export type AccountStatusLabel = 'Onboarded' | 'Pending' | 'Active' | 'Onboarded · Active'

export function deriveAccountStatus(
  onboarded: boolean,
  lastSeenAt: string | null | undefined,
): AccountStatusLabel {
  const isActive =
    lastSeenAt != null && Date.now() - new Date(lastSeenAt).getTime() <= ACTIVE_WINDOW_MS

  if (onboarded && isActive) return 'Onboarded · Active'
  if (onboarded) return 'Onboarded'
  if (isActive) return 'Active'
  return 'Pending'
}
