export type MembershipPlanId = 'free' | 'sports-plan' | 'rollnfitness-plus'

export const MEMBERSHIP_PLANS: Record<
  MembershipPlanId,
  { label: string; description: string; badgeClass: string }
> = {
  free: {
    label: 'Free',
    description: 'Core adaptive workouts, progress tracking, and nutrition guidance.',
    badgeClass:
      'bg-carbon-100 text-carbon-800 ring-carbon-200 dark:bg-white/10 dark:text-slate-200 dark:ring-white/15',
  },
  'sports-plan': {
    label: 'Sports Plan',
    description:
      'Sport-specific training programs with periodized blocks, competition prep, and performance tracking.',
    badgeClass:
      'bg-vitality-100 text-vitality-900 ring-vitality-200 dark:bg-vitality-950/50 dark:text-vitality-300 dark:ring-vitality-700/40',
  },
  'rollnfitness-plus': {
    label: 'RollnFitness+',
    description: 'Premium movement intelligence, advanced analytics, and personalized coaching.',
    badgeClass:
      'bg-accent-100 text-accent-800 ring-accent-200 dark:bg-accent-950/60 dark:text-accent-300 dark:ring-accent-700/40',
  },
}

export function normalizeMembershipPlan(value: string | null | undefined): MembershipPlanId {
  if (value === 'rollnfitness-plus') return 'rollnfitness-plus'
  if (value === 'sports-plan') return 'sports-plan'
  return 'free'
}

export function membershipPlanLabel(value: string | null | undefined): string {
  return MEMBERSHIP_PLANS[normalizeMembershipPlan(value)].label
}
