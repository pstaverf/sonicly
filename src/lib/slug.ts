import type { Source } from '../types'

const TRANSLITERATION: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'h',
  ц: 'c',
  ч: 'ch',
  ш: 'sh',
  щ: 'sch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
}

export const slugify = (value: string): string => {
  const lowered = value.toLowerCase()
  let result = ''

  for (const character of lowered) {
    const mapped = TRANSLITERATION[character]
    result += mapped ?? character
  }

  return result
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

export const buildSlug = (name: string, source: Source, rawId: string): string => {
  const base = slugify(name)
  const suffix = `${source}-${rawId}`
  return base ? `${base}-${suffix}` : suffix
}

export interface ParsedSlug {
  name: string
  source: Source | null
  id: string
}

export const parseSlug = (slug: string): ParsedSlug => {
  // The name of the track may be missing, when the title of the track is
  // written in a script that has no letters of its own.
  const match = /^(?:(.*)-)?(jamendo|audius)-([0-9a-zA-Z]+)$/.exec(slug)

  if (!match) return { name: slug, source: null, id: slug }

  return { name: match[1] ?? '', source: match[2] as Source, id: match[3] }
}
