import { beforeEach, describe, expect, it, vi } from 'vitest'

const calls = vi.hoisted(() => ({
  upsert: [] as { table: string; payload: unknown; options: unknown }[],
  select: [] as { table: string; columns: string }[],
  remove: [] as { table: string; filters: Record<string, unknown> }[],
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: (table: string) => ({
      select: (columns: string) => {
        calls.select.push({ table, columns })
        const chain = {
          eq: () => chain,
          order: () => Promise.resolve({ data: [], error: null }),
        }
        return chain
      },
      upsert: (payload: unknown, options: unknown) => {
        calls.upsert.push({ table, payload, options })
        return Promise.resolve({ data: null, error: null })
      },
      delete: () => {
        const chain = {
          eq: (column: string, value: unknown) => {
            calls.remove.push({ table, filters: { [column]: value } })
            return chain
          },
        }
        return chain
      },
    }),
  }),
}))

vi.stubEnv('VITE_SUPABASE_URL', 'https://project.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')

const { addRemoteLike, upsertRemotePlaylist } = await import('../lib/supabase')

describe('the library on the server', () => {
  beforeEach(() => {
    calls.upsert.length = 0
    calls.select.length = 0
    calls.remove.length = 0
  })

  it('writes a track that is liked twice into the same row', async () => {
    await addRemoteLike('user-1', 'jamendo:1')

    expect(calls.upsert).toHaveLength(1)
    expect(calls.upsert[0].table).toBe('likes')
    expect(calls.upsert[0].options).toEqual({ onConflict: 'user_id,track_id' })
  })

  it('writes a playlist of the user into the same row', async () => {
    await upsertRemotePlaylist('user-1', {
      id: 'local-1',
      title: 'Микс',
      trackIds: ['jamendo:1'],
      createdAt: 1,
    })

    expect(calls.upsert).toHaveLength(1)
    expect(calls.upsert[0].table).toBe('playlists')
    expect(calls.upsert[0].options).toEqual({ onConflict: 'user_id,id' })
  })
})
