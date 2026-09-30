'use client'

import { useEffect, useRef } from 'react'
import { create } from 'zustand'

import type { TourId } from './tours'

/**
 * Which tutorial is running and on which step. In memory only: a tour is
 * something you are in the middle of, not something to come back to after a
 * reload. Kept across client navigation, so a tour started from the Tools hub
 * is waiting when its page opens. Finished tours are remembered in the setup
 * store (`toursDone`).
 */
type TutorialState = {
  active: { tour: TourId; index: number } | null
  start: (tour: TourId) => void
  go: (index: number) => void
  stop: () => void
}

export const useTutorialStore = create<TutorialState>()((set) => ({
  active: null,
  start: (tour) => set({ active: { tour, index: 0 } }),
  go: (index) => set((state) => (state.active ? { active: { ...state.active, index } } : state)),
  stop: () => set({ active: null }),
}))

// "Show me" actions, registered by the page that owns the step's element.
const demos = new Map<string, () => void>()

/**
 * Registers what "Show me" does for a step, e.g. filling in a sample amount.
 * The latest `run` is always used, so it can close over current state.
 */
export function useTutorialDemo(stepId: string, run: () => void) {
  const latest = useRef(run)
  useEffect(() => {
    latest.current = run
  })
  useEffect(() => {
    const call = () => latest.current()
    demos.set(stepId, call)
    return () => {
      if (demos.get(stepId) === call) demos.delete(stepId)
    }
  }, [stepId])
}

export function runDemo(stepId: string): boolean {
  const demo = demos.get(stepId)
  demo?.()
  return Boolean(demo)
}

export function hasDemo(stepId: string): boolean {
  return demos.has(stepId)
}
