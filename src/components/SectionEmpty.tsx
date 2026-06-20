interface SectionEmptyProps {
  message: string
  className?: string
}

export function SectionEmpty({ message, className = '' }: SectionEmptyProps) {
  return (
    <div
      className={`flex min-h-[16rem] items-center justify-center rounded-xl border border-dashed border-carbon-200 bg-carbon-50/40 px-6 py-10 text-center dark:border-white/10 dark:bg-white/5 ${className}`}
      role="status"
    >
      <p className="text-sm text-carbon-500 dark:text-steel-400">{message}</p>
    </div>
  )
}
