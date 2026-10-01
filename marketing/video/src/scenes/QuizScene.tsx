import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";

import { QuizToolCard } from "@/app/features/tools/components/ToolCards";

import { FeatureScene } from "../components/FeatureScene";
import { Stage } from "../components/Stage";
import { colors } from "../theme";

/** The quiz card from /tools, with its score meter filling to the result. */
export const QuizScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const score = Math.round(interpolate(frame, [0.8 * fps, 2.4 * fps], [0, 55], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));

  return (
    <FeatureScene
      layout="side"
      title={
        <>
          Know your <span style={{ color: colors.lime }}>risk.</span>
        </>
      }
      sub="6 questions. 2 minutes."
    >
      <Stage width={470} scale={1.6}>
        <QuizToolCard risk={{ band: "Medium", score, takenAt: "2026-10-01T00:00:00Z" }} />
      </Stage>
    </FeatureScene>
  );
};
