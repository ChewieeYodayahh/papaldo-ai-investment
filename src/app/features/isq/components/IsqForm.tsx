'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  Questionnaire,
  QuestionnaireProgress,
  QuestionnaireItem,
  QuestionnaireTitle,
  QuestionnaireDescription,
  QuestionnaireChoices,
  QuestionnaireChoice,
  QuestionnaireActions,
  QuestionnairePrevious,
  QuestionnaireNext,
  QuestionnaireSubmit,
  QuestionnaireError,
} from '@/components/ui/questionnaire'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useFormSubmit } from '@/app/features/auth/hooks/use-form-submit'
import { ISQ_QUESTIONS, ANSWER_DEPENDENCIES } from '../questions'

export function IsqForm() {
  const router = useRouter()
  const { pending, message, submit } = useFormSubmit('/api/isq')
  const [selections, setSelections] = useState<Record<string, string>>({})

  // Derive primitive items contract from the question bank (must stay in sync)
  const items = ISQ_QUESTIONS.map((q) => ({
    name: q.id,
    required: true,
    choices: q.choices.map((c) => ({ value: c.id, disabled: false })),
  }))

  function choose(questionId: string, choiceId: string) {
    setSelections((current) => {
      const next = { ...current, [questionId]: choiceId }
      for (const rule of ANSWER_DEPENDENCIES) {
        if (rule.whenQuestionId === questionId && rule.whenChoiceId === choiceId) {
          next[rule.thenQuestionId] = rule.thenChoiceId
        }
      }
      return next
    })
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const unanswered = ISQ_QUESTIONS.filter((q) => !selections[q.id])
    if (unanswered.length > 0) {
      // Primitive's native validation blocks submit if required items missing,
      // but carry a custom message for clarity.
      // We rely on the primitive to jump to the first invalid item.
      return
    }

    const result = await submit({
      answers: ISQ_QUESTIONS.map((q) => ({
        questionId: q.id,
        choiceId: selections[q.id],
      })),
    })

    if (result?.ok) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <Card className="max-w-xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle>Investment Suitability Questionnaire</CardTitle>
        <CardDescription>
          Six questions from Manulife&apos;s Client Suitability Assessment.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {message ? (
          <div
            role="alert"
            className="mb-4 rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
          >
            {message}
          </div>
        ) : null}

        <Questionnaire
          items={items}
          onSubmit={handleSubmit}
          shortcuts="numbers"
        >
          <QuestionnaireProgress />

          {ISQ_QUESTIONS.map((question) => (
            <QuestionnaireItem
              key={question.id}
              name={question.id}
              required
            >
              <QuestionnaireTitle>
                {question.prompt}
              </QuestionnaireTitle>
              {question.helperText ? (
                <QuestionnaireDescription>
                  {question.helperText}
                </QuestionnaireDescription>
              ) : null}

              <QuestionnaireChoices>
                {question.choices.map((choice) => (
                  <QuestionnaireChoice
                    key={choice.id}
                    value={choice.id}
                    checked={selections[question.id] === choice.id}
                    onChange={() => choose(question.id, choice.id)}
                  >
                    <span className="font-medium">{choice.label}</span>
                  </QuestionnaireChoice>
                ))}
              </QuestionnaireChoices>

              <QuestionnaireError />

              <QuestionnaireActions>
                <QuestionnairePrevious />
                <QuestionnaireNext />
                <QuestionnaireSubmit disabled={pending}>
                  {pending ? 'Scoring…' : 'See my risk profile'}
                </QuestionnaireSubmit>
              </QuestionnaireActions>
            </QuestionnaireItem>
          ))}
        </Questionnaire>
      </CardContent>
    </Card>
  )
}
