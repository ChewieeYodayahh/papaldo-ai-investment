import { loadFont } from "@remotion/google-fonts/Figtree";

/**
 * Papaldo Ka's Midnight dark palette (the app's default theme since
 * 2026-09-30), converted from the app's OKLCH tokens in
 * src/app/globals.css to hex for the video.
 */
export const colors = {
  bg: "#070707",
  card: "#141715",
  cardRaised: "#1b1f1c",
  muted: "#1e201e",
  mutedFg: "#aab0ab",
  fg: "#f6f7f6",
  border: "rgba(255,255,255,0.09)",
  lime: "#9ef269",
  limeInk: "#0e1a06",
  gain: "#84f869",
  loss: "#fc5855",
  teal: "#21d1ca",
  amber: "#fcb442",
  orchid: "#f19fd6",
} as const;

// The app's font. Only the weights the video uses.
export const { fontFamily } = loadFont("normal", {
  weights: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const FPS = 30;
export const WIDTH = 1920;
export const HEIGHT = 1080;
