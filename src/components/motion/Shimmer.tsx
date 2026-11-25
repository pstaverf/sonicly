interface ShimmerProps {
  children: string
  className?: string
}

export const Shimmer = ({ children, className }: ShimmerProps) => (
  <span className={`t-shimmer${className ? ` ${className}` : ''}`} data-text={children}>
    {children}
  </span>
)
