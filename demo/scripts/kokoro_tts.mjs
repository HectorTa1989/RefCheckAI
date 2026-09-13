/**
 * Batch Kokoro-82M synthesis (local, open-weight, Apache-2.0).
 *
 *   node scripts/kokoro_tts.mjs jobs.json
 *
 * jobs.json: [{ "text": "...", "voice": "af_heart", "speed": 1.0, "out": "abs/path.wav" }, ...]
 * The model loads once; every job is written as a 24 kHz mono WAV.
 */
import fs from "node:fs";
import path from "node:path";
import { KokoroTTS } from "kokoro-js";

const jobsFile = process.argv[2];
if (!jobsFile) {
  console.error("usage: node scripts/kokoro_tts.mjs jobs.json");
  process.exit(2);
}
const jobs = JSON.parse(fs.readFileSync(jobsFile, "utf8"));

const tts = await KokoroTTS.from_pretrained("onnx-community/Kokoro-82M-v1.0-ONNX", {
  dtype: "fp32",
  device: "cpu",
});

for (const job of jobs) {
  fs.mkdirSync(path.dirname(job.out), { recursive: true });
  const audio = await tts.generate(job.text, { voice: job.voice, speed: job.speed ?? 1.0 });
  await audio.save(job.out);
  console.log(`${job.voice.padEnd(12)} ${path.basename(job.out)}`);
}
