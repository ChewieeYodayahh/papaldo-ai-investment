import { useLayoutEffect } from "react";

import { CostOfWaiting } from "@/app/features/tools/calculators/components/CostOfWaiting";
import { ToolIntro } from "@/app/features/tools/calculators/components/lesson";
import { useTutorialStore } from "@/app/features/tutorials/tutorial-store";

import { AppFrame } from "./AppFrame";
import {
  ClipReady,
  LoopSeam,
  Pointer,
  States,
  useScroll,
  type Device,
} from "./kit";

/** Average yearly inflation, last 20 years (what the page computes from the World Bank CPI). */
const INFLATION = { PHP: 4, USD: 2.6 };

/** Opens Tutorial Mode on this tour step before the page's own effects look for it. */
const TourStep: React.FC<{ index: number; children: React.ReactNode }> = ({
  index,
  children,
}) => {
  useLayoutEffect(() => {
    useTutorialStore.setState({ active: { tour: "waiting", index } });
  }, [index]);
  return <>{children}</>;
};

/** The page's own markup (cost-of-waiting.page.tsx) for a guest-free, signed-in view. */
const CostOfWaitingPage: React.FC = () => (
  <>
    <ToolIntro
      tour="waiting"
      question="How much more do you need to save if you start later?"
    >
      Tell it the income you want in retirement. See what you would need to save
      each month starting now, or 5, 10 or 15 years from now.
    </ToolIntro>
    <CostOfWaiting profileIncome={null} inflation={INFLATION} />
  </>
);

/** The tutorial card, on either device (a popover on the laptop, the docked panel on a phone). */
const CARD = "[data-slot=popover-content], [aria-labelledby=tour-step-title]";
const NEXT =
  "[data-slot=popover-content] .flex.gap-2 > button:last-child, [aria-labelledby=tour-step-title] .flex.gap-2 > button:last-child";

/**
 * Learning by doing: Tutorial Mode walks the Cost of Waiting tool. The
 * result step points at what each start needs; Next moves to the lesson.
 */
export const LearnClip: React.FC<{ device: Device }> = ({ device }) => {
  // Where Tutorial Mode itself scrolls on a phone: each target just under the
  // header, clear of the docked panel (the lesson hits the end of the page).
  const scrollY = useScroll(device === "phone" ? [[0, 664], [103, 664], [104, 683]] : [[0, 0]]);
  return (
    <>
      <AppFrame path="/tools/cost-of-waiting" scrollY={scrollY}>
        <States
          states={[
            {
              from: 0,
              node: (
                <ClipReady selector={CARD} global label="the tutorial">
                  <TourStep index={2}>
                    <CostOfWaitingPage />
                  </TourStep>
                </ClipReady>
              ),
            },
            {
              from: 104,
              fade: 0,
              node: (
                <ClipReady selector={CARD} global label="the lesson step">
                  <TourStep index={3}>
                    <CostOfWaitingPage />
                  </TourStep>
                </ClipReady>
              ),
            },
          ]}
        />
      </AppFrame>
      <Pointer
        device={device}
        enter={60}
        exit={150}
        scrollY={0}
        taps={[{ at: 98, target: NEXT }]}
      />
      <LoopSeam />
    </>
  );
};
