import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

import { colors, fontFamily } from "../theme";

/**
 * The app's page backdrop: near-black with a slow lime glow (the landing
 * page's hero mesh), drifting a little so no scene is ever fully still.
 */
export const Backdrop: React.FC<{ children: React.ReactNode; glow?: "left" | "right" | "center" }> = ({
  children,
  glow = "left",
}) => {
  const frame = useCurrentFrame();
  const x = glow === "left" ? 22 : glow === "right" ? 78 : 50;

  return (
    <AbsoluteFill style={{ backgroundColor: colors.bg, fontFamily, color: colors.fg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(ellipse 70% 60% at ${x + interpolate(frame, [0, 300], [0, 6], { extrapolateRight: "clamp" })}% 42%, rgba(158,242,105,0.16), transparent 70%), radial-gradient(ellipse 50% 45% at ${100 - x}% 80%, rgba(33,209,202,0.08), transparent 70%)`,
        }}
      />
      {children}
    </AbsoluteFill>
  );
};
