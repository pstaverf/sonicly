import { Link } from 'react-router-dom'

interface CoverCardProps {
  title: string
  subtitle: string
  to: string
  coverUrl: string
  meta?: string
  kind: 'album' | 'artist' | 'playlist'
}

export const CoverCard = ({ title, subtitle, to, coverUrl, meta, kind }: CoverCardProps) => (
  <Link
    to={to}
    className="group flex flex-col gap-3"
    aria-label={`${title} — ${subtitle}`}
  >
    <div className="relative aspect-square overflow-hidden rounded-xl bg-white/5">
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={title}
          className="size-full object-cover transition-spring group-hover:scale-105"
          loading="lazy"
          decoding="async"
          width={300}
          height={300}
        />
      ) : (
        <div
          className="flex size-full items-center justify-center bg-linear-to-br from-accent/30 to-accent/5 text-3xl"
          aria-hidden="true"
        >
          {kind === 'artist' ? '👤' : kind === 'playlist' ? '📀' : '💿'}
        </div>
      )}
    </div>

    <div>
      <p className="truncate text-sm font-semibold">{title}</p>
      <p className="truncate text-xs text-muted">{subtitle}</p>
      {meta && <p className="truncate text-xs text-muted tabular-nums">{meta}</p>}
    </div>
  </Link>
)
