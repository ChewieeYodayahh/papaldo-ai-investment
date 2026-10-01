import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { Brand } from "./scenes/Brand";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { QuizScene } from "./scenes/QuizScene";

/**
 * Papaldo Ka promo -- work in progress (2026-10-02). The real-components
 * rewrite was paused for the landing page; until its remaining scenes are
 * written this plays the four that exist, so the project keeps compiling.
 * 120 + 150 + 105 + 150 = 525 frames, minus 3 fades of 12 = 489.
 */
export const PROMO_FRAMES = 489;

export const PapaldoPromo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Hook" durationInFrames={120}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="Quiz" durationInFrames={150}>
      <QuizScene />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="Brand" durationInFrames={105}>
      <Brand />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 12 })} />
    <TransitionSeries.Sequence name="CTA" durationInFrames={150}>
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
