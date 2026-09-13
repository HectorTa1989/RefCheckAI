"""Build every sound in the v2 walkthrough from src/v2/script.json.

    python scripts/make_audio_v2.py            # synthesize + process + manifest
    python scripts/make_audio_v2.py --preview  # also write out/preview-*.wav call mixes

Voices are Kokoro-82M (local, Apache-2.0) through scripts/kokoro_tts.mjs; an
"edge" engine entry in script.json uses Microsoft Edge neural TTS instead.
Sound effects are synthesized with ffmpeg, so nothing here is third-party audio.

Outputs
  public/v2/audio/narration/<id>.wav
  public/v2/audio/call/<call>-<id>.wav
  public/v2/audio/sfx/<name>.wav
  src/v2/audio-manifest.json   durations + call timelines the video is timed from
"""
from __future__ import annotations

import argparse
import asyncio
import json
import shutil
import subprocess
import tempfile
from pathlib import Path

DEMO = Path(__file__).resolve().parent.parent
SCRIPT = DEMO / "src" / "v2" / "script.json"
MANIFEST = DEMO / "src" / "v2" / "audio-manifest.json"
OUT = DEMO / "public" / "v2" / "audio"
SR = 48000

# Silence trim at both ends; TTS engines pad unevenly.
TRIM = ("silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.03,"
        "areverse,silenceremove=start_periods=1:start_threshold=-48dB:start_silence=0.05,areverse")

CHAINS = {
    # Studio narration: clean, gently compressed.
    "narrator": f"{TRIM},highpass=f=70,acompressor=threshold=-20dB:ratio=2:attack=8:release=150:makeup=1.3,"
                f"loudnorm=I=-16:TP=-1.5:LRA=8",
    # The agent is the platform side of the call: wideband "HD voice", lightly processed.
    "agent": f"{TRIM},highpass=f=110,lowpass=f=7200,equalizer=f=3000:t=q:w=1.4:g=1.5,"
             f"acompressor=threshold=-19dB:ratio=2.4:attack=5:release=120:makeup=1.4,loudnorm=I=-18:TP=-1.5:LRA=7",
    # Referees arrive over a phone line: band-limited, a little forward in the mids.
    "phone": f"{TRIM},highpass=f=240,lowpass=f=3900,equalizer=f=1800:t=q:w=1.2:g=3,"
             f"acompressor=threshold=-21dB:ratio=3:attack=4:release=110:makeup=1.6,loudnorm=I=-19:TP=-1.5:LRA=7",
}


def run(cmd: list[str], **kw) -> None:
    subprocess.run(cmd, check=True, **kw)


def ffmpeg(*args: str) -> None:
    run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", *args])


def duration(path: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", str(path)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    return round(float(out), 3)


# ── synthesis ────────────────────────────────────────────────────────────────

def synth_kokoro(jobs: list[dict]) -> None:
    if not jobs:
        return
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False, encoding="utf-8") as f:
        json.dump(jobs, f)
        job_file = f.name
    run(["node", str(DEMO / "scripts" / "kokoro_tts.mjs"), job_file], cwd=DEMO)
    Path(job_file).unlink(missing_ok=True)


async def synth_edge(jobs: list[dict]) -> None:
    import edge_tts

    for job in jobs:
        comm = edge_tts.Communicate(job["text"], job["voice"], rate=job.get("rate", "+0%"),
                                    pitch=job.get("pitch", "+0Hz"))
        await comm.save(job["out"])


def synthesize(items: list[tuple[str, str, dict, Path]]) -> None:
    """items: (text, role, voice_cfg, raw_out)."""
    kokoro, edge = [], []
    for text, _role, cfg, raw in items:
        if cfg["engine"] == "kokoro":
            kokoro.append({"text": text, "voice": cfg["voice"], "speed": cfg.get("speed", 1.0), "out": str(raw)})
        else:
            edge.append({"text": text, "voice": cfg["voice"], "rate": cfg.get("rate", "+0%"),
                         "pitch": cfg.get("pitch", "+0Hz"), "out": str(raw.with_suffix(".mp3"))})
    synth_kokoro(kokoro)
    if edge:
        asyncio.run(synth_edge(edge))


