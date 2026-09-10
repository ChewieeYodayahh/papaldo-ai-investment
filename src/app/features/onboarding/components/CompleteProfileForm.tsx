'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button, Field, FormError, TextInput } from '@/components'

import { useFormSubmit } from '@/app/features/auth/hooks/use-form-submit'

const FIELDS = [
  { name: 'username', label: 'Username', type: 'text', autoComplete: 'username' },
  { name: 'contact', label: 'Contact number', type: 'tel', autoComplete: 'tel' },
  { name: 'occupation', label: 'Occupation', type: 'text', autoComplete: 'organization-title' },
] as const

/**
 * Google gives us an email and a name but none of the profile fields the
 * sign-up form collects, so OAuth users fill them in here before the ISQ.
 */
export function CompleteProfileForm({ defaultUsername }: { defaultUsername?: string }) {
  const router = useRouter()
  const { pending, message, errors, submit } = useFormSubmit('/api/auth/profile')
  const [values, setValues] = useState<Record<string, string>>({
    username: defaultUsername ?? '',
    contact: '',
    occupation: '',
  })

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const result = await submit(values)
    if (result) {
      router.push('/isq')
      router.refresh()
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <FormError message={message} />

      {FIELDS.map((field) => (
        <Field key={field.name} label={field.label} htmlFor={field.name} error={errors[field.name]}>
          <TextInput
            id={field.name}
            name={field.name}
            type={field.type}
            autoComplete={field.autoComplete}
            value={values[field.name]}
            invalid={Boolean(errors[field.name])}
            onChange={(event) => setValues({ ...values, [field.name]: event.target.value })}
          />
        </Field>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? 'Saving…' : 'Continue'}
      </Button>
    </form>
  )
}
