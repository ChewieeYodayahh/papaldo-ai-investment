'use client'

import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import type { TourId } from './tours'

/**
 * Browser-side state for first-time setup: whether the Get Started checklist
 * is open, whether the welcome carousel has been seen, and where the
 * first-trade walkthrough is.
 *
 * None of this is progress. Whether each setup step is *done* comes from the
 * database on every render (`getShellData().setup`); this only remembers UI
 * the viewer opened or dismissed, so localStorage is the right home -- losing
 * it re-shows a welcome, nothing more.
 *
 * `skipHydration` for the same reason as the preferences store: server and
 * first client render must agree. `GetStartedDock` rehydrates on mount.
 */

/** The walkthrough's position. Advanced by route changes, not by clicks. */
export type TourStep = 'pick' | 'ticket'

type SetupState = {
  dockOpen: boolean
  welcomeSeen: boolean
  tour: TourStep | null
  /**
   * ISO time the walkthrough started. It is finished when an order fills
   * after this -- a timestamp rather than "has traded", so "Make another
   * trade" can run the walkthrough again on an account that already has.
   */
  tourStartedAt: string | null
  /** Tutorial Mode tours finished at least once, for the Done ticks (2026-09-30). */
  toursDone: TourId[]
  setDockOpen: (open: boolean) => void
  markWelcomeSeen: () => void
  startTour: () => void
  setTourStep: (step: TourStep) => void
  endTour: () => void
  markTourDone: (tour: TourId) => void
}

export const useSetupStore = create<SetupState>()(
  persist(
    (set) => ({
      dockOpen: false,
      welcomeSeen: false,
      tour: null,
      tourStartedAt: null,
      toursDone: [],
      setDockOpen: (dockOpen) => set({ dockOpen }),
      markWelcomeSeen: () => set({ welcomeSeen: true }),
      startTour: () => set({ tour: 'pick', tourStartedAt: new Date().toISOString(), dockOpen: false }),
      setTourStep: (tour) => set({ tour }),
      endTour: () => set({ tour: null }),
      markTourDone: (tour) => set((state) => (state.toursDone.includes(tour) ? state : { toursDone: [...state.toursDone, tour] })),
    }),
    {
      name: 'papaldo-setup',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
)
