import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Phone, ArrowRight } from "lucide-react";
import { Backdrop } from "../ui/Stage";
import { C } from "../theme";
import { ramp } from "../anim";

const Metric: React.FC<{
  head: string;
  value: string;
  sub: string;
  color: string;
  t: number;
  dim?: boolean;
}> = ({ head, value, sub, color, t, dim }) => (
  <div
    style={{
      background: dim ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.92)",
      border: `1px solid rgba(0,0,0,0.06)`,
      borderRadius: 26,
      padding: "36px 44px",
      minWidth: 430,
      textAlign: "center",
      boxShadow: dim
        ? "0 10px 30px rgba(0,0,0,0.06)"
        : "0 22px 64px rgba(0,113,227,0.20)",
      opacity: t,
      transform: `translateY(${(1 - t) * 22}px) scale(${dim ? 0.94 : 1})`,
    }}
  >
    <div
      style={{
        fontSize: 17,
        fontWeight: 700,
        color: C.tertiary,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
      }}
    >
      {head}
    </div>
    <div
      style={{
        fontSize: 82,
        fontWeight: 800,
        color,
        letterSpacing: "-2.6px",
        lineHeight: 1.05,
        marginTop: 12,
        textDecoration: dim ? "line-through" : "none",
        textDecorationThickness: dim ? 4 : undefined,
        textDecorationColor: dim ? "rgba(255,59,48,0.5)" : undefined,
      }}
    >
      {value}
    </div>
    <div style={{ fontSize: 21, color: C.secondary, marginTop: 10 }}>{sub}</div>
  </div>
);

export const Outro: React.FC = () => {
  const frame = useCurrentFrame();

  const compareOut = ramp(frame, 232, 262, 1, 0);
  const endIn = ramp(frame, 252, 288, 0, 1);

  return (
    <Backdrop>
      {/* before / after */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: compareOut,
          transform: `scale(${1 - (1 - compareOut) * 0.05})`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 46 }}>
          <Metric
            head="Today"
            value="3–5 hrs"
            sub="of recruiter phone time per hire"
            color={C.secondary}
            t={ramp(frame, 8, 34, 0, 1)}
            dim
          />
          <ArrowRight
            size={64}
            color={C.blue}
            strokeWidth={2.4}
            style={{ opacity: ramp(frame, 46, 70, 0, 1) }}
          />
          <Metric
            head="With RefCheck AI"
            value="~20 min"
            sub="fully automated, evidence on file"
            color={C.blue}
            t={ramp(frame, 62, 92, 0, 1)}
          />
        </div>

        <div
          style={{
            marginTop: 66,
            fontSize: 32,
            color: C.text,
            fontWeight: 500,
            letterSpacing: "-0.5px",
            textAlign: "center",
            opacity: ramp(frame, 120, 152, 0, 1),
            transform: `translateY(${(1 - ramp(frame, 120, 152, 0, 1)) * 14}px)`,
          }}
        >
          A hiring decision backed by <b style={{ fontWeight: 750 }}>evidence</b> —
          <br />
          not a voicemail nobody returned.
        </div>
      </AbsoluteFill>

      {/* end card */}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: endIn }}>
        <div
          style={{
            textAlign: "center",
            transform: `translateY(${(1 - endIn) * 24}px)`,
          }}
        >
          <div
            style={{
              width: 108,
              height: 108,
              borderRadius: 28,
              background: "linear-gradient(135deg, #0071E3, #0056B0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 30px",
              boxShadow: "0 22px 56px rgba(0,113,227,0.36)",
            }}
          >
            <Phone size={50} color="#fff" strokeWidth={2.1} />
          </div>

          <div
            style={{
              fontSize: 82,
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-2.4px",
              lineHeight: 1,
            }}
          >
            RefCheck AI
          </div>
          <div style={{ fontSize: 27, color: C.secondary, marginTop: 16, fontWeight: 450 }}>
            Automated employment reference verification by phone
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 36,
              flexWrap: "wrap",
              opacity: ramp(frame, 292, 322, 0, 1),
            }}
          >
            {["CALL-E", "FastAPI", "Next.js 15", "Supabase", "WeasyPrint"].map((s) => (
              <span
                key={s}
                style={{
                  padding: "9px 20px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.9)",
                  border: `1px solid ${C.border}`,
                  fontSize: 19,
                  fontWeight: 600,
                  color: s === "CALL-E" ? C.blue : C.secondary,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                {s}
              </span>
            ))}
          </div>

          <div
            style={{
              marginTop: 34,
              fontSize: 21,
              color: C.tertiary,
              opacity: ramp(frame, 312, 340, 0, 1),
            }}
          >
            github.com/HectorTa1989/refcheck-ai
          </div>
        </div>
      </AbsoluteFill>

      {/* final fade */}
      <AbsoluteFill
        style={{ background: "#fff", opacity: ramp(frame, 372, 390, 0, 1), pointerEvents: "none" }}
      />
    </Backdrop>
  );
};
