import React from "react";
import { Sequence, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { useAudioData, visualizeAudio } from "@remotion/media-utils";
import { FastForward, PhoneOff } from "lucide-react";
import manifest from "./audio-manifest.json";
import { C, FONT, MONO } from "./theme";

type Line = { id: string; who: string; start: number; duration: number; file: string; skip?: boolean };

export type CallSpec = {
  key: "james" | "daniel";
  name: string;
  initials: string;
  relationship: string;
  phone: string;
  refIndex: number;
  callId: string;
  /** scene frame the line connects on (pickup) */
  connectAt: number;
  /** scene frame ringing starts; omit when the call is shown already connected */
  ringFrom?: number;
  /** call clock at connectAt, in seconds */
  clockOffset: number;
  /** seconds the clock jumps across the skipped middle */
  skipSeconds?: number;
  /** question-coverage plan: [sceneSecondFromConnect, dotIndex, state] */
  dots: [number, number, "active" | "done" | "none"][];
  initialDots?: ("pending" | "done" | "none")[];
};

const FPS = 30;
const AGENT = "#0A84FF";
const REFEREE = "#30D158";

const Bars: React.FC<{ values: number[]; color: string }> = ({ values, color }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 40 }}>
    {values.map((v, i) => (
      <div key={i} style={{ width: 4, height: 4 + Math.min(1, v) * 34, borderRadius: 2, background: color }} />
    ))}
  </div>
);

/** Bars from the line's real audio; frame 0 is the line's start (inside a Sequence). */
const LineWave: React.FC<{ file: string; color: string }> = ({ file, color }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const audio = useAudioData(staticFile(file));
  if (!audio) return <Bars values={Array(20).fill(0.05)} color={color} />;
  const bins = visualizeAudio({ fps, frame, audioData: audio, numberOfSamples: 32, smoothing: true }).slice(1, 11);
  const values = [...bins.slice().reverse(), ...bins].map((v) => Math.min(1, Math.sqrt(v) * 2.1));
  return <Bars values={values} color={color} />;
};

const Badge: React.FC<{ text: string; color: string; size?: number }> = ({ text, color, size = 44 }) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: `${color}26`,
      border: `1.5px solid ${color}AA`,
      color,
      fontWeight: 700,
      fontSize: size * 0.34,
      flexShrink: 0,
    }}
  >
    {text}
  </div>
);

