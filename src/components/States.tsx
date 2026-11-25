import { useTranslation } from 'react-i18next'

import { Shimmer } from './motion/Shimmer'

interface SkeletonCardProps {
  count?: number
}

export const SkeletonGrid = ({ count = 8 }: SkeletonCardProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <Shimmer className="mb-4 text-sm" >{t('loading')}</Shimmer>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex flex-col gap-3">
            <div className="skeleton aspect-square rounded-xl" />
            <div className="skeleton h-3 w-3/4 rounded-full" />
            <div className="skeleton h-3 w-1/2 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export const SkeletonRows = ({ count = 6 }: SkeletonCardProps) => {
  const { t } = useTranslation()

  return (
    <div>
      <Shimmer className="mb-4 text-sm">{t('loading')}</Shimmer>
      <div className="space-y-2">
        {Array.from({ length: count }, (_, index) => (
          <div key={index} className="flex items-center gap-3 px-3 py-2">
            <div className="skeleton size-10 rounded-lg" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3 w-1/3 rounded-full" />
              <div className="skeleton h-3 w-1/4 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ErrorStateProps {
  message?: string
  onRetry: () => void
}

export const ErrorState = ({ message, onRetry }: ErrorStateProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl glass border border-white/10 px-6 py-12 text-center">
      <span className="text-3xl" aria-hidden="true">
        ⚠
      </span>
      <div>
        <p className="font-semibold">{t('error.title')}</p>
        <p className="mt-1 text-sm text-muted">{message ?? t('error.network')}</p>
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="rounded-xl bg-accent px-5 py-2 text-sm font-semibold text-white transition-spring hover:opacity-90"
      >
        {t('error.retry')}
      </button>
    </div>
  )
}

interface EmptyStateProps {
  title?: string
  description?: string
}

export const EmptyState = ({ title, description }: EmptyStateProps) => {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl glass border border-white/10 px-6 py-12 text-center">
      <span className="text-3xl" aria-hidden="true">
        ♪
      </span>
      <div>
        <p className="font-semibold">{title ?? t('empty.title')}</p>
        <p className="mt-1 text-sm text-muted">{description ?? t('empty.description')}</p>
      </div>
    </div>
  )
}
