export class ApiError extends Error {
  readonly status: number
  readonly source: string

  constructor(source: string, status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.source = source
    this.status = status
  }
}

export type QueryParams = Record<string, string | number | boolean | string[] | undefined>

export const buildQuery = (params: QueryParams): string => {
  const search = new URLSearchParams()

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) continue
    if (Array.isArray(value)) {
      if (value.length === 0) continue
      search.set(key, value.join('+'))
      continue
    }
    search.set(key, String(value))
  }

  return search.toString()
}

export const requestJson = async <T>(
  url: string,
  source: string,
  signal?: AbortSignal,
): Promise<T> => {
  let response: Response

  try {
    response = await fetch(url, {
      signal,
      headers: { Accept: 'application/json' },
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    throw new ApiError(source, 0, 'network')
  }

  if (!response.ok) {
    throw new ApiError(source, response.status, response.statusText || 'request failed')
  }

  try {
    return (await response.json()) as T
  } catch {
    throw new ApiError(source, response.status, 'invalid json')
  }
}
