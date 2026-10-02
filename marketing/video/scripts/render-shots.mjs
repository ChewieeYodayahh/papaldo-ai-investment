// Renders the landing page's still screens (2026-10-02) into the app's
// public/landing/shots: the real app with the sample account, at 2x for sharp
// text. Laptop stills use the 1024 x 640 Shot-* compositions; phone stills
// reuse the Clip-*-Phone ones (392 x 848). Each picks the frame where its
// scene is complete. `still` hides the pointer (kit.tsx).
//
//   node scripts/render-shots.mjs
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const SHOTS = [
  { id: "Shot-Dashboard-Laptop", file: "dashboard-laptop", frame: 160 },
  { id: "Shot-Quiz-Laptop", file: "quiz-laptop", frame: 100 },
  { id: "Shot-Trade-Laptop", file: "trade-laptop", frame: 175 },
  { id: "Shot-Learn-Laptop", file: "learn-laptop", frame: 90 },
  { id: "Shot-Markets-Laptop", file: "markets-laptop", frame: 160 },
  { id: "Clip-Dashboard-Phone", file: "dashboard-phone", frame: 12 },
  { id: "Clip-Trade-Phone", file: "trade-phone", frame: 175 },
  { id: "Clip-Learn-Phone", file: "learn-phone", frame: 90 },
];

const out = path.resolve("../../public/landing/shots");
mkdirSync(out, { recursive: true });
const run = (args) => execFileSync("npx", ["remotion", ...args], { stdio: "inherit", shell: true });

run(["bundle", "--out-dir=build"]);
const props = path.join("build", "still-props.json");
writeFileSync(props, JSON.stringify({ still: true }));
for (const shot of SHOTS) {
  const file = path.join(out, `${shot.file}.webp`);
  run(["still", "build", shot.id, file, `--frame=${shot.frame}`, `--props=${props}`, "--scale=2", "--image-format=webp", "--jpeg-quality=82", "--log=error"]);
  console.log(`${shot.id}: ${Math.round(statSync(file).size / 1024)} KB`);
}
