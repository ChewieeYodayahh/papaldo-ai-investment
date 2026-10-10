'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

import { Alert, AlertDescription } from '@/components/ui/alert'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireDescription,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireSubmit,
  QuestionnaireTitle,
} from '@/components/ui/questionnaire'
import { useFormSubmit } from '@/app/features/auth/hooks/use-form-submit'
import { TutorialTrigger } from '@/app/features/tutorials/components/TutorialMode'
import { useCopy } from '@/app/features/userData/preferences/copy'
import { cn } from '@/lib/utils'

import { useIsqText } from '../copy'
import { ANSWER_DEPENDENCIES, ISQ_QUESTIONS } from '../questions'
import type { RiskBand } from '../types'
import { BAND_ICON, CHOICE_ICON, ScoreMeter } from './quiz-visuals'

const ITEMS = ISQ_QUESTIONS.map((question) => ({
  name: question.id,
  required: true,
  choices: question.choices.map((choice) => ({ value: choice.id })),
}))

type Scored = { band: RiskBand; totalScore: number }

/**
 * The risk-profile quiz (Get Started 2/3), rebuilt 2026-09-26: one question
 * per screen inside a single card, three large choice cards each with an
 * icon, a title and a one-line description. Number keys 1-3 pick a choice.
 *
 * Built on the shadcn questionnaire primitive, which owns navigation,
 * required-answer validation and the shortcuts; this component owns the
 * selections, the "Not yet -> nothing yet" auto-answer, and the result.
 *
 * Question and choice text follow the language register through `useIsqText`
 * (Carlos, 2026-10-10); scoring reads ids only, so wording never moves a score.
 */
