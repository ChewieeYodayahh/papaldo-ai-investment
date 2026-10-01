import { AbsoluteFill, Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig } from "remotion";

import { colors } from "../theme";
import { Backdrop } from "./Backdrop";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * One feature: a short, punchy caption and the app's real component on
 * stage. `top` puts the caption above a wide component; `side` puts it on
 * the left of a narrow one. The stage slides in and drifts closer slowly.
 */
export const FeatureScene: React.FC<{
  title: React.ReactNode;
  sub?: React.ReactNode;
  layout?: "top" | "side";
  children: React.ReactNode;
}> = ({ title, sub, layout = "top", children }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const caption = (
    <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: layout === "side" ? 700 : 1640 }}>
      <Interactive.Div
        name="Title"
        style={{
          fontSize: layout === "side" ? 112 : 96,
          fontWeight: 800,
          lineHeight: 1.02,
          letterSpacing: "-0.04em",
          opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          translate: interpolate(frame, [0, 0.6 * fps], ["0px 30px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
        }}
      >
        {title}
      </Interactive.Div>
      {sub ? (
        <Interactive.Div
          name="Sub"
          style={{
            fontSize: 46,
            fontWeight: 600,
            color: colors.mutedFg,
            opacity: interpolate(frame, [0.35 * fps, 0.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          {sub}
        </Interactive.Div>
      ) : null}
    </div>
  );

  const stage = (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flex: 1,
        opacity: interpolate(frame, [0.25 * fps, 0.8 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
        translate: interpolate(frame, [0.25 * fps, 1 * fps], ["0px 70px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
        scale: interpolate(frame, [0, durationInFrames], [0.97, 1.02], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
      }}
    >
      {children}
    </div>
  );

  return (
    <Backdrop glow={layout === "side" ? "right" : "center"}>
      {layout === "top" ? (
        <AbsoluteFill style={{ padding: "70px 140px 50px", display: "flex", flexDirection: "column", gap: 28 }}>
          {caption}
          {stage}
        </AbsoluteFill>
      ) : (
        <AbsoluteFill style={{ padding: "100px 140px", display: "flex", flexDirection: "row", alignItems: "center", gap: 60 }}>
          {caption}
          {stage}
        </AbsoluteFill>
      )}
    </Backdrop>
  );
};

/** Two states of the same component, the second fading in over the first (e.g. before and after a change). */
export const Crossfade: React.FC<{ at: number; fade?: number; first: React.ReactNode; second: React.ReactNode }> = ({
  at,
  fade = 10,
  first,
  second,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [at, at + fade], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });
  return (
    <div style={{ display: "grid" }}>
      {frame < at + fade ? <div style={{ gridArea: "1 / 1", opacity: 1 - t }}>{first}</div> : null}
      {frame >= at ? <div style={{ gridArea: "1 / 1", opacity: t }}>{second}</div> : null}
    </div>
  );
};
