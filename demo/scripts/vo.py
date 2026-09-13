"""Generate natural-voice narration clips with Edge neural TTS."""
import asyncio, json, subprocess, sys
from pathlib import Path
import edge_tts

VOICE = "en-US-AndrewMultilingualNeural"   # warm / confident / authentic
RATE  = "+4%"
PITCH = "-2Hz"

OUT = Path(__file__).resolve().parent.parent / "public" / "vo"
OUT.mkdir(parents=True, exist_ok=True)

# "Call E" (not "CALL-E") so the TTS reads it as "call-ee" rather than spelling it.
LINES = [
    ("01_hook",
     "Every hire needs reference checks. And every recruiter quietly dreads them. "
     "Three to five hours of phone tag per candidate, chasing managers who never pick up. "
     "So most teams either skip it, or rubber stamp it. "
     "RefCheck A.I. does it properly, in about twenty minutes, with nobody on the line."),

    ("02_dashboard",
     "This is the recruiter's dashboard. Every candidate, every score, at a glance. "
     "Green rings passed. Amber needs a second look. "
     "Let's run a new check."),

    ("03_candidate",
     "Step one, who are we hiring? "
     "Maria Chen, Senior Software Engineer, at Acme Corp. "
     "The job description summary is optional, but it's what lets the agent ask role specific fit questions, "
     "instead of generic ones."),

    ("04_references",
     "Step two, the references. Name, phone number, and, importantly, the relationship. "
     "A former direct manager gets asked very different questions than a peer. "
     "Add up to four."),

    ("05_template",
     "Step three, the question set. Nine structured questions, tuned per role family. "
     "Engineering, sales, or leadership. Or write your own."),

    ("06_launch",
     "Step four. Review, and launch."),

    ("07_calle",
     "This is where Call E takes over. Each reference gets a real outbound phone call. "
     "The agent introduces itself, confirms consent, and works through the questions conversationally. "
     "It probes when an answer is vague. It notes hesitation, because hesitation is signal. "
     "And if H.R. says we only confirm employment dates, it accepts that gracefully and moves on. "
     "And every call comes back as JSON that Call E has already validated against our own schema. "
     "There is no second model reading the transcript and guessing."),

    ("08_progress",
     "While the calls run, the recruiter watches progress live."),

    ("09_report",
     "And here's the payoff. A weighted score out of ten. "
     "Would you rehire this person counts double, because it's the single most predictive answer. "
     "Then a clear recommendation. "
     "And per reference: strengths, red flags, notable quotes, a score for every question, "
     "and the full transcript if you'd rather read it yourself."),

    ("10_export",
     "One click exports a shareable P.D.F. for the hiring panel."),

    ("11_outro",
     "Five hours of phone work, down to twenty minutes. "
     "And a hiring decision backed by evidence, instead of a voicemail nobody returned. "
     "RefCheck A.I. Built on Call E."),
]


def duration(p: Path) -> float:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", str(p)],
        capture_output=True, text=True, check=True)
    return float(out.stdout.strip())


async def main():
    manifest = {}
    for name, text in LINES:
        mp3 = OUT / f"{name}.mp3"
        await edge_tts.Communicate(text, VOICE, rate=RATE, pitch=PITCH).save(str(mp3))
        d = duration(mp3)
        manifest[name] = {"file": f"vo/{name}.mp3", "seconds": round(d, 3),
                          "text": text}
        print(f"{name:14s} {d:6.2f}s")

    total = sum(v["seconds"] for v in manifest.values())
    print(f"\nnarration total: {total:.2f}s ({total/60:.2f} min)")
    (OUT.parent.parent / "src" / "vo-manifest.json").write_text(
        json.dumps(manifest, indent=2), encoding="utf-8")

asyncio.run(main())
