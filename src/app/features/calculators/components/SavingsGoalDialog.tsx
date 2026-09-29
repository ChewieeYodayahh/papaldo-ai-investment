'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'

import { SavingsGoalCalculator, type RatePreset } from './SavingsGoalCalculator'

/** The Savings & Investment Goal calculator in a dialog, opened from a returns calculator. */
export function SavingsGoalDialog({
  open,
  onOpenChange,
  presets,
  initialRatePct,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: RatePreset[]
  initialRatePct: number
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92svh] overflow-y-auto p-4 sm:max-w-5xl sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg">How much should I save?</DialogTitle>
          <DialogDescription>
            Pick a goal and a deadline. The expected return starts at the historical growth you were just looking at.
          </DialogDescription>
        </DialogHeader>
        <SavingsGoalCalculator presets={presets} initialRatePct={initialRatePct} />
      </DialogContent>
    </Dialog>
  )
}
