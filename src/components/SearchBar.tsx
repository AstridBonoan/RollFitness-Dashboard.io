import { cn } from '@/utils/cn'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
}

export function SearchBar({
  value,
  onChange,
  placeholder = 'Search…',
  id = 'search',
  className,
}: SearchBarProps) {
  return (
    <label htmlFor={id} className={cn('block', className)}>
      <span className="sr-only">{placeholder}</span>
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="touch-target w-full rounded-xl border border-carbon-300 bg-white px-4 py-2.5 text-sm text-carbon-900 placeholder:text-carbon-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/15 dark:bg-carbon-900 dark:text-steel-100 dark:placeholder:text-steel-500"
      />
    </label>
  )
}
