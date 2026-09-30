import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const { sniffImage } = await import('./api/avatar')

const bytes = (...values: number[]) => new Uint8Array(values)
const ascii = (text: string) => [...text].map((c) => c.charCodeAt(0))

describe('sniffImage', () => {
  it('recognises JPEG, PNG and WebP by their first bytes', () => {
    expect(sniffImage(bytes(0xff, 0xd8, 0xff, 0xe0))).toBe('jpeg')
    expect(sniffImage(bytes(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00))).toBe('png')
    expect(sniffImage(bytes(...ascii('RIFF'), 0, 0, 0, 0, ...ascii('WEBP')))).toBe('webp')
  })

  it('refuses anything else, whatever the file claimed to be', () => {
    expect(sniffImage(bytes(...ascii('<svg xmlns=')))).toBeNull()
    expect(sniffImage(bytes(...ascii('GIF89a')))).toBeNull()
    expect(sniffImage(bytes(0x25, 0x50, 0x44, 0x46))).toBeNull() // %PDF
    expect(sniffImage(bytes())).toBeNull()
  })
})
