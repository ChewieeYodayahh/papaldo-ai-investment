import { describe, expect, it } from 'vitest'

import { isAllowedReturnPath } from './api/return-to'
import { hasUsername, isSetupComplete } from './api/profile'
import { formatAmount, formatIncome, parseAmount, toDisplay } from './income'
import { OCCUPATIONS } from './occupations'
import { passwordChangeSchema, profileUpdateSchema, signUpSchema } from './schema'
import type { UserProfile } from './types'

const complete: UserProfile = {
  id: 'u1',
  email: 'juan@example.com',
  username: 'juan',
  contact: '+63 917 000 0000',
  occupation: 'Nurse',
  occupations: ['Nurse'],
  annualIncome: { amount: 480000, currency: 'PHP' },
  idealIncome: { amount: 1200000, currency: 'PHP' },
  avatarUrl: null,
  website: null,
  isPrivate: false,
}

describe('profile social fields (2026-09-30)', () => {
  it('accepts an https website and clears it with an empty string', () => {
    expect(profileUpdateSchema.parse({ website: 'https://example.com/me' }).website).toBe('https://example.com/me')
    expect(profileUpdateSchema.parse({ website: '' }).website).toBeNull()
  })

  it('refuses links that are not http(s), even ones URL parsing accepts', () => {
    for (const website of ['javascript:alert(1)', 'ftp://example.com', 'example.com', 'https://has space.com']) {
      expect(profileUpdateSchema.safeParse({ website }).success).toBe(false)
    }
  })

  it('takes up to three occupations', () => {
    expect(profileUpdateSchema.safeParse({ occupations: ['Nurse', 'Writer', 'Student'] }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({ occupations: ['A', 'B', 'C', 'D'] }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ occupations: ['  '] }).success).toBe(false)
  })

  it('accepts the Private switch on its own', () => {
    expect(profileUpdateSchema.parse({ isPrivate: true }).isPrivate).toBe(true)
  })
})

describe('return path after an auth round trip', () => {
  it('accepts the profile page, with or without a query', () => {
    expect(isAllowedReturnPath('/profile')).toBe(true)
    expect(isAllowedReturnPath('/profile?security=confirmed')).toBe(true)
  })

  it('refuses anything that could leave the app or reach an unlisted page', () => {
    for (const path of ['https://evil.example', '//evil.example/profile', 'profile', '/dashboard', '/profile/../admin']) {
      expect(isAllowedReturnPath(path)).toBe(false)
    }
  })
})

describe('setup completeness (Get Started 1/3)', () => {
  it('needs every setup field', () => {
    expect(isSetupComplete(complete)).toBe(true)
    for (const field of ['contact', 'occupation', 'annualIncome', 'idealIncome'] as const) {
      expect(isSetupComplete({ ...complete, [field]: null })).toBe(false)
    }
  })

  it('gates the app on the username alone', () => {
    expect(hasUsername({ username: 'juan' })).toBe(true)
    expect(hasUsername({ username: null })).toBe(false)
    expect(hasUsername(null)).toBe(false)
  })
})

describe('income input', () => {
  it('groups thousands and keeps at most two decimals while typing', () => {
    expect(formatAmount('1234567')).toBe('1,234,567')
    expect(formatAmount('1234567.891')).toBe('1,234,567.89')
    expect(formatAmount('00012a3')).toBe('123')
    expect(formatAmount('')).toBe('')
  })

  it('parses what it formats, and nothing else', () => {
    expect(parseAmount('1,234,567.89')).toBe(1234567.89)
    expect(parseAmount('')).toBeNull()
    expect(parseAmount('.')).toBeNull()
    expect(toDisplay(480000)).toBe('480,000')
    expect(toDisplay(null)).toBe('')
  })

  it('shows an income in its own currency', () => {
    expect(formatIncome(1200000, 'PHP')).toBe('₱1,200,000')
    expect(formatIncome(2500.5, 'USD')).toBe('$2,500.5')
  })
})

describe('occupation list', () => {
  it('has exactly 100 entries, unique, including the ones Carlos named', () => {
    expect(OCCUPATIONS).toHaveLength(100)
    expect(new Set(OCCUPATIONS).size).toBe(100)
    for (const name of ['Student', 'Salesperson', 'Content Creator']) expect(OCCUPATIONS).toContain(name)
    expect(OCCUPATIONS.at(-1)).toBe('Other')
  })
})

describe('schemas', () => {
  it('signs up with username, email and password only', () => {
    expect(signUpSchema.safeParse({ username: 'juan', email: 'j@example.com', password: 'longenough' }).success).toBe(true)
  })

  it('accepts any subset of the profile but not an empty save', () => {
    expect(profileUpdateSchema.safeParse({ occupation: 'Nurse' }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({ annualIncome: null }).success).toBe(true)
    expect(profileUpdateSchema.safeParse({}).success).toBe(false)
  })

  it('rejects a negative or currency-less income', () => {
    expect(profileUpdateSchema.safeParse({ annualIncome: { amount: -1, currency: 'PHP' } }).success).toBe(false)
    expect(profileUpdateSchema.safeParse({ annualIncome: { amount: 10, currency: 'EUR' } }).success).toBe(false)
  })

  it('requires the password confirmation to match', () => {
    expect(passwordChangeSchema.safeParse({ password: 'longenough', confirm: 'longenough' }).success).toBe(true)
    const mismatch = passwordChangeSchema.safeParse({ password: 'longenough', confirm: 'different1' })
    expect(mismatch.success).toBe(false)
    expect(mismatch.error?.issues[0].path).toEqual(['confirm'])
  })
})
