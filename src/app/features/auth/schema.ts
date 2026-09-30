import { z } from 'zod'

/**
 * Validation shared by the client forms and the API routes, so the two can
 * never drift. The route handlers re-parse every payload server-side --
 * client-side validation is a convenience, not a control.
 *
 * Validation is deliberately loose: `contact` accepts any non-empty string
 * (mobiles, landlines, foreign numbers) and `username` has a length floor but
 * no character-set rule. `occupation` is picked from a dropdown in the UI but
 * any non-empty string is accepted here, because accounts created before the
 * dropdown hold free-text values that must keep saving.
 */

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be 30 characters or fewer.')

const email = z.email('Enter a valid email address.').trim()

const password = z.string().min(8, 'Password must be at least 8 characters.')

const contact = z.string().trim().min(1, 'Contact number is required.').max(40, 'That number is too long.')

const occupation = z.string().trim().min(1, 'Pick an occupation.').max(80, 'Keep it under 80 characters.')

/** Up to three (2026-09-30); the same limits as the users.occupations CHECK. */
const occupations = z.array(occupation).max(3, 'Pick up to three occupations.')

/**
 * A website shown on the public profile. `url()` alone accepts `javascript:`
 * links, so the protocol is checked too (the database CHECK matches). An
 * empty string clears it.
 */
const website = z
  .string()
  .trim()
  .max(200, 'Keep the link under 200 characters.')
  .refine((value) => value === '' || /^https?:\/\/\S+$/i.test(value), 'Use a full link starting with https://')
  .transform((value) => (value === '' ? null : value))

export const INCOME_CURRENCIES = ['USD', 'PHP'] as const
export type IncomeCurrency = (typeof INCOME_CURRENCIES)[number]

/**
 * An amount in the currency the user typed it in. Stored as-is: this is the
 * user's own figure, not a price, so it is never converted server-side.
 */
const income = z.object({
  amount: z.number('Enter an amount.').nonnegative('Income cannot be negative.').max(1e11, 'That amount is too large.'),
  currency: z.enum(INCOME_CURRENCIES),
})
export type Income = z.infer<typeof income>

/**
 * Sign-up asks only for what an account needs to exist and be addressed.
 * Contact, occupation and income are step 1 of the in-app setup (Get Started
 * 1/3), so a new account reaches the dashboard in one form.
 */
export const signUpSchema = z.object({ username, email, password })

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
})

/**
 * Any subset of the editable profile. The profile dashboard saves one card at
 * a time and the setup journey one step at a time, so every field is
 * optional; `null` clears an income.
 */
export const profileUpdateSchema = z
  .object({
    username: username.optional(),
    contact: contact.optional(),
    occupation: occupation.optional(),
    occupations: occupations.optional(),
    annualIncome: income.nullable().optional(),
    idealIncome: income.nullable().optional(),
    website: website.optional(),
    isPrivate: z.boolean().optional(),
  })
  .refine((value) => Object.values(value).some((field) => field !== undefined), {
    message: 'Nothing to save.',
    path: ['form'],
  })

export const passwordChangeSchema = z
  .object({ password, confirm: z.string() })
  .refine((value) => value.password === value.confirm, {
    message: 'The two passwords do not match.',
    path: ['confirm'],
  })

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>
export type PasswordChangeInput = z.infer<typeof passwordChangeSchema>

/** Flattens a ZodError into `{ fieldName: firstMessage }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    result[key] ??= issue.message
  }
  return result
}
