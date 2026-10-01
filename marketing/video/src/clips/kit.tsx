import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, Easing, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Small pieces the landing clips share (2026-10-02). A clip is the real app
 * at a real device size; these only decide *when* things happen, since
 * every frame of a video is a photograph and nothing may depend on how fast
 * the browser happened to be.
 */

export type Device = "laptop" | "phone";

export const DEVICE_SIZE: Record<Device, { width: number; height: number }> = {
  laptop: { width: 1280, height: 800 },
  phone: { width: 392, height: 848 },
};

export const CLIP_FRAMES = 210;

const ease = Easing.bezier(0.33, 0, 0.2, 1);

/**
 * Holds the frame until the real component has finished drawing: `selector`
 * matches, every image inside has loaded, and the DOM has been still for a
 * beat. `global` looks in the whole document, for things that portal to
 * <body> (dialogs, popovers, the tutorial card).
 */
export const ClipReady: React.FC<{ selector: string; global?: boolean; label?: string; children: React.ReactNode }> = ({
  selector,
  global = false,
  label = "the app",
  children,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [handle] = useState(() => delayRender(`Waiting for ${label}`, { timeoutInMilliseconds: 90_000 }));

  useEffect(() => {
    let done = false;
    let lastSize = -1;
    let quietSince = 0;
    const timer = window.setInterval(() => {
      const scope: ParentNode | null = global ? document : ref.current;
      if (!scope || !scope.querySelector(selector)) return;
      const images = Array.from((ref.current ?? document).querySelectorAll("img"));
      if (images.some((img) => !img.complete)) return;
      const size = (global ? document.body : ref.current!).innerHTML.length;
      const now = performance.now();
      if (size !== lastSize) {
        lastSize = size;
        quietSince = now;
        return;
      }
      if (now - quietSince > 300 && !done) {
        done = true;
        window.clearInterval(timer);
        continueRender(handle);
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [selector, global, handle]);

  return <div ref={ref}>{children}</div>;
};

/**
 * One component, several states: each state is its own instance (mounted
 * with its demo values already in), and each new one fades in over the last.
 * `fade: 0` cuts, for steps that open a dialog (portals cannot fade with
 * their instance).
 */
export const States: React.FC<{ states: Array<{ from: number; fade?: number; node: React.ReactNode }> }> = ({ states }) => {
  const frame = useCurrentFrame();
  const index = states.reduce((current, state, i) => (frame >= state.from ? i : current), 0);
  const current = states[index];
  const fade = current.fade ?? 12;
  const t = fade === 0 ? 1 : interpolate(frame, [current.from, current.from + fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const previous = index > 0 && t < 1 ? states[index - 1] : null;

  return (
    <div style={{ display: "grid" }}>
      {previous ? (
        <div key={index - 1} style={{ gridArea: "1 / 1" }}>
          {previous.node}
        </div>
      ) : null}
      <div key={index} style={{ gridArea: "1 / 1", opacity: previous ? t : 1 }}>
        {current.node}
      </div>
    </div>
  );
};

/** The loop's seam: the screen eases in from the app's background and back, so the video repeats without a jump. */
export const LoopSeam: React.FC<{ fadeIn?: number; fadeOut?: number }> = ({ fadeIn = 8, fadeOut = 10 }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const opacity = Math.max(
    interpolate(frame, [0, fadeIn], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
    interpolate(frame, [durationInFrames - fadeOut, durationInFrames - 1], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
  );
  return <AbsoluteFill className="bg-background" style={{ opacity, zIndex: 9999, pointerEvents: "none", position: "fixed" }} />;
};

/** Scrolls the page like a calm thumb: from `from` to `to` pixels between two frames. */
export function useScroll(stops: Array<[number, number]>) {
  const frame = useCurrentFrame();
  const frames = stops.map(([f]) => f);
  const offsets = stops.map(([, y]) => y);
  return stops.length < 2 ? (offsets[0] ?? 0) : interpolate(frame, frames, offsets, { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
}

/** Opens a portalled dialog the way the app does (a short fade and zoom), driven by the frame. */
export function usePortalOpen(at: number, frames = 6) {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  useLayoutEffect(() => {
    document.documentElement.style.setProperty("--clip-portal-opacity", String(t));
    document.documentElement.style.setProperty("--clip-portal-scale", String(0.96 + 0.04 * t));
  }, [t]);
}

export type Tap = { at: number; target: string; click?: boolean };

/**
 * A pointer that moves between real elements and clicks them: an arrow on
 * the laptop, a fingertip on the phone. Positions are measured from the
 * rendered app (whichever state is on screen) once its layout has settled,
 * in page coordinates, so `scrollY` (the page's current scroll) moves the
 * pointer with the page. Measured at render size: a render's viewport is the
 * composition, so no scaling is involved.
 */
export const Pointer: React.FC<{ device: Device; taps: Tap[]; enter?: number; exit?: number; scrollY?: number }> = ({ device, taps, enter = 0, exit, scrollY = 0 }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const [points, setPoints] = useState<Record<string, { x: number; y: number }> | null>(null);
  const [handle] = useState(() => delayRender("Measuring pointer targets", { timeoutInMilliseconds: 90_000 }));
  const scrollRef = useRef(scrollY);
  scrollRef.current = scrollY;
  // Measured once per mount: the taps are a fresh array every frame.
  const tapsRef = useRef(taps);

  useEffect(() => {
    let tries = 0;
    let last = "";
    let stableSince = 0;
    const timer = window.setInterval(() => {
      tries++;
      const found: Record<string, { x: number; y: number }> = {};
      for (const tap of tapsRef.current) {
        const element = document.querySelector(tap.target);
        if (!element) continue;
        const rect = element.getBoundingClientRect();
        found[tap.target] = { x: rect.left + rect.width * 0.55, y: rect.top + rect.height * 0.6 + scrollRef.current };
      }
      const complete = Object.keys(found).length === new Set(tapsRef.current.map((t) => t.target)).size;
      const key = JSON.stringify(found);
      const now = performance.now();
      if (key !== last) {
        last = key;
        stableSince = now;
      }
      if ((complete && now - stableSince > 400) || tries > 150) {
        window.clearInterval(timer);
        setPoints(found);
        continueRender(handle);
      }
    }, 100);
    return () => window.clearInterval(timer);
  }, [handle]);

  if (!points) return null;
  const onScreen = (p: { x: number; y: number }) => ({ x: p.x, y: p.y - scrollY });

  // Rest off to the side, then travel to each target in turn.
  const rest = device === "phone" ? { x: width * 0.78, y: height * 0.86 } : { x: width * 0.72, y: height * 0.9 };
  const route = [
    { at: enter, ...rest },
    ...taps.map((tap) => ({ at: tap.at, ...(points[tap.target] ? onScreen(points[tap.target]) : rest) })),
    // Out of the way once the last tap is done, so it never sits on what it opened.
    ...(exit !== undefined ? [{ at: exit, ...rest }] : []),
  ];
  const frames = route.map((r) => r.at);
  const x = interpolate(frame, frames.length > 1 ? frames : [0, 1], frames.length > 1 ? route.map((r) => r.x) : [rest.x, rest.x], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const y = interpolate(frame, frames.length > 1 ? frames : [0, 1], frames.length > 1 ? route.map((r) => r.y) : [rest.y, rest.y], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  const visible = interpolate(frame, [enter, enter + 8], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const press = taps.filter((tap) => tap.click !== false).map((tap) => frame - tap.at).filter((d) => d >= 0 && d < 16);
  const since = press.length ? Math.min(...press) : null;
  const pressed = since !== null && since < 5;

  return (
    <AbsoluteFill style={{ pointerEvents: "none", zIndex: 9000, position: "fixed", opacity: visible }}>
      {since !== null ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 44,
            height: 44,
            marginLeft: -22,
            marginTop: -22,
            borderRadius: 999,
            border: "2px solid rgb(255 255 255 / 0.85)",
            opacity: 1 - since / 16,
            scale: String(0.6 + (since / 16) * 1.1),
          }}
        />
      ) : null}
      {device === "phone" ? (
        <div
          style={{
            position: "absolute",
            left: x,
            top: y,
            width: 34,
            height: 34,
            marginLeft: -17,
            marginTop: -17,
            borderRadius: 999,
            background: "rgb(255 255 255 / 0.32)",
            boxShadow: "0 0 0 2px rgb(255 255 255 / 0.7), 0 6px 18px rgb(0 0 0 / 0.35)",
            scale: pressed ? "0.82" : "1",
          }}
        />
      ) : (
        <svg width="22" height="26" viewBox="0 0 22 26" style={{ position: "absolute", left: x - 3, top: y - 2, scale: pressed ? "0.9" : "1", filter: "drop-shadow(0 2px 4px rgb(0 0 0 / 0.45))" }}>
          <path d="M3 2 L3 21 L8 16.5 L11.4 24 L14.6 22.6 L11.3 15.3 L18 15.3 Z" fill="white" stroke="black" strokeWidth="1.4" strokeLinejoin="round" />
        </svg>
      )}
    </AbsoluteFill>
  );
};
