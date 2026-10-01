import { Composition, Folder } from "remotion";

import { DashboardClip } from "./clips/DashboardClip";
import { CLIP_FRAMES, DEVICE_SIZE, type Device } from "./clips/kit";
import { LearnClip } from "./clips/LearnClip";
import { MarketsClip } from "./clips/MarketsClip";
import { QuizClip } from "./clips/QuizClip";
import { TradeClip } from "./clips/TradeClip";
import { PapaldoPromo, PROMO_FRAMES } from "./PapaldoPromo";
import { Brand } from "./scenes/Brand";
import { Cta } from "./scenes/Cta";
import { Hook } from "./scenes/Hook";
import { QuizScene } from "./scenes/QuizScene";

/**
 * The landing page's device clips (2026-10-02): each scene at a laptop
 * (1280 x 800) and a phone (392 x 848) viewport, so the phone clips are the
 * app's real phone layout. Rendered to public/landing by scripts/render-clips.
 */
const CLIPS = {
  Dashboard: DashboardClip,
  Quiz: QuizClip,
  Trade: TradeClip,
  Learn: LearnClip,
  Markets: MarketsClip,
} as const;

const DEVICES: Device[] = ["laptop", "phone"];

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Landing">
        {Object.entries(CLIPS).flatMap(([name, Clip]) =>
          DEVICES.map((device) => (
            <Composition
              key={`${name}-${device}`}
              id={`Clip-${name}-${device === "laptop" ? "Laptop" : "Phone"}`}
              component={Clip}
              defaultProps={{ device }}
              durationInFrames={CLIP_FRAMES}
              fps={30}
              width={DEVICE_SIZE[device].width}
              height={DEVICE_SIZE[device].height}
            />
          )),
        )}
      </Folder>
      <Composition id="PapaldoPromo" component={PapaldoPromo} durationInFrames={PROMO_FRAMES} fps={30} width={1920} height={1080} />
      <Folder name="PapaldoPromo-Scenes">
        <Composition id="Hook" component={Hook} durationInFrames={120} fps={30} width={1920} height={1080} />
        <Composition id="Quiz" component={QuizScene} durationInFrames={150} fps={30} width={1920} height={1080} />
        <Composition id="Brand" component={Brand} durationInFrames={105} fps={30} width={1920} height={1080} />
        <Composition id="CTA" component={Cta} durationInFrames={150} fps={30} width={1920} height={1080} />
      </Folder>
    </>
  );
};