export const CallPanel: React.FC<{ spec: CallSpec; left: number; top: number; opacity: number; slide: number }> = ({
  spec,
  left,
  top,
  opacity,
  slide,
}) => {
  const frame = useCurrentFrame();
  const call = manifest.calls[spec.key];
  const lines = call.lines as Line[];
  const t = (frame - spec.connectAt) / FPS; // seconds since pickup
  const endAt = call.end;
  const phase = t < 0 ? (spec.ringFrom != null && frame >= spec.ringFrom ? "ringing" : "dialing") : t < endAt ? "connected" : "ended";

  // Call clock, jumping across the skipped middle.
  const skipLine = lines.find((l) => l.skip);
  let clock = spec.clockOffset + Math.max(0, Math.min(t, endAt));
  if (skipLine && spec.skipSeconds) {
    const gapStart = lines[lines.indexOf(skipLine) - 1];
    const s0 = gapStart.start + gapStart.duration + 0.15;
    const s1 = skipLine.start - 0.1;
    const k = Math.max(0, Math.min(1, (t - s0) / (s1 - s0)));
    clock += spec.skipSeconds * k * k * (3 - 2 * k);
  }
  const mm = String(Math.floor(clock / 60)).padStart(2, "0");
  const ss = String(Math.floor(clock % 60)).padStart(2, "0");
  const skipping =
    !!skipLine &&
    (() => {
      const prev = lines[lines.indexOf(skipLine) - 1];
      return t > prev.start + prev.duration + 0.05 && t < skipLine.start;
    })();

  const active = phase === "connected" ? lines.find((l) => t >= l.start && t < l.start + l.duration) : undefined;

  // Question coverage dots.
  const dots: ("pending" | "active" | "done" | "none")[] = [...(spec.initialDots ?? Array(9).fill("pending"))];
  for (const [at, i, state] of spec.dots) if (t >= at) dots[i] = state;

  const ringPulse = phase === "ringing" || phase === "dialing" ? (frame % 36) / 36 : 0;

  const wave = (who: "bot" | "user", color: string) => (
    <div style={{ width: 150, display: "flex", justifyContent: "flex-end", position: "relative", height: 40 }}>
      {(!active || active.who !== who) && (
        <Bars values={Array(20).fill(phase === "connected" ? 0.05 : 0.02)} color={`${color}55`} />
      )}
      {lines.map((l) =>
        l.who === who ? (
          <Sequence
            key={l.id}
            from={spec.connectAt + Math.round(l.start * FPS)}
            durationInFrames={Math.max(1, Math.round(l.duration * FPS))}
            layout="none"
          >
            <LineWave file={l.file} color={color} />
          </Sequence>
        ) : null,
      )}
    </div>
  );

  const row = (who: "bot" | "user", color: string, badge: React.ReactNode, title: string, sub: string) => {
    const on = active?.who === who;
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          padding: "14px 16px",
          borderRadius: 16,
          background: on ? `${color}1F` : "rgba(255,255,255,0.03)",
          border: `1px solid ${on ? `${color}88` : "rgba(255,255,255,0.08)"}`,
        }}
      >
        {badge}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: "#F5F5F7", fontSize: 18, fontWeight: 600 }}>{title}</div>
          <div style={{ color: "rgba(235,235,245,0.6)", fontSize: 14, marginTop: 1 }}>{sub}</div>
        </div>
        {wave(who, color)}
      </div>
    );
  };

  return (
    <div
      style={{
        position: "absolute",
        left: left + (1 - slide) * 90,
        top,
        width: 560,
        height: 770,
        opacity,
        borderRadius: 30,
        background: "linear-gradient(180deg, #1C1C1E 0%, #141416 100%)",
        border: "1px solid rgba(255,255,255,0.08)",
        boxShadow: "0 40px 100px rgba(15,23,42,0.45), 0 12px 30px rgba(15,23,42,0.25)",
        fontFamily: FONT,
        overflow: "hidden",
        color: "#F5F5F7",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 26px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span
            style={{
              background: "linear-gradient(135deg, #0A84FF, #5E5CE6)",
              color: "#fff",
              fontWeight: 800,
              fontSize: 14,
              padding: "5px 11px",
              borderRadius: 8,
              letterSpacing: 0.6,
            }}
          >
            CALL-E
          </span>
          <span style={{ color: "rgba(235,235,245,0.6)", fontSize: 15 }}>Outbound call</span>
        </div>
        <span style={{ color: "rgba(235,235,245,0.6)", fontSize: 15 }}>Reference {spec.refIndex} of 3</span>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginTop: 34 }}>
        <div style={{ position: "relative", width: 112, height: 112 }}>
          {phase !== "connected" && phase !== "ended"
            ? [0, 0.5].map((o) => {
                const p = (ringPulse + o) % 1;
                return (
                  <div
                    key={o}
                    style={{
                      position: "absolute",
                      inset: -p * 30,
                      borderRadius: "50%",
                      border: `2px solid rgba(48,209,88,${0.6 * (1 - p)})`,
                    }}
                  />
                );
              })
            : null}
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #636366, #3A3A3C)",
              border: `2px solid ${phase === "connected" ? REFEREE : "rgba(255,255,255,0.12)"}`,
              fontSize: 40,
              fontWeight: 600,
            }}
          >
            {spec.initials}
          </div>
        </div>
        <div style={{ fontSize: 30, fontWeight: 700, marginTop: 20, letterSpacing: "-0.4px" }}>{spec.name}</div>
        <div style={{ color: "rgba(235,235,245,0.6)", fontSize: 16, marginTop: 5 }}>{spec.relationship}</div>
        <div style={{ color: "rgba(235,235,245,0.45)", fontSize: 15, marginTop: 3, fontFamily: MONO }}>{spec.phone}</div>
        <div
          style={{
            marginTop: 16,
            fontSize: 20,
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 10,
            color: phase === "connected" ? REFEREE : phase === "ended" ? "rgba(235,235,245,0.6)" : "#F5F5F7",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {phase === "connected" && (
            <span style={{ width: 10, height: 10, borderRadius: 5, background: REFEREE, boxShadow: `0 0 12px ${REFEREE}` }} />
          )}
          {phase === "ended" && <PhoneOff size={18} />}
          {phase === "dialing" && "Dialing…"}
          {phase === "ringing" && "Ringing…"}
          {phase === "connected" && `${mm}:${ss}`}
          {phase === "ended" && `Call ended · ${mm}:${ss}`}
          {skipping && <FastForward size={20} fill="currentColor" style={{ marginLeft: 4 }} />}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "30px 22px 0" }}>
        {row("bot", AGENT, <Badge text="AI" color={AGENT} />, "Alex", "RefCheck agent · via CALL-E")}
        {row("user", REFEREE, <Badge text={spec.initials} color={REFEREE} />, spec.name, "Referee")}
      </div>

      <div style={{ padding: "24px 26px 0" }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "rgba(235,235,245,0.55)", marginBottom: 10 }}>
          <span>Software Engineer questions</span>
          <span style={{ fontVariantNumeric: "tabular-nums" }}>
            {dots.filter((d) => d === "done").length} / 9 answered
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {dots.map((d, i) => {
            const pulse = 0.55 + 0.45 * Math.sin(frame * 0.3);
            const bg =
              d === "done" ? REFEREE : d === "active" ? AGENT : d === "none" ? "rgba(235,235,245,0.18)" : "transparent";
            return (
              <div
                key={i}
                style={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  background: bg,
                  opacity: d === "active" ? pulse : 1,
                  border: d === "pending" ? "1px solid rgba(235,235,245,0.25)" : "none",
                  boxSizing: "border-box",
                }}
              />
            );
          })}
        </div>
      </div>

      {phase === "ended" && (
        <div
          style={{
            margin: "26px 26px 0",
            padding: "12px 14px",
            borderRadius: 12,
            background: "rgba(48,209,88,0.12)",
            border: "1px solid rgba(48,209,88,0.45)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontFamily: MONO,
            fontSize: 14,
            color: "#7EE787",
            opacity: Math.min(1, (t - endAt) * 3),
          }}
        >
          <span style={{ fontWeight: 700 }}>call.completed</span>
          <span style={{ color: "rgba(235,235,245,0.5)" }}>→ structured_result</span>
          <span style={{ marginLeft: "auto", fontFamily: FONT, fontWeight: 700, fontSize: 13 }}>✓ schema-valid</span>
        </div>
      )}

      <div style={{ position: "absolute", left: 26, right: 26, bottom: 22, fontSize: 12.5, color: "rgba(235,235,245,0.45)", lineHeight: 1.8 }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>Call id</span>
          <span style={{ fontFamily: MONO, color: "rgba(235,235,245,0.75)" }}>{spec.callId}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>result_schema</span>
          <span style={{ fontFamily: MONO, color: "rgba(235,235,245,0.75)" }}>9 answers · strict</span>
        </div>
      </div>
    </div>
  );
};

/** Frames (relative to connectAt) of every call line, for audio placement. */
export const callLines = (key: "james" | "daniel") => manifest.calls[key].lines as Line[];
export const callEnd = (key: "james" | "daniel") => manifest.calls[key].end;
export { C };
