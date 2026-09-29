'use client'

import { useState } from 'react'
import { CircleCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Field, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

type Errors = Partial<Record<'name' | 'email' | 'subject' | 'body', string>>

/** Contact the Papaldo team. Signed-in users get their name and email filled in. */
export function SupportForm({ defaultName, defaultEmail }: { defaultName: string; defaultEmail: string }) {
  const [errors, setErrors] = useState<Errors>({})
  const [notice, setNotice] = useState<string | null>(null)
  const [sent, setSent] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = Object.fromEntries(new FormData(form)) as Record<string, string>
    setBusy(true)
    setNotice(null)
    setErrors({})
    try {
      const response = await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      const result = (await response.json()) as { ok: boolean; ref?: string; message?: string; fieldErrors?: Errors }
      if (result.ok && result.ref) {
        form.reset()
        setSent(result.ref)
      } else {
        setErrors(result.fieldErrors ?? {})
        setNotice(result.message ?? 'Your message was not sent.')
      }
    } catch {
      setNotice('You seem to be offline. Your message was not sent.')
    } finally {
      setBusy(false)
    }
  }

  if (sent) {
    return (
      <Card className="mx-auto w-full max-w-2xl rounded-3xl border-0">
        <CardContent className="grid justify-items-center gap-3 px-6 py-10 text-center">
          <CircleCheck className="size-10 text-primary" />
          <h2 className="text-xl font-semibold">Message sent</h2>
          <p className="max-w-md text-muted-foreground">
            Your reference is <span className="font-mono font-semibold text-foreground">{sent}</span>. The team will reply to
            the email you gave.
          </p>
          <Button variant="outline" className="h-10 rounded-full px-4" onClick={() => setSent(null)}>
            Send another message
          </Button>
        </CardContent>
      </Card>
    )
  }

  const field = (name: keyof Errors, label: string, control: React.ReactNode) => (
    <Field data-invalid={errors[name] ? true : undefined}>
      <FieldLabel htmlFor={`support-${name}`}>{label}</FieldLabel>
      {control}
      <FieldError>{errors[name]}</FieldError>
    </Field>
  )

  return (
    <Card className="mx-auto w-full max-w-2xl rounded-3xl border-0 py-6">
      <CardHeader className="px-6">
        <CardTitle className="text-lg font-semibold">Contact the Papaldo team</CardTitle>
        <CardDescription>Report a problem, suggest a feature or ask a question. You’ll get a reference number.</CardDescription>
      </CardHeader>
      <CardContent className="px-6">
        <form noValidate onSubmit={submit} className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {field('name', 'Name', <Input id="support-name" name="name" defaultValue={defaultName} autoComplete="name" aria-invalid={errors.name ? true : undefined} className="h-10 rounded-xl" />)}
            {field('email', 'Email', <Input id="support-email" name="email" type="email" defaultValue={defaultEmail} autoComplete="email" aria-invalid={errors.email ? true : undefined} className="h-10 rounded-xl" />)}
          </div>
          {field('subject', 'Subject', <Input id="support-subject" name="subject" aria-invalid={errors.subject ? true : undefined} className="h-10 rounded-xl" />)}
          {field('body', 'Message', <Textarea id="support-body" name="body" rows={6} aria-invalid={errors.body ? true : undefined} className="rounded-xl" />)}
          {notice ? (
            <p role="alert" className="text-sm text-destructive">
              {notice}
            </p>
          ) : null}
          <Button type="submit" disabled={busy} className="h-10 w-full rounded-full font-semibold sm:w-fit sm:justify-self-end sm:px-6">
            {busy ? 'Sending…' : 'Send message'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
