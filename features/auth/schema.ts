import { z } from 'zod'

/**
 * Validation shared by the client forms and the API routes, so the two can
 * never drift. The route handlers re-parse every payload server-side --
 * client-side validation is a convenience, not a control.
 *
 * Validation is deliberately loose: `contact` accepts any non-empty string
 * (mobiles, landlines, foreign numbers) and `username` has a length floor but
 * no character-set rule.
 */

const username = z
  .string()
  .trim()
  .min(3, 'Username must be at least 3 characters.')
  .max(30, 'Username must be 30 characters or fewer.')

const email = z.email('Enter a valid email address.').trim()

const password = z.string().min(8, 'Password must be at least 8 characters.')

const contact = z.string().trim().min(1, 'Contact number is required.')

const occupation = z.string().trim().min(1, 'Occupation is required.')

export const signUpSchema = z.object({ username, email, password, contact, occupation })

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required.'),
})

/** Fields collected after a Google sign-in, which supplies only an email. */
export const completeProfileSchema = z.object({ username, contact, occupation })

export type SignUpInput = z.infer<typeof signUpSchema>
export type LoginInput = z.infer<typeof loginSchema>
export type CompleteProfileInput = z.infer<typeof completeProfileSchema>

/** Flattens a ZodError into `{ fieldName: firstMessage }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const result: Record<string, string> = {}
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form')
    result[key] ??= issue.message
  }
  return result
}
