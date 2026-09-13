import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { PhoneCall, ShieldCheck, CheckCircle2, AlertCircle, Sparkles } from "lucide-react";
import { Backdrop } from "../ui/Stage";
import { ChangeBox } from "../ui/App";
import { C, FONT, MONO } from "../theme";
import { ramp, typed } from "../anim";
import { CALL_BEATS, STRUCTURED_RESULT } from "../data";

const CALL_START = 96;

/* ── live waveform ── */
const Wave: React.FC<{ frame: number; active: boolean }> = ({ frame, active }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 3, height: 26 }}>
    {Array.from({ length: 22 }).map((_, i) => {
      const h = active
        ? 5 +
          Math.abs(Math.sin(frame * 0.16 + i * 0.7) * Math.cos(frame * 0.07 + i * 1.3)) * 21
        : 4;
      return (
        <div
          key={i}
          style={{
            width: 3,
            height: h,
            borderRadius: 2,
            background: active ? C.green : C.tertiary,
            opacity: active ? 0.55 + (h / 26) * 0.45 : 0.5,
          }}
        />
      );
    })}
  </div>
);

/* ── transcript bubble ── */
const Bubble: React.FC<{
  who: "bot" | "user";
  text: string;
  t: number;
  tag?: string;
}> = ({ who, text, t, tag }) => {
  const bot = who === "bot";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: bot ? "flex-start" : "flex-end",
        marginBottom: 14,
        opacity: t,
        transform: `translateY(${(1 - t) * 14}px)`,
      }}
    >
      <div style={{ maxWidth: 620 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: bot ? C.blue : C.secondary,
            marginBottom: 5,
            textAlign: bot ? "left" : "right",
            letterSpacing: "0.02em",
          }}
        >
          {bot ? "REFCHECK AGENT" : "JAMES OKAFOR"}
        </div>
        <div
          style={{
            background: bot ? C.blue : "#FFFFFF",
            color: bot ? "#fff" : C.text,
            border: bot ? "none" : `1px solid ${C.border}`,
            borderRadius: 18,
            borderBottomLeftRadius: bot ? 6 : 18,
            borderBottomRightRadius: bot ? 18 : 6,
            padding: "13px 18px",
            fontSize: 20,
            lineHeight: 1.42,
            boxShadow: "0 4px 16px rgba(0,0,0,0.07)",
          }}
        >
          {text}
        </div>
        {tag && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              padding: "5px 12px",
              borderRadius: 999,
              background: C.orangeLt,
              color: "#9A5B00",
              fontSize: 14,
              fontWeight: 700,
            }}
          >
            <Sparkles size={13} />
            {tag}
          </div>
        )}
      </div>
    </div>
  );
};

const CODE = [
  { t: "from calle import CalleClient", k: "kw" },
  { t: "", k: "" },
  { t: "call = client.calls.create(", k: "" },
  { t: "    task=build_reference_task(reference, candidate),", k: "" },
  { t: '    recipients=[{"phones": [ref["referee_phone"]]}],', k: "" },
  { t: "    result_schema=REFERENCE_SCHEMA,", k: "hl" },
  { t: '    webhook_url=f"{API_URL}/api/calle/webhook",', k: "" },
  { t: '    metadata={"reference_id": ref["id"]},', k: "" },
  { t: "    idempotency_key=f\"ref_{ref['id']}\",", k: "" },
  { t: ")", k: "" },
];

