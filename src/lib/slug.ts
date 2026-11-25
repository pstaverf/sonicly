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

export const buildSlug = (name: string, id: string): string => {
  const base = slugify(name)
  return base ? `${base}-${id}` : id
}

export const parseSlug = (slug: string): { name: string; id: string } => {
  const match = /^(.*)-([0-9a-zA-Z]+)$/.exec(slug)

  if (!match) return { name: slug, id: slug }

  return { name: match[1], id: match[2] }
}
