import { Easing, interpolate, useCurrentFrame } from "remotion";

import { MarketMoversCard } from "@/app/features/dashboard/components/MarketMoversCard";
import { PerformanceChart } from "@/app/features/dashboard/components/PerformanceChart";
import { PortfolioPreview } from "@/app/features/dashboard/components/PortfolioPreview";
import { RiskAppetiteCard } from "@/app/features/dashboard/components/RiskAppetiteCard";
import { TotalHoldingsCard } from "@/app/features/dashboard/components/TotalHoldingsCard";
import { TutorialTrigger } from "@/app/features/tutorials/components/TutorialMode";

import { WithAction } from "../components/Interact";
import { AppFrame } from "./AppFrame";
import { ClipReady, LoopSeam, useScroll, type Device } from "./kit";
import { ALLOCATION, MOVERS, PERFORMANCE, QUIZ, VALUATION } from "./sample";

const ease = Easing.bezier(0.33, 0, 0.2, 1);

/** The performance chart opens on 1M; the clip shows the whole three months. */
function showSixMonths(root: HTMLElement) {
  const tab = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-slot=tabs-trigger]")).find((b) => b.textContent?.trim() === "6M");
  tab?.click();
}

/**
 * The dashboard, as the sample account sees it: holdings, risk appetite,
 * today's movers, the portfolio, and the performance line drawing in.
 * The page markup is dashboard.page.tsx's.
 */
export const DashboardClip: React.FC<{ device: Device }> = ({ device }) => {
  const frame = useCurrentFrame();
  const reveal = interpolate(frame, device === "phone" ? [96, 186] : [30, 140], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const scrollY = useScroll(device === "phone" ? [[0, 0], [24, 0], [92, 575]] : [[0, 0]]);

  return (
    <>
      <AppFrame path="/dashboard" scrollY={scrollY}>
        <ClipReady selector=".recharts-area-curve" label="the dashboard">
          <WithAction run={showSixMonths} delayMs={120}>
            <div className="grid gap-4">
              <TutorialTrigger tour="account" className="justify-self-start" />
              <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1.1fr]">
                <div className="grid content-start gap-4">
                  <TotalHoldingsCard valuation={VALUATION} pricingNote={null} />
                  <RiskAppetiteCard band={QUIZ.band} firstName="Ana" />
                </div>
                <MarketMoversCard movers={MOVERS} unavailable={null} />
                <div className="lg:col-span-2 xl:col-span-1">
                  <PortfolioPreview positions={VALUATION.positions} allocation={ALLOCATION} hasRiskProfile />
                </div>
              </div>
              <div data-clip-reveal style={{ "--clip-reveal": reveal } as React.CSSProperties}>
                <PerformanceChart points={PERFORMANCE} />
              </div>
              <p className="text-xs text-muted-foreground">Simulated trading only — no real money, no broker orders.</p>
            </div>
          </WithAction>
        </ClipReady>
      </AppFrame>
      <LoopSeam />
    </>
  );
};
