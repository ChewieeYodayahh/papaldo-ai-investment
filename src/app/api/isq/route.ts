import { NextResponse } from 'next/server'
import { z } from 'zod'

import { submitIsq } from '@/app/features/tools/quiz/api/submit'
import { IsqValidationError } from '@/app/features/tools/quiz/scoring'

const submissionSchema = z.object({
  answers: z
    .array(z.object({ questionId: z.string(), choiceId: z.string() }))
    .min(1, 'Answer every question before submitting.'),
})

export async function POST(request: Request) {
  const parsed = submissionSchema.safeParse(await request.json())
  if (!parsed.success) {
    return NextResponse.json(
      { ok: false, message: 'Answer every question before submitting.' },
      { status: 400 },
    )
  }

  try {
    const result = await submitIsq(parsed.data.answers)
    return NextResponse.json(result, { status: result.ok ? 200 : 400 })
  } catch (error) {
    if (error instanceof IsqValidationError) {
      return NextResponse.json({ ok: false, message: error.message }, { status: 400 })
    }
    throw error
  }
}
