import { AbsoluteFill, Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig } from "remotion";

import { Backdrop } from "../components/Backdrop";
import { colors } from "../theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** The close: the promise, the address, the button, and the honest small print. */
export const Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow="center">
      <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", gap: 48, padding: "100px 140px", textAlign: "center" }}>
        <Interactive.Div
          name="Headline"
          style={{
            fontSize: 124,
            fontWeight: 800,
            letterSpacing: "-0.04em",
            lineHeight: 1.04,
            opacity: interpolate(frame, [0, 0.5 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            translate: interpolate(frame, [0, 0.7 * fps], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          Start investing.
          <br />
          <span style={{ color: colors.lime }}>Skip the risk.</span>
        </Interactive.Div>
        <Interactive.Div
          name="Button"
          style={{
            fontSize: 52,
            fontWeight: 800,
            padding: "30px 70px",
            borderRadius: 999,
            backgroundColor: colors.lime,
            color: colors.limeInk,
            boxShadow: "0 0 60px rgba(158,242,105,0.35)",
            opacity: interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            scale: interpolate(frame, [0.7 * fps, 1.2 * fps, 2.4 * fps, 2.7 * fps, 3 * fps], [0.9, 1, 1, 1.04, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
              easing: ease,
            }),
          }}
        >
          Get Started — it’s free →
        </Interactive.Div>
        <Interactive.Div
          name="Address"
          style={{
            fontSize: 56,
            fontWeight: 700,
            letterSpacing: "-0.01em",
            opacity: interpolate(frame, [1.1 * fps, 1.6 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          papaldo-ka.vercel.app
        </Interactive.Div>
        <Interactive.Div
          name="Small print"
          style={{
            fontSize: 30,
            color: colors.mutedFg,
            opacity: interpolate(frame, [1.6 * fps, 2.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
          }}
        >
          Simulated trading only. No real money moves. Not financial advice.
        </Interactive.Div>
      </AbsoluteFill>
    </Backdrop>
  );
};
