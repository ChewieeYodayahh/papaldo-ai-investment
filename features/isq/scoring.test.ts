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

  it('covers exactly the six questions from the source questionnaire', () => {
    expect(ISQ_QUESTIONS.map((question) => question.id)).toEqual([
      'age',
      'experience',
      'instruments',
      'horizon',
      'volatility',
      'objective',
    ])
  })
})

describe('scoreIsq', () => {
  it('scores the least risk-tolerant answers as 0 / Low', () => {
    expect(scoreIsq(allLowest)).toMatchObject({ totalScore: 0, band: 'Low' })
  })

  it('scores the most risk-tolerant answers as 100 / High', () => {
    expect(scoreIsq(allHighest)).toMatchObject({ totalScore: 100, band: 'High' })
  })

  it('weights each question equally regardless of its option count', () => {
    // Middle option throughout. The 6-option question has no exact middle, so
    // index 2 (8 points) is used there: (10+10+8+10+10+10)/6 * 5 = 48.33 -> 48.
    const middle = answerAll((count) => Math.floor((count - 1) / 2))
    expect(scoreIsq(middle)).toMatchObject({ totalScore: 48, band: 'Medium' })
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
    answers[0] = { questionId: 'age', choiceId: 'obj_growth' }
    expect(() => scoreIsq(answers)).toThrow(IsqValidationError)
  })

  it('rejects a duplicated question', () => {
    expect(() => scoreIsq([...allLowest, allLowest[0]])).toThrow(IsqValidationError)
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
