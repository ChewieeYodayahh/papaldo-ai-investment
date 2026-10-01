import { AbsoluteFill, Easing, interpolate, Interactive, useCurrentFrame, useVideoConfig } from "remotion";

import { MockDashboard } from "@/app/features/landing/sections/mock-dashboard";

import { Backdrop } from "../components/Backdrop";
import { Stage } from "../components/Stage";
import { colors } from "../theme";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** 0:00 -- the promise, with the landing page's own dashboard preview beside it. */
export const Hook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <Backdrop glow="left">
      <AbsoluteFill style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: "100px 140px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <Interactive.Div
            name="Line 1"
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              opacity: interpolate(frame, [0, 0.4 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
              translate: interpolate(frame, [0, 0.6 * fps], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            }}
          >
            Invest
          </Interactive.Div>
          <Interactive.Div
            name="Line 2"
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              opacity: interpolate(frame, [0.35 * fps, 0.75 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
              translate: interpolate(frame, [0.35 * fps, 0.95 * fps], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            }}
          >
            without
          </Interactive.Div>
          <Interactive.Div
            name="Line 3"
            style={{
              fontSize: 150,
              fontWeight: 800,
              letterSpacing: "-0.045em",
              lineHeight: 1,
              color: colors.lime,
              opacity: interpolate(frame, [0.7 * fps, 1.1 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
              translate: interpolate(frame, [0.7 * fps, 1.3 * fps], ["0px 40px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            }}
          >
            the fear.
          </Interactive.Div>
        </div>
        <div
          style={{
            opacity: interpolate(frame, [0.5 * fps, 1.2 * fps], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            translate: interpolate(frame, [0.5 * fps, 1.4 * fps], ["80px 0px", "0px 0px"], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease }),
            rotate: interpolate(frame, [0, 4 * fps], ["-3deg", "-1deg"], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
          }}
        >
          {/* The landing page's own hero preview. */}
          <Stage width={560} scale={1.45}>
            <MockDashboard />
          </Stage>
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
};