export const CalleCall: React.FC = () => {
  const frame = useCurrentFrame();

  const panelsIn = ramp(frame, 4, 30, 0, 1);
  const connected = frame >= CALL_START;
  const elapsed = Math.max(0, Math.floor((frame - CALL_START) / 30));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, "0");
  const ss = String(elapsed % 60).padStart(2, "0");

  // transcript scroll once bubbles overflow
  const scroll = ramp(frame, 330, 560, 0, 152);

  const hrCard = ramp(frame, 496, 524, 0, 1) * ramp(frame, 648, 668, 1, 0);
  const resultIn = ramp(frame, 652, 682, 0, 1);

  return (
    <Backdrop>
      <AbsoluteFill style={{ padding: "62px 90px", fontFamily: FONT }}>
        {/* title */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 26,
            opacity: panelsIn,
          }}
        >
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 13,
              background: "linear-gradient(135deg, #0071E3, #0056B0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <PhoneCall size={23} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: 34, fontWeight: 750, letterSpacing: "-0.9px", color: C.text }}>
              CALL-E places the call
            </div>
            <div style={{ fontSize: 19, color: C.secondary, marginTop: 1 }}>
              One real outbound call per reference — structured result on the way back
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 30, flex: 1, minHeight: 0 }}>
          {/* ─── left: the live call ─── */}
          <div
            style={{
              flex: "0 0 840px",
              background: "rgba(255,255,255,0.72)",
              border: `1px solid rgba(0,0,0,0.07)`,
              borderRadius: 24,
              boxShadow: "0 20px 60px rgba(0,0,0,0.10)",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
              opacity: panelsIn,
              transform: `translateY(${(1 - panelsIn) * 18}px)`,
            }}
          >
            {/* call header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                padding: "20px 26px",
                borderBottom: `1px solid ${C.border2}`,
                background: "rgba(255,255,255,0.7)",
              }}
            >
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#8E8E93,#636366)",
                  color: "#fff",
                  fontSize: 20,
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                JO
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: C.text }}>James Okafor</div>
                <div style={{ fontSize: 17, color: C.secondary }}>
                  +1 (415) 555-0142 · Former direct manager
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <Wave frame={frame} active={connected} />
                <div
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 7,
                    padding: "7px 15px",
                    borderRadius: 999,
                    background: connected ? C.greenLt : C.orangeLt,
                    color: connected ? C.greenDk : "#9A5B00",
                    fontSize: 16,
                    fontWeight: 700,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  <span
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      background: connected ? C.green : C.orange,
                      opacity: 0.55 + Math.sin(frame * 0.25) * 0.45,
                    }}
                  />
                  {connected ? `On call ${mm}:${ss}` : "Dialing…"}
                </div>
              </div>
            </div>

            {/* transcript */}
            <div
              style={{
                flex: 1,
                position: "relative",
                overflow: "hidden",
                maskImage:
                  "linear-gradient(to bottom, transparent 0px, #000 26px, #000 100%)",
                WebkitMaskImage:
                  "linear-gradient(to bottom, transparent 0px, #000 26px, #000 100%)",
              }}
            >
              <div style={{ padding: "22px 26px", transform: `translateY(${-scroll}px)` }}>
                {CALL_BEATS.map((b, i) => (
                  <Bubble
                    key={i}
                    who={b.who}
                    text={b.text}
                    t={ramp(frame, CALL_START + b.at, CALL_START + b.at + 16, 0, 1)}
                    tag={
                      i === 6
                        ? "Follow-up probe · answer was high-praise but non-specific"
                        : undefined
                    }
                  />
                ))}
              </div>

              {/* HR-policy handling card */}
              <div
                style={{
                  position: "absolute",
                  left: 26,
                  right: 26,
                  bottom: 20,
                  background: "#FFFFFF",
                  border: `1px solid ${C.border}`,
                  borderRadius: 18,
                  padding: "16px 20px",
                  boxShadow: "0 16px 44px rgba(0,0,0,0.16)",
                  opacity: hrCard,
                  transform: `translateY(${(1 - hrCard) * 18}px)`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#9A5B00",
                    marginBottom: 7,
                  }}
                >
                  <AlertCircle size={15} />
                  HR POLICY DETECTED — “WE ONLY CONFIRM DATES”
                </div>
                <div style={{ fontSize: 19, color: C.text, lineHeight: 1.4 }}>
                  “I completely understand, and I appreciate your transparency. Is there anything at
                  all you’d like us to know about Maria as a professional?”
                </div>
                <div style={{ fontSize: 15, color: C.secondary, marginTop: 8 }}>
                  Accepts the boundary, asks once, then closes. Never pushes.
                </div>
              </div>
            </div>
          </div>

          {/* ─── right: the code + result ─── */}
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              gap: 18,
              opacity: panelsIn,
              transform: `translateY(${(1 - panelsIn) * 18}px)`,
            }}
          >
            {/* code */}
            <div
              style={{
                background: "#14161A",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
              }}
            >
              <div
                style={{
                  padding: "12px 20px",
                  background: "#1E2127",
                  color: "#8A93A0",
                  fontSize: 15,
                  fontFamily: MONO,
                  borderBottom: "1px solid #2A2E36",
                }}
              >
                backend/services/calle_service.py
              </div>
              <div style={{ padding: "16px 20px", fontFamily: MONO, fontSize: 16.5, lineHeight: 1.68 }}>
                {CODE.map((l, i) => {
                  const t = ramp(frame, 26 + i * 5, 40 + i * 5, 0, 1);
                  const txt = typed(frame, l.t, 26 + i * 5, 26 + i * 5 + Math.max(6, l.t.length * 0.32));
                  return (
                    <div
                      key={i}
                      style={{
                        color: l.k === "kw" ? "#C792EA" : l.k === "hl" ? "#7EE787" : "#C9D1D9",
                        whiteSpace: "pre",
                        opacity: t,
                        background: l.k === "hl" ? "rgba(126,231,135,0.09)" : "transparent",
                        borderLeft:
                          l.k === "hl" ? "2px solid #7EE787" : "2px solid transparent",
                        paddingLeft: 8,
                        marginLeft: -8,
                      }}
                    >
                      {txt || " "}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* structured result */}
            <div
              style={{
                flex: 1,
                background: "#14161A",
                borderRadius: 20,
                overflow: "hidden",
                boxShadow: "0 20px 60px rgba(0,0,0,0.28)",
                opacity: resultIn,
                transform: `translateY(${(1 - resultIn) * 16}px)`,
              }}
            >
              <div
                style={{
                  padding: "12px 20px",
                  background: "#16281C",
                  borderBottom: "1px solid #22432B",
                  display: "flex",
                  alignItems: "center",
                  gap: 9,
                }}
              >
                <CheckCircle2 size={17} color="#7EE787" />
                <span style={{ color: "#7EE787", fontSize: 15, fontFamily: MONO, fontWeight: 700 }}>
                  call.completed
                </span>
                <span style={{ color: "#5B6572", fontSize: 15, fontFamily: MONO }}>
                  → structured_result
                </span>
                <span
                  style={{
                    marginLeft: "auto",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 5,
                    color: "#7EE787",
                    fontSize: 13.5,
                    fontWeight: 700,
                  }}
                >
                  <ShieldCheck size={14} />
                  SCHEMA VALIDATED
                </span>
              </div>
              <div style={{ padding: "14px 20px", fontFamily: MONO, fontSize: 16, lineHeight: 1.62 }}>
                {STRUCTURED_RESULT.map((l, i) => (
                  <div
                    key={i}
                    style={{
                      color: l.includes('"') && l.includes(":") ? "#C9D1D9" : "#8A93A0",
                      whiteSpace: "pre",
                      opacity: ramp(frame, 686 + i * 6, 700 + i * 6, 0, 1),
                    }}
                  >
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Frame-space, deliberately outside the transformed column: the
            narration says "validated against our own schema" right here. */}
        <ChangeBox
          frame={frame}
          at={706}
          x={956}
          y={527}
          w={880}
          h={494}
          tone="green"
          hold={150}
          radius={20}
        />
      </AbsoluteFill>
    </Backdrop>
  );
};
