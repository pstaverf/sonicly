import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'

interface SectionHeaderProps {
  title: string
  description?: string
  action?: { label: string; to: string }
  onAction?: () => void
  children?: ReactNode
}

export const SectionHeader = ({
  title,
  description,
  action,
  onAction,
  children,
}: SectionHeaderProps) => (
  <div className="mb-4 flex items-end justify-between gap-4">
    <div>
      <h2 className="text-xl font-bold tracking-tight text-balance sm:text-2xl">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
    </div>
    {action && !onAction && (
      <Link
        to={action.to}
        className="shrink-0 text-sm font-medium text-accent transition-spring hover:opacity-80"
      >
        {action.label}
      </Link>
    )}
    {action && onAction && (
      <button
        type="button"
        onClick={onAction}
        className="shrink-0 text-sm font-medium text-accent transition-spring hover:opacity-80"
      >
        {action.label}
      </button>
    )}
    {children}
  </div>
)