export function IsqForm({ retake }: { retake: boolean }) {
  const t = useCopy()
  const q = useIsqText()
  const router = useRouter()
  const { pending, message, submit } = useFormSubmit('/api/isq')
  const [selections, setSelections] = useState<Record<string, string>>({})
  const [current, setCurrent] = useState(ISQ_QUESTIONS[0].id)
  const [result, setResult] = useState<Scored | null>(null)

  const index = ISQ_QUESTIONS.findIndex((question) => question.id === current)

  function choose(questionId: string, choiceId: string) {
    setSelections((previous) => {
      const next = { ...previous, [questionId]: choiceId }
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
    if (ISQ_QUESTIONS.some((question) => !selections[question.id])) return

    const response = await submit({
      answers: ISQ_QUESTIONS.map((question) => ({ questionId: question.id, choiceId: selections[question.id] })),
    })
    if (response?.ok) {
      setResult({ band: response.band as RiskBand, totalScore: Number(response.totalScore) })
      // The shell's checklist and the dashboard both read the new profile.
      router.refresh()
    }
  }

  if (result) {
    const BandIcon = BAND_ICON[result.band]
    return (
      <QuizCard>
        <div className="flex flex-col items-center gap-4 py-4 text-center">
          <span className="grid size-16 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <BandIcon className="size-8" strokeWidth={1.75} />
          </span>
          <p className="text-xs font-semibold tracking-[0.18em] text-highlight uppercase">{t('isq.yourProfile')}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-balance">
            {t('tools.youAre')} <span className="text-highlight">{t(`tools.band.${result.band}`)}</span>
          </h2>
          <p className="max-w-md text-[0.9375rem] text-muted-foreground">{t(`dash.blurb.${result.band}`)}</p>
          <ScoreMeter score={result.totalScore} className="mt-3 max-w-md" />
          <p className="figure text-sm text-muted-foreground">{t('isq.score', { score: String(result.totalScore) })}</p>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            <Link href="/isq/results" className={cn(buttonVariants({ variant: 'outline', size: 'lg' }), 'h-11 rounded-full px-5')}>
              {t('tools.viewResults')}
            </Link>
            <Link href="/dashboard" className={cn(buttonVariants({ size: 'lg' }), 'h-11 rounded-full px-6 font-semibold')}>
              {t('isq.backHome')}
              <ArrowRight data-icon="inline-end" />
            </Link>
          </div>
        </div>
      </QuizCard>
    )
  }

  return (
    <QuizCard>
      <TutorialTrigger tour="quiz" className="mb-4" />
      <div className="mb-7 space-y-3" data-tut="quiz.progress">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold tracking-[0.18em] text-highlight uppercase">
            {retake ? t('isq.retakeTag') : t('isq.setupTag')}
          </span>
          <span className="figure text-muted-foreground">
            {t('isq.questionOf', { n: String(index + 1), m: String(ISQ_QUESTIONS.length) })}
          </span>
        </div>
        <Progress value={((index + 1) / ISQ_QUESTIONS.length) * 100} aria-label={t('isq.questionOf', { n: String(index + 1), m: String(ISQ_QUESTIONS.length) })} />
      </div>

      {message ? (
        <Alert variant="destructive" className="mb-5">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <Questionnaire items={ITEMS} item={current} onItemChange={setCurrent} onSubmit={handleSubmit} shortcuts="numbers">
        {ISQ_QUESTIONS.map((question) => (
          <QuestionnaireItem key={question.id} name={question.id} required>
            <QuestionnaireTitle data-tut="quiz.question" className="text-2xl leading-tight font-semibold tracking-tight">{q.prompt(question)}</QuestionnaireTitle>
            {question.helperText ? (
              <QuestionnaireDescription className="-mt-2 text-[0.9375rem]">{q.helperText(question)}</QuestionnaireDescription>
            ) : null}

            <QuestionnaireChoices data-tut="quiz.choices" className="mt-2 gap-3">
              {question.choices.map((choice) => {
                const Icon = CHOICE_ICON[choice.icon]
                return (
                  <QuestionnaireChoice
                    key={choice.id}
                    value={choice.id}
                    checked={selections[question.id] === choice.id}
                    onChange={() => choose(question.id, choice.id)}
                    className="items-center gap-4 rounded-2xl px-4 py-4 data-checked:border-primary data-checked:bg-primary/8 dark:data-checked:bg-primary/10 [&>[data-slot=questionnaire-choice-indicator]]:hidden [&>[data-slot=questionnaire-choice-shortcut]]:translate-y-0"
                  >
                    <span className="flex items-center gap-4">
                      <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground transition-colors group-data-checked/questionnaire-choice:bg-primary group-data-checked/questionnaire-choice:text-primary-foreground">
                        <Icon className="size-5" />
                      </span>
                      <span className="flex min-w-0 flex-col gap-0.5">
                        <span className="text-[0.9375rem] font-semibold">{q.label(choice)}</span>
                        <QuestionnaireChoiceDescription className="text-[0.8125rem]">{q.description(choice)}</QuestionnaireChoiceDescription>
                      </span>
                    </span>
                  </QuestionnaireChoice>
                )
              })}
            </QuestionnaireChoices>

            <QuestionnaireActions className="mt-4">
              <QuestionnairePrevious variant="ghost" className="h-10 rounded-full px-4">
                {t('isq.back')}
              </QuestionnairePrevious>
              <QuestionnaireNext className="h-10 rounded-full px-5 font-semibold">{t('isq.next')}</QuestionnaireNext>
              <QuestionnaireSubmit disabled={pending} className="h-10 rounded-full px-5 font-semibold">
                {pending ? t('isq.scoring') : t('isq.seeResult')}
              </QuestionnaireSubmit>
            </QuestionnaireActions>
          </QuestionnaireItem>
        ))}
      </Questionnaire>
    </QuizCard>
  )
}

function QuizCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-2xl">
      <Card className="rounded-3xl border-0 py-0 shadow-xl ring-1 ring-foreground/5">
        <CardContent className="px-5 py-7 sm:px-9 sm:py-9">{children}</CardContent>
      </Card>
    </div>
  )
}
