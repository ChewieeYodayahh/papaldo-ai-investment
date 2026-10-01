import { linearTiming, springTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";

import { Brand } from "./scenes/Brand";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { Learn } from "./scenes/Learn";
import { Markets } from "./scenes/Markets";
import { Problem } from "./scenes/Problem";
import { Quiz } from "./scenes/Quiz";
import { Tools } from "./scenes/Tools";
import { Trade } from "./scenes/Trade";

/**
 * Papaldo Ka -- 40-second promo (1920 x 1080, 30 fps). Nine scenes; the
 * 8 transitions of 15 frames overlap neighbours, so the total is
 * 1335 - 120 = 1215 frames.
 */
export const PapaldoPromo: React.FC = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence name="Hook" durationInFrames={120}>
      <Hook />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Problem" durationInFrames={120}>
      <Problem />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Brand" durationInFrames={105}>
      <Brand />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Quiz" durationInFrames={165}>
      <Quiz />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Trade" durationInFrames={180}>
      <Trade />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Markets" durationInFrames={135}>
      <Markets />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Tools" durationInFrames={225}>
      <Tools />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={slide({ direction: "from-right" })} timing={springTiming({ config: { damping: 200 }, durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="Learn" durationInFrames={135}>
      <Learn />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition presentation={fade()} timing={linearTiming({ durationInFrames: 15 })} />
    <TransitionSeries.Sequence name="CTA" durationInFrames={150}>
      <Cta />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
