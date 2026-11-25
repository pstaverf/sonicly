import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { i18n } from '../i18n'
import type { Language } from '../types'

const sourceFiles = (): string[] => {
  const root = join(process.cwd(), 'src')
  const files: string[] = []

  const walk = (directory: string) => {
    for (const entry of readdirSync(directory)) {
      const path = join(directory, entry)
      if (statSync(path).isDirectory()) {
        if (entry === 'test') continue
        walk(path)
        continue
      }
      if (/\.tsx?$/.test(path) && !path.endsWith('.d.ts')) files.push(path)
    }
  }

  walk(root)
  return files
}

const usedKeys = (): string[] => {
  const keys = new Set<string>()

  for (const file of sourceFiles()) {
    const content = readFileSync(file, 'utf-8')
    for (const match of content.matchAll(/\bt\(\s*'([^']+)'/g)) {
      keys.add(match[1])
    }
  }

  return [...keys]
}

describe('i18n resources', () => {
  it('resolves every key used in the code for both languages', () => {
    const keys = usedKeys()

    expect(keys.length).toBeGreaterThan(20)

    for (const language of ['ru', 'en'] as Language[]) {
      for (const key of keys) {
        const value = i18n.getFixedT(language, key)
        expect(value, `${language}:${key}`).not.toBe(key)
        expect(value.length, `${language}:${key}`).toBeGreaterThan(0)
      }
    }
  })

  it('keeps the ru and en resources in sync', () => {
    const ru = i18n.getResourceBundle('ru', 'translation') as Record<string, unknown>
    const en = i18n.getResourceBundle('en', 'translation') as Record<string, unknown>

    const flatten = (source: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(source).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object') return flatten(value as Record<string, unknown>, path)
        return [path]
      })

    const ruKeys = flatten(ru).sort()
    const enKeys = flatten(en).sort()

    expect(enKeys).toEqual(ruKeys)
  })

  it('does not leave unused keys behind', () => {
    const used = new Set(usedKeys())
    const ru = i18n.getResourceBundle('ru', 'translation') as Record<string, unknown>

    const flatten = (source: Record<string, unknown>, prefix = ''): string[] =>
      Object.entries(source).flatMap(([key, value]) => {
        const path = prefix ? `${prefix}.${key}` : key
        if (value && typeof value === 'object') return flatten(value as Record<string, unknown>, path)
        return [path]
      })

    const unused = flatten(ru).filter((key) => !used.has(key))

    expect(unused).toEqual([])
  })
})
