import { NumberPopIn } from './NumberPopIn'

interface NotificationBadgeProps {
  count: number
  className?: string
}

export const NotificationBadge = ({ count, className }: NotificationBadgeProps) => {
  const open = count > 0

  return (
    <span className={`t-badge${className ? ` ${className}` : ''}`} data-open={open}>
      <span className="t-badge-dot">
        <NumberPopIn value={String(count)} />
      </span>
    </span>
  )
}
