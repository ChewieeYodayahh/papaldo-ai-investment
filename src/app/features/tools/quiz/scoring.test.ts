import { describe, expect, it } from 'vitest'

import { ISQ_QUESTIONS, NORMALIZED_MAX } from './questions'
import { IsqValidationError, bandForScore, scoreIsq } from './scoring'
import type { IsqAnswer } from './types'

/** Answers every question with the choice at `pick(question)`. */
function answerAll(pick: (choiceCount: number) => number): IsqAnswer[] {
  return ISQ_QUESTIONS.map((question) => ({
    questionId: question.id,
    choiceId: question.choices[pick(question.choices.length)].id,
  }))
}

const allLowest = answerAll(() => 0)
const allHighest = answerAll((count) => count - 1)

describe('question weights', () => {
  it('normalizes every question onto the same 0-20 scale', () => {
    for (const question of ISQ_QUESTIONS) {
      const points = question.choices.map((choice) => choice.points)
      expect(points[0]).toBe(0)
      expect(points[points.length - 1]).toBe(NORMALIZED_MAX)
    }
  })

  it('spaces choices evenly with whole-number weights', () => {
    for (const question of ISQ_QUESTIONS) {
      const points = question.choices.map((choice) => choice.points)
      const step = NORMALIZED_MAX / (points.length - 1)
      points.forEach((value, index) => {
        expect(Number.isInteger(value)).toBe(true)
        expect(value).toBe(index * step)
      })
    }
  })

  it('covers exactly the six topics from the source questionnaire', () => {
    expect(ISQ_QUESTIONS.map((question) => question.id)).toEqual([
      'age',
      'experience',
      'instruments',
      'horizon',
      'volatility',
      'objective',
    ])
  })

  it('offers exactly three choices per question, weighted 0 / 10 / 20', () => {
    for (const question of ISQ_QUESTIONS) {
      expect(question.choices.map((choice) => choice.points)).toEqual([0, 10, 20])
    }
  })

  it('gives every choice a title, a description and an icon', () => {
    for (const question of ISQ_QUESTIONS) {
      for (const choice of question.choices) {
        expect(choice.label.trim()).not.toBe('')
        expect(choice.description.trim()).not.toBe('')
        expect(choice.icon).toBeTruthy()
      }
    }
  })

  it('uses choice ids that are unique across the whole questionnaire', () => {
    const ids = ISQ_QUESTIONS.flatMap((question) => question.choices.map((choice) => choice.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('scoreIsq', () => {
  it('scores the least risk-tolerant answers as 0 / Low', () => {
    expect(scoreIsq(allLowest)).toMatchObject({ totalScore: 0, band: 'Low' })
  })

  it('scores the most risk-tolerant answers as 100 / High', () => {
    expect(scoreIsq(allHighest)).toMatchObject({ totalScore: 100, band: 'High' })
  })

  it('scores the middle choice throughout as exactly 50 / Medium', () => {
    const middle = answerAll(() => 1)
    expect(scoreIsq(middle)).toMatchObject({ totalScore: 50, band: 'Medium' })
  })

  it('lands on the band edges the way the thresholds say', () => {
    // Two middles, four lowest: (10+10)/6 * 5 = 16.67 -> 17, Low.
    const mostlyLow = answerAll(() => 0).map((answer, i) =>
      i < 2 ? { ...answer, choiceId: ISQ_QUESTIONS[i].choices[1].id } : answer,
    )
    expect(scoreIsq(mostlyLow)).toMatchObject({ totalScore: 17, band: 'Low' })

    // Four highest, two middles: (20*4+10*2)/6 * 5 = 83.33 -> 83, High.
    const mostlyHigh = answerAll(() => 2).map((answer, i) =>
      i < 2 ? { ...answer, choiceId: ISQ_QUESTIONS[i].choices[1].id } : answer,
    )
    expect(scoreIsq(mostlyHigh)).toMatchObject({ totalScore: 83, band: 'High' })
  })

  it('resolves points from the question bank, not from the caller', () => {
    const result = scoreIsq(allHighest)
    expect(result.answers).toHaveLength(6)
    for (const answer of result.answers) {
      expect(answer.points).toBe(NORMALIZED_MAX)
    }
  })

  it('rejects an incomplete questionnaire', () => {
    expect(() => scoreIsq(allLowest.slice(0, 5))).toThrow(IsqValidationError)
  })

  it('rejects a choice that belongs to another question', () => {
    const answers = [...allLowest]
    answers[0] = { questionId: 'age', choiceId: 'obj_grow_fast' }
    expect(() => scoreIsq(answers)).toThrow(IsqValidationError)
  })

  it('rejects a duplicated question', () => {
    expect(() => scoreIsq([...allLowest, allLowest[0]])).toThrow(IsqValidationError)
  })

  it('rejects choice ids from the retired verbatim version', () => {
    const answers = [...allLowest]
    answers[1] = { questionId: 'experience', choiceId: 'exp_1_to_3y' }
    expect(() => scoreIsq(answers)).toThrow(IsqValidationError)
  })
})

describe('bandForScore', () => {
  it('splits the 0-100 range into even thirds', () => {
    expect(bandForScore(0)).toBe('Low')
    expect(bandForScore(33)).toBe('Low')
    expect(bandForScore(34)).toBe('Medium')
    expect(bandForScore(66)).toBe('Medium')
    expect(bandForScore(67)).toBe('High')
    expect(bandForScore(100)).toBe('High')
  })

  it('rejects a score outside the range', () => {
    expect(() => bandForScore(101)).toThrow(IsqValidationError)
  })
})
