import { useMemo } from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";

import { SectorTreemap } from "@/app/features/markets/components/SectorTreemap";

import { AppFrame } from "./AppFrame";
import { ClipReady, LoopSeam, type Device } from "./kit";
import { quotesAt } from "./sample";

const ease = Easing.bezier(0.33, 0, 0.2, 1);

/**
 * The sector heatmap as the market opens: every tile starts flat and fills
 * to the day's real moves (captured 2026-10-01), sized by market value.
 */
export const MarketsClip: React.FC<{ device: Device }> = () => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [16, 126], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const step = Math.round(t * 60) / 60;
  const quotes = useMemo(() => quotesAt(step), [step]);

  return (
    <>
      <AppFrame path="/markets">
        <ClipReady selector="[data-slot=card]" label="the heatmap">
          <SectorTreemap quotes={quotes} />
        </ClipReady>
      </AppFrame>
      <LoopSeam />
    </>
  );
};
