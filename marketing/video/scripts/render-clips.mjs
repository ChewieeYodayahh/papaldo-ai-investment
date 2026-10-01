// Renders the landing page's device clips (2026-10-02) into the app's
// public/landing/clips: for each scene and device a WebM (VP9), an MP4
// (H.264, for browsers without VP9) and a poster frame.
//
//   node scripts/render-clips.mjs            every clip
//   node scripts/render-clips.mjs Trade      one scene, both devices
//
// Phone clips render at 1.5x: the page shows a phone about 300px wide, so
// that is still sharp on a 2x screen, at a third of the size of 2x.
import { execFileSync } from "node:child_process";
import { mkdirSync, statSync } from "node:fs";
import path from "node:path";

const SCENES = ["Dashboard", "Quiz", "Trade", "Learn", "Markets"];
const DEVICES = [
  { id: "Laptop", file: "laptop", scale: 1, vp9: 30, h264: 22 },
  { id: "Phone", file: "phone", scale: 1.5, vp9: 34, h264: 25 },
];
const POSTER_FRAME = 100;

const out = path.resolve("../../public/landing/clips");
mkdirSync(out, { recursive: true });

const only = process.argv[2];
const scenes = only ? SCENES.filter((s) => s === only) : SCENES;

const run = (args) => execFileSync("npx", ["remotion", ...args], { stdio: "inherit", shell: true });

run(["bundle", "--out-dir=build"]);

for (const scene of scenes) {
  for (const device of DEVICES) {
    const id = `Clip-${scene}-${device.id}`;
    const base = path.join(out, `${scene.toLowerCase()}-${device.file}`);
    const common = ["build", id, `--scale=${device.scale}`, "--log=error"];
    run(["render", ...common, `${base}.webm`, "--codec=vp9", `--crf=${device.vp9}`, "--muted"]);
    run(["render", ...common, `${base}.mp4`, "--codec=h264", `--crf=${device.h264}`, "--muted", "--pixel-format=yuv420p"]);
    run(["still", ...common, `${base}.jpg`, `--frame=${POSTER_FRAME}`, "--image-format=jpeg", "--jpeg-quality=82"]);
    const size = (file) => `${Math.round(statSync(file).size / 1024)} KB`;
    console.log(`${id}: webm ${size(`${base}.webm`)}, mp4 ${size(`${base}.mp4`)}, poster ${size(`${base}.jpg`)}`);
  }
}