def process(raw: Path, chain: str, out: Path) -> float:
    src = raw if raw.exists() else raw.with_suffix(".mp3")
    out.parent.mkdir(parents=True, exist_ok=True)
    ffmpeg("-i", str(src), "-af", f"{chain},aresample={SR}", "-ac", "1", "-c:a", "pcm_s16le", str(out))
    return duration(out)


# ── sound effects ────────────────────────────────────────────────────────────

SFX = {
    # North American ringback (440 + 480 Hz), 2 s on, heard down a phone line.
    "ringback": ["-f", "lavfi", "-i",
                 "aevalsrc='0.20*(sin(2*PI*440*t)+sin(2*PI*480*t))':s=48000:d=2.0",
                 "-af", "afade=t=in:d=0.02,afade=t=out:st=1.94:d=0.06,highpass=f=300,lowpass=f=3400"],
    # Line opening when the referee picks up.
    "pickup": ["-f", "lavfi", "-i", "anoisesrc=d=0.09:c=brown:a=0.55:r=48000",
               "-af", "highpass=f=380,lowpass=f=3600,afade=t=in:d=0.004,afade=t=out:st=0.02:d=0.07,volume=0.7"],
    # Far end hangs up: a click, then the line drops.
    "hangup": ["-f", "lavfi", "-i",
               "aevalsrc='0.5*sin(2*PI*900*t)*exp(-t*90)+0.18*sin(2*PI*620*t)*lt(t\\,0.32)*gt(t\\,0.12)':s=48000:d=0.42",
               "-af", "highpass=f=300,lowpass=f=3400,afade=t=out:st=0.36:d=0.06"],
    # Trackpad click.
    "click": ["-f", "lavfi", "-i",
              "aevalsrc='0.42*sin(2*PI*1500*t)*exp(-t*230)+0.2*sin(2*PI*3100*t)*exp(-t*380)+0.12*sin(2*PI*180*t)*exp(-t*60)':s=48000:d=0.08",
              "-af", "highpass=f=120,volume=0.9"],
    # Soft laptop key.
    "key": ["-f", "lavfi", "-i",
            "aevalsrc='0.16*sin(2*PI*2400*t)*exp(-t*480)+0.1*sin(2*PI*900*t)*exp(-t*300)':s=48000:d=0.04",
            "-af", "highpass=f=500"],
    # Two-note notification chime (E6 -> B6).
    "chime": ["-f", "lavfi", "-i",
              "aevalsrc='0.24*sin(2*PI*1318.5*t)*exp(-t*6)*lt(t\\,0.16)+0.24*sin(2*PI*1975.5*(t-0.13))*exp(-(t-0.13)*4.5)*gt(t\\,0.13)':s=48000:d=0.9",
              "-af", "afade=t=out:st=0.75:d=0.15"],
    # Fast-forward through the middle of a call.
    "skip": ["-f", "lavfi", "-i", "anoisesrc=d=0.75:c=pink:a=0.35:r=48000",
             "-af", "highpass=f=700,lowpass=f=5200,afade=t=in:d=0.25,afade=t=out:st=0.35:d=0.4,volume=0.55"],
    # Quiet line hiss under a connected call, so gaps are not dead digital silence.
    "line": ["-f", "lavfi", "-i", "anoisesrc=d=8:c=pink:a=0.5:r=48000",
             "-af", "highpass=f=300,lowpass=f=3400,volume=0.012"],
}


