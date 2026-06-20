import { cn } from '@/utils/cn'

interface FilterOption<T extends string> {
  value: T
  label: string
}

interface FilterDropdownProps<T extends string> {
  id: string
  label: string
  value: T
  options: FilterOption<T>[]
  onChange: (value: T) => void
  className?: string
}

export function FilterDropdown<T extends string>({
  id,
  label,
  value,
  options,
  onChange,
  className,
}: FilterDropdownProps<T>) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <label htmlFor={id} className="text-xs font-medium text-carbon-600 dark:text-steel-400">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="touch-target rounded-xl border border-carbon-300 bg-white px-3 py-2.5 text-sm text-carbon-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 dark:border-white/15 dark:bg-carbon-900 dark:text-steel-100"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
