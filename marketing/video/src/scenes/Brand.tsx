import { AbsoluteFill, Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig } from "remotion";

import { Backdrop } from "../components/Backdrop";
import { colors } from "../theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** The wordmark lands, with the landing page's badge and a one-line promise. */
export const Brand: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow="center">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 44, padding: "100px 140px" }}>
        <Interactive.Div
          name="Badge"
          style={{
            fontSize: 38,
            fontWeight: 600,
            color: colors.lime,
            padding: "14px 32px",
            borderRadius: 999,
            border: `2px solid rgba(158,242,105,0.45)`,
            backgroundColor: "rgba(158,242,105,0.08)",
            opacity: interpolate(frame, [0.6 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          Safe investing simulation for every Filipino
        </Interactive.Div>
        <Interactive.Div
          name="Wordmark"
          style={{
            fontSize: 176,
            fontWeight: 700,
            letterSpacing: interpolate(frame, [0, 1.2 * fps], ["0.6em", "0.22em"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            marginRight: "-0.22em",
            opacity: interpolate(frame, [0, 0.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          PAPALDO KA
        </Interactive.Div>
        <Interactive.Div
          name="Promise"
          style={{
            fontSize: 56,
            color: colors.mutedFg,
            textAlign: "center",
            opacity: interpolate(frame, [1 * fps, 1.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            translate: interpolate(frame, [1 * fps, 1.7 * fps], ["0px 24px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          Practice investing with simulated money. Free.
        </Interactive.Div>
      </AbsoluteFill>
    </Backdrop>
  );
};
