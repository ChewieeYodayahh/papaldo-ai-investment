import { KeyStats } from "@/app/features/markets/components/KeyStats";
import { PriceChart } from "@/app/features/markets/components/PriceChart";
import { SymbolHeader } from "@/app/features/markets/components/SymbolHeader";
import { OrderTicket } from "@/app/features/trading/components/OrderTicket";
import { TutorialTrigger } from "@/app/features/tutorials/components/TutorialMode";

import { typeInto, WithAction } from "../components/Interact";
import { AppFrame } from "./AppFrame";
import { ClipReady, LoopSeam, Pointer, States, usePortalOpen, useScroll, type Device } from "./kit";
import { TRADE_CANDLES, TRADE_METRICS, TRADE_PROFILE, TRADE_QUOTE, VALUATION } from "./sample";

/** Where the order ticket sits on the phone page (below the chart). */
const PHONE_TICKET_SCROLL = 505;

const TICKET = {
  symbol: TRADE_QUOTE.symbol,
  name: TRADE_PROFILE.data.name,
  assetClass: "equity" as const,
  price: TRADE_QUOTE.price,
  cashBalance: VALUATION.cash,
  heldQuantity: 30,
  fractionable: true,
  hasRiskProfile: true,
  isBuyable: true,
};

/** The symbol page's own markup (symbol.page.tsx): header, chart, the trade panel beside it, key stats. */
const SymbolPage: React.FC = () => (
  <div className="mx-auto max-w-6xl">
    <SymbolHeader quote={TRADE_QUOTE} profile={TRADE_PROFILE} />
    <TutorialTrigger tour="trade" className="mb-4" />
    <div className="grid grid-cols-1 gap-6 [grid-template-areas:'chart'_'trade'_'stats'] lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:[grid-template-areas:'chart_trade'_'stats_trade'] lg:grid-rows-[auto_1fr]">
      <div className="min-w-0 [grid-area:chart]" data-tut="trade.chart">
        <PriceChart candles={TRADE_CANDLES} />
      </div>
      <div id="trade" className="[grid-area:trade] lg:self-start">
        <OrderTicket {...TICKET} />
      </div>
      <div className="min-w-0 [grid-area:stats]" data-tut="trade.stats">
        <KeyStats quote={TRADE_QUOTE} metrics={TRADE_METRICS} />
      </div>
    </div>
  </div>
);

function typeTen(root: HTMLElement) {
  typeInto(root.querySelector<HTMLInputElement>("#quantity"), "10");
}

function typeTenAndReview(root: HTMLElement) {
  typeTen(root);
  window.setTimeout(() => root.querySelector<HTMLButtonElement>("[data-tut='trade.review']")?.click(), 80);
}

/**
 * A first trade, on practice money: ten shares of an S&P 500 fund. The
 * quantity goes in, Review opens the confirmation (the real dialog, with the
 * estimated total and the cash left). Nothing is executed: the video has no
 * API (shims/fetch refuses every /api call) and the pointer never presses
 * Execute.
 */
export const TradeClip: React.FC<{ device: Device }> = ({ device }) => {
  const phone = device === "phone";
  const scrollY = useScroll(phone ? [[0, 0], [14, 0], [52, PHONE_TICKET_SCROLL]] : [[0, 0]]);
  usePortalOpen(126);

  return (
    <>
      <AppFrame path="/markets/VOO" scrollY={scrollY}>
        <States
          states={[
            {
              from: 0,
              node: (
                <ClipReady selector="canvas" label="the trade page">
                  <SymbolPage />
                </ClipReady>
              ),
            },
            {
              from: 70,
              node: (
                <ClipReady selector="canvas" label="the quantity">
                  <WithAction run={typeTen}>
                    <SymbolPage />
                  </WithAction>
                </ClipReady>
              ),
            },
            {
              from: 126,
              fade: 0,
              node: (
                <ClipReady selector="[data-slot=alert-dialog-content]" global label="the confirmation">
                  <WithAction run={typeTenAndReview}>
                    <SymbolPage />
                  </WithAction>
                </ClipReady>
              ),
            },
          ]}
        />
      </AppFrame>
      <Pointer
        device={device}
        enter={phone ? 50 : 30}
        exit={150}
        scrollY={scrollY}
        taps={[
          { at: 62, target: "#quantity" },
          { at: 120, target: "[data-tut='trade.review']" },
        ]}
      />
      <LoopSeam />
    </>
  );
};
