'use client'

import { useRouter } from 'next/navigation'
import { useState, type FormEvent } from 'react'

import { Button, FormError } from '@/shared/ui'

import { ANSWER_DEPENDENCIES, ISQ_QUESTIONS } from '../questions'

export function IsqForm() {
  const router = useRouter()
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [pending, setPending] = useState(false)
  const [message, setMessage] = useState<string | undefined>()

  function choose(questionId: string, choiceId: string) {
    setSelections((current) => {
      const next = { ...current, [questionId]: choiceId }

      // Mirrors the source questionnaire: answering "No experience" on Q2
      // pre-selects the matching "have not invested" answer on Q3.
      for (const rule of ANSWER_DEPENDENCIES) {
        if (rule.whenQuestionId === questionId && rule.whenChoiceId === choiceId) {
          next[rule.thenQuestionId] = rule.thenChoiceId
        }
      }

      return next
    })
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const unanswered = ISQ_QUESTIONS.filter((question) => !selections[question.id])
    if (unanswered.length > 0) {
      setMessage(`Please answer all ${ISQ_QUESTIONS.length} questions before submitting.`)
      return
    }

    setPending(true)
    setMessage(undefined)

    try {
      const response = await fetch('/api/isq', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          answers: ISQ_QUESTIONS.map((question) => ({
            questionId: question.id,
            choiceId: selections[question.id],
          })),
        }),
      })
      const body = (await response.json()) as { ok: boolean; message?: string }

      if (!body.ok) {
        setMessage(body.message ?? 'Could not save your answers.')
        setPending(false)
        return
      }

      router.push('/dashboard')
      router.refresh()
    } catch {
      setMessage('Could not reach the server. Check your connection and try again.')
      setPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormError message={message} />

      {ISQ_QUESTIONS.map((question, index) => (
        <fieldset key={question.id} className="mb-8 border-t border-gray-200 pt-6">
          <legend className="text-sm font-medium">
            {index + 1}. {question.prompt}
          </legend>

          <div className="mt-3 space-y-2">
            {question.choices.map((choice) => (
              <label
                key={choice.id}
                className="flex cursor-pointer items-start gap-3 rounded border border-gray-200 px-3 py-2 text-sm hover:bg-gray-50"
              >
                <input
                  type="radio"
                  name={question.id}
                  value={choice.id}
                  checked={selections[question.id] === choice.id}
                  onChange={() => choose(question.id, choice.id)}
                  className="mt-1"
                />
                <span>{choice.label}</span>
              </label>
            ))}
          </div>

          {question.helperText ? (
            <p className="mt-2 text-xs text-gray-500">{question.helperText}</p>
          ) : null}
        </fieldset>
      ))}

      <Button type="submit" disabled={pending}>
        {pending ? 'Scoring…' : 'See my risk profile'}
      </Button>
    </form>
  )
}
