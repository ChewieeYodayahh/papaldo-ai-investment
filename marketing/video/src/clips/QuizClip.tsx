import { Easing, interpolate, useCurrentFrame } from "remotion";

import { RecommendedAssets } from "@/app/features/tools/quiz/components/RecommendedAssets";
import { ResultsView } from "@/app/features/tools/quiz/components/ResultsView";

import { AppFrame } from "./AppFrame";
import { ClipReady, LoopSeam, useScroll, type Device } from "./kit";
import { QUIZ, QUIZ_ANSWERS, RECOMMENDED } from "./sample";

const ease = Easing.bezier(0.33, 0, 0.2, 1);

/**
 * The quiz result (isq-results.page.tsx): the score meter fills to the
 * sample answers' real score, then the page settles on the answers and the
 * recommended funds and stocks for that band.
 */
export const QuizClip: React.FC<{ device: Device }> = ({ device }) => {
  const frame = useCurrentFrame();
  const score = Math.round(interpolate(frame, [18, 92], [0, QUIZ.totalScore], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }));
  const scrollY = useScroll(device === "phone" ? [[0, 0], [104, 0], [176, 470]] : [[0, 0], [112, 0], [180, 300]]);

  return (
    <>
      <AppFrame path="/isq/results" scrollY={scrollY}>
        <ClipReady selector="[data-slot=card]" label="the quiz result">
          <ResultsView band={QUIZ.band} score={score} takenAt="2026-10-01T09:00:00Z" answers={QUIZ_ANSWERS}>
            <RecommendedAssets band={QUIZ.band} assets={RECOMMENDED} />
          </ResultsView>
        </ClipReady>
      </AppFrame>
      <LoopSeam />
    </>
  );
};
