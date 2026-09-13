import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { Phone } from "lucide-react";
import { Backdrop } from "./stage";
import { C } from "./theme";

const ramp = (f: number, a: number, b: number) =>
  interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.2, 1) });

export const Outro: React.FC<{ dur: number }> = ({ dur }) => {
  const f = useCurrentFrame();
  const inT = ramp(f, 0, 22);
  const out = 1 - ramp(f, dur - 14, dur);
  return (
    <Backdrop>
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", opacity: inT * out }}>
        <div style={{ textAlign: "center", transform: `translateY(${(1 - inT) * 22}px)` }}>
          <div
            style={{
              width: 112,
              height: 112,
              borderRadius: 30,
              background: "linear-gradient(135deg, #0071E3, #0056B0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 30px",
              boxShadow: "0 22px 56px rgba(0,113,227,0.36)",
            }}
          >
            <Phone size={52} color="#fff" strokeWidth={2.1} />
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, color: C.text, letterSpacing: "-2.6px", lineHeight: 1 }}>
            RefCheck AI
          </div>
          <div style={{ fontSize: 28, color: C.secondary, marginTop: 18, fontWeight: 450, letterSpacing: "-0.3px" }}>
            Employment reference checks, by phone
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "center",
              marginTop: 38,
              opacity: ramp(f, 26, 46),
            }}
          >
            {["Built on CALL-E", "FastAPI", "Next.js", "Supabase"].map((s, i) => (
              <span
                key={s}
                style={{
                  padding: "10px 22px",
                  borderRadius: 999,
                  background: i === 0 ? C.blue : "rgba(255,255,255,0.92)",
                  border: i === 0 ? "none" : `1px solid ${C.border}`,
                  fontSize: 20,
                  fontWeight: 600,
                  color: i === 0 ? "#fff" : C.secondary,
                  boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
                }}
              >
                {s}
              </span>
            ))}
          </div>
          <div style={{ marginTop: 34, fontSize: 21, color: C.tertiary, opacity: ramp(f, 40, 60) }}>
            github.com/HectorTa1989
          </div>
        </div>
      </AbsoluteFill>
    </Backdrop>
  );
};
