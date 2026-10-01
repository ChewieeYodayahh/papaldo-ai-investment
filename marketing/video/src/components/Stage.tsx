import { useEffect, useRef, useState } from "react";
import { continueRender, delayRender } from "remotion";

import { fontFamily } from "../theme";

/**
 * Where Papaldo's real components render in the video: the app's dark
 * Midnight theme (the `.dark` class and `data-palette`, exactly as the app
 * sets them on <html>) and its Figtree font as `--font-sans`.
 *
 * `width` is the layout width the component gets (as in the app); `scale`
 * enlarges it for a 1080p frame. Scaling a live DOM keeps text sharp.
 */
export const Stage: React.FC<{
  children: React.ReactNode;
  width: number;
  scale: number;
  style?: React.CSSProperties;
}> = ({ children, width, scale, style }) => (
  <div
    className="dark text-foreground"
    data-palette="midnight"
    style={
      {
        "--font-sans": fontFamily,
        fontFamily,
        width,
        scale: String(scale),
        transformOrigin: "center center",
        ...style,
      } as React.CSSProperties
    }
  >
    {children}
  </div>
);

/**
 * Holds the frame until the component inside has really drawn: `selector`
 * matches (a chart line, a result) and the DOM stops changing for a beat.
 * Real components fetch, measure and animate on their own clock; the video
 * must not capture them half-built.
 */
export const ReadyGate: React.FC<{ selector: string; children: React.ReactNode; onReady?: () => void; label?: string }> = ({
  selector,
  children,
  onReady,
  label = "component",
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender(`Waiting for ${label}`, { timeoutInMilliseconds: 60_000 }));

  useEffect(() => {
    let settled = false;
    let quietSince = 0;
    let lastSize = -1;
    const timer = window.setInterval(() => {
      const root = ref.current;
      if (!root || !root.querySelector(selector)) return;
      const size = root.innerHTML.length;
      const now = performance.now();
      if (size !== lastSize) {
        lastSize = size;
        quietSince = now;
        return;
      }
      if (now - quietSince > 250 && !settled) {
        settled = true;
        window.clearInterval(timer);
        onReady?.();
        continueRender(handle);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [selector, handle, onReady]);

  return <div ref={ref}>{children}</div>;
};
