export const formatDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'

  const total = Math.floor(seconds)
  const minutes = Math.floor(total / 60)
  const rest = total % 60

  return `${minutes}:${rest < 10 ? '0' : ''}${rest}`
}

export const formatLongDuration = (seconds: number): string => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0 мин'

  const total = Math.floor(seconds / 60)

  return `${total} мин`
}

export const formatCount = (value: number): string => {
  if (!Number.isFinite(value)) return '0'
  if (value < 1000) return String(value)
  if (value < 1_000_000) return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}K`
  return `${(value / 1_000_000).toFixed(value < 10_000_000 ? 1 : 0)}M`
}

export const formatDate = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  return new Intl.DateTimeFormat('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

export const formatYear = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return String(date.getFullYear())
}
