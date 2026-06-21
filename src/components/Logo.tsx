import { site } from '@/data/site'

interface LogoProps {
  variant?: 'compact' | 'full'
  className?: string
  showAdminBadge?: boolean
}

const MARK_WIDTH = 520
const MARK_HEIGHT = 251

const cache = 'mark-v5'
const base = import.meta.env.BASE_URL
const mark1x = `${base}rolln-logo-mark.png?v=${cache}`
const mark2x = `${base}rolln-logo-mark@2x.png?v=${cache}`

function BrandText({ stacked }: { stacked?: boolean }) {
  if (stacked) {
    return (
      <span className="font-display text-2xl font-bold tracking-tight text-brand-900 dark:text-white sm:text-3xl">
        {site.name}
      </span>
    )
  }

  return (
    <span className="block truncate font-display text-base font-bold tracking-tight text-brand-900 dark:text-white sm:text-lg">
      {site.name}
    </span>
  )
}

function LogoMark({ className }: { className: string }) {
  return (
    <img
      src={mark1x}
      srcSet={`${mark1x} 1x, ${mark2x} 2x`}
      width={MARK_WIDTH}
      height={MARK_HEIGHT}
      alt=""
      aria-hidden="true"
      decoding="async"
      fetchPriority="high"
      className={className}
    />
  )
}

export function Logo({ variant = 'compact', className = '', showAdminBadge = false }: LogoProps) {
  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center gap-5 text-center ${className}`}>
        <LogoMark className="h-32 w-auto max-w-full shrink-0 sm:h-40 lg:h-44" />
        <BrandText stacked />
        {showAdminBadge ? (
          <span className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-brand-700 dark:border-brand-600/40 dark:bg-brand-950/50 dark:text-brand-300">
            Admin
          </span>
        ) : null}
        <span className="sr-only">{site.logoAlt}</span>
      </div>
    )
  }

  return (
    <div className={`flex min-w-0 items-center gap-2.5 sm:gap-3 ${className}`}>
      <LogoMark className="h-10 w-auto max-w-[5rem] shrink-0 sm:h-11 sm:max-w-[5.75rem]" />
      <div className="min-w-0">
        <BrandText />
        {showAdminBadge ? (
          <p className="truncate text-[10px] font-semibold uppercase tracking-wider text-carbon-500 dark:text-steel-400 sm:text-xs">
            Admin
          </p>
        ) : null}
      </div>
      <span className="sr-only">{site.logoAlt}</span>
    </div>
  )
}

export function LogoMarkOnly({ className = 'h-10 w-auto' }: { className?: string }) {
  return (
    <>
      <LogoMark className={className} />
      <span className="sr-only">{site.logoAlt}</span>
    </>
  )
}
