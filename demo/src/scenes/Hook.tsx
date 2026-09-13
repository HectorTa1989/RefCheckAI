import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { Phone } from "lucide-react";
import { Backdrop } from "../ui/Stage";
import { C } from "../theme";
import { ramp, inOut } from "../anim";

const Stat: React.FC<{
  value: string;
  label: string;
  color: string;
  at: number;
  frame: number;
}> = ({ value, label, color, at, frame }) => {
  const t = ramp(frame, at, at + 20, 0, 1);
  return (
    <div
      style={{
        flex: 1,
        background: "rgba(255,255,255,0.82)",
        border: `1px solid rgba(0,0,0,0.06)`,
        borderRadius: 22,
        padding: "30px 30px 32px",
        boxShadow: "0 14px 44px rgba(0,0,0,0.09)",
        opacity: t,
        transform: `translateY(${(1 - t) * 26}px)`,
      }}
    >
      <div
        style={{
          fontSize: 64,
          fontWeight: 800,
          color,
          letterSpacing: "-2px",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      <div
        style={{
          fontSize: 21,
          color: C.secondary,
          marginTop: 12,
          lineHeight: 1.35,
          fontWeight: 450,
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const Hook: React.FC = () => {
  const frame = useCurrentFrame();

  const head = ramp(frame, 6, 34, 0, 1);
  const problemOut = ramp(frame, 442, 470, 1, 0);
  const logo = ramp(frame, 462, 496, 0, 1);

  return (
    <Backdrop>
      {/* ── Problem statement ── */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          padding: "0 150px",
          opacity: problemOut,
          transform: `scale(${1 - (1 - problemOut) * 0.04})`,
        }}
      >
        <div
          style={{
            fontSize: 62,
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-1.8px",
            textAlign: "center",
            lineHeight: 1.14,
            opacity: head,
            transform: `translateY(${(1 - head) * 22}px)`,
            maxWidth: 1400,
          }}
        >
          Reference checks are the last part of hiring
          <br />
          that still happens entirely{" "}
          <span style={{ color: C.blue }}>on the phone</span>.
        </div>

        <div style={{ display: "flex", gap: 26, marginTop: 76, width: 1440 }}>
          <Stat frame={frame} at={150} value="3–5 hrs" label="of phone tag per hire" color={C.text} />
          <Stat frame={frame} at={330} value="80%" label="of employers still require them" color={C.orange} />
          <Stat frame={frame} at={372} value="1 in 3" label="get skipped or rubber-stamped" color={C.red} />
        </div>
      </AbsoluteFill>

      {/* ── Logo lockup ── */}
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          opacity: logo,
        }}
      >
        <div
          style={{
            transform: `translateY(${(1 - logo) * 26}px) scale(${0.96 + logo * 0.04})`,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 116,
              height: 116,
              borderRadius: 30,
              background: "linear-gradient(135deg, #0071E3, #0056B0)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 34px",
              boxShadow: "0 22px 56px rgba(0,113,227,0.36)",
            }}
          >
            <Phone size={54} color="#fff" strokeWidth={2.1} />
          </div>
          <div
            style={{
              fontSize: 88,
              fontWeight: 800,
              color: C.text,
              letterSpacing: "-2.6px",
              lineHeight: 1,
            }}
          >
            RefCheck AI
          </div>
          <div
            style={{
              fontSize: 30,
              color: C.secondary,
              marginTop: 20,
              fontWeight: 450,
              letterSpacing: "-0.3px",
            }}
          >
            Automated employment reference verification by phone
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              marginTop: 32,
              padding: "10px 24px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.9)",
              border: `1px solid ${C.border}`,
              fontSize: 20,
              fontWeight: 600,
              color: C.secondary,
              boxShadow: "0 6px 22px rgba(0,0,0,0.08)",
            }}
          >
            Built on
            <span style={{ color: C.text, fontWeight: 800, letterSpacing: "-0.2px" }}>
              CALL-E
            </span>
          </div>
        </div>
      </AbsoluteFill>

      {/* fade to next scene */}
      <AbsoluteFill
        style={{
          background: "#fff",
          opacity: 1 - inOut(frame, 0, 600, 8),
          pointerEvents: "none",
        }}
      />
    </Backdrop>
  );
};