def build_sfx() -> dict:
    out = {}
    for name, args in SFX.items():
        path = OUT / "sfx" / f"{name}.wav"
        path.parent.mkdir(parents=True, exist_ok=True)
        ffmpeg(*args, "-ac", "1", "-ar", str(SR), "-c:a", "pcm_s16le", str(path))
        out[name] = {"file": f"v2/audio/sfx/{name}.wav", "duration": duration(path)}
    return out


# ── main ─────────────────────────────────────────────────────────────────────

def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", action="store_true", help="write out/preview-<call>.wav mixes")
    args = ap.parse_args()

    script = json.loads(SCRIPT.read_text(encoding="utf-8"))
    voices = script["voices"]
    tmp = Path(tempfile.mkdtemp(prefix="refcheck-v2-audio-"))

    items: list[tuple[str, str, dict, Path]] = []
    for n in script["narration"]:
        items.append((n.get("say", n["text"]), "narrator", voices["narrator"], tmp / f"n-{n['id']}.wav"))
    for call_key, call in script["calls"].items():
        for line in call["lines"]:
            role = "agent" if line["who"] == "bot" else call_key
            items.append((line.get("say", line["text"]), role, voices[role], tmp / f"c-{call_key}-{line['id']}.wav"))

    print(f"synthesizing {len(items)} lines ...")
    synthesize(items)

    manifest: dict = {"narration": {}, "calls": {}, "sfx": {}}
    for n in script["narration"]:
        out = OUT / "narration" / f"{n['id']}.wav"
        d = process(tmp / f"n-{n['id']}.wav", CHAINS["narrator"], out)
        manifest["narration"][n["id"]] = {"file": f"v2/audio/narration/{n['id']}.wav", "duration": d,
                                          "text": n["text"]}
        print(f"  narration {n['id']:16s} {d:6.2f}s")

    for call_key, call in script["calls"].items():
        t = 0.0
        lines = []
        for line in call["lines"]:
            chain = CHAINS["agent"] if line["who"] == "bot" else CHAINS["phone"]
            out = OUT / "call" / f"{call_key}-{line['id']}.wav"
            d = process(tmp / f"c-{call_key}-{line['id']}.wav", chain, out)
            t += line.get("gap", 0.45)
            lines.append({"id": line["id"], "who": line["who"], "text": line["text"],
                          "file": f"v2/audio/call/{call_key}-{line['id']}.wav",
                          "start": round(t, 3), "duration": d,
                          **({"tag": line["tag"]} if "tag" in line else {}),
                          **({"skip": True} if line.get("skip") else {})})
            t += d
            print(f"  {call_key:6s} {line['id']} {line['who']:4s} @{lines[-1]['start']:6.2f}s  {d:5.2f}s  {line['text'][:60]}")
        manifest["calls"][call_key] = {"lines": lines, "end": round(t + 0.35, 3)}

    manifest["sfx"] = build_sfx()
    MANIFEST.write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    shutil.rmtree(tmp, ignore_errors=True)

    narr = sum(v["duration"] for v in manifest["narration"].values())
    print(f"\nnarration total {narr:.1f}s; calls: " +
          ", ".join(f"{k} {v['end']:.1f}s" for k, v in manifest["calls"].items()))

    if args.preview:
        (DEMO / "out").mkdir(exist_ok=True)
        for call_key, call in manifest["calls"].items():
            inputs, filters = [], []
            for i, line in enumerate(call["lines"]):
                inputs += ["-i", str(DEMO / "public" / line["file"])]
                ms = int(line["start"] * 1000)
                filters.append(f"[{i}]adelay={ms}|{ms}[a{i}]")
            mix = "".join(f"[a{i}]" for i in range(len(call["lines"])))
            filters.append(f"{mix}amix=inputs={len(call['lines'])}:normalize=0[out]")
            ffmpeg(*inputs, "-filter_complex", ";".join(filters), "-map", "[out]",
                   str(DEMO / "out" / f"preview-{call_key}.wav"))
        print("wrote out/preview-*.wav")


if __name__ == "__main__":
    main()
