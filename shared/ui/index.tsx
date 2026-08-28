/**
 * Shared UI primitives.
 *
 * Deliberately minimal for this phase -- plain Tailwind, semantic HTML,
 * accessible labels and error wiring, no design system. See the "Pending
 * UI/UX design" section of PROGRESS.md.
 */
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react'

export function PageShell({ title, subtitle, children }: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <main className="mx-auto w-full max-w-xl px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-2 text-sm text-gray-600">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </main>
  )
}

export function Field({ label, htmlFor, error, hint, children }: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="mb-4">
      <label htmlFor={htmlFor} className="block text-sm font-medium">
        {label}
      </label>
      {children}
      {hint ? <p className="mt-1 text-xs text-gray-500">{hint}</p> : null}
      {error ? (
        <p id={`${htmlFor}-error`} role="alert" className="mt-1 text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export function TextInput({ invalid, ...props }: InputHTMLAttributes<HTMLInputElement> & {
  invalid?: boolean
}) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid && props.id ? `${props.id}-error` : undefined}
      className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-900"
    />
  )
}

export function Button({ variant = 'primary', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary'
}) {
  const base = 'w-full rounded px-4 py-2 text-sm font-medium disabled:opacity-50'
  const styles =
    variant === 'primary'
      ? 'bg-gray-900 text-white hover:bg-gray-800'
      : 'border border-gray-300 bg-white text-gray-900 hover:bg-gray-50'
  return <button {...props} className={`${base} ${styles}`} />
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null
  return (
    <p role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {message}
    </p>
  )
}
