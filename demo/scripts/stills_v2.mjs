/**
 * Render review stills of the v2 walkthrough (bundles once).
 *
 *   node scripts/stills_v2.mjs 30 150 354 ...      # frames
 *   node scripts/stills_v2.mjs --scale=0.5 30 150  # smaller files
 */
import fs from "node:fs";
import path from "node:path";
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";

const args = process.argv.slice(2);
const scaleArg = args.find((a) => a.startsWith("--scale="));
const scale = scaleArg ? Number(scaleArg.split("=")[1]) : 1;
const frames = args.filter((a) => !a.startsWith("--")).map(Number);

const root = path.resolve(import.meta.dirname, "..");
const outDir = path.join(root, "out", "stills");
fs.mkdirSync(outDir, { recursive: true });

const serveUrl = await bundle({ entryPoint: path.join(root, "src", "index.ts"), publicDir: path.join(root, "public") });
const composition = await selectComposition({ serveUrl, id: "RefCheckWalkthrough" });
console.log(`composition: ${composition.durationInFrames} frames (${(composition.durationInFrames / 30).toFixed(1)} s)`);

for (const frame of frames) {
  const output = path.join(outDir, `f${String(frame).padStart(5, "0")}.jpg`);
  await renderStill({
    composition,
    serveUrl,
    output,
    frame,
    imageFormat: "jpeg",
    jpegQuality: 82,
    scale,
    chromiumOptions: { gl: "angle" },
    onBrowserLog: (log) => {
      if (log.type === "error") console.log(`  [browser ${log.type}] ${log.text}`);
    },
  });
  console.log(`  frame ${frame} -> ${path.relative(root, output)}`);
}
