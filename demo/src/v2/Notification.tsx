import React from "react";
import { Mail } from "lucide-react";
import { CANDIDATE } from "./data";
import { FONT } from "./theme";

/** macOS banner for the completion email (backend/services/email_service.py). */
export const EmailBanner: React.FC<{ t: number }> = ({ t }) => {
  if (t <= 0) return null;
  const score = CANDIDATE.overall.toFixed(1);
  return (
    <div
      style={{
        position: "absolute",
        right: 28 - (1 - t) * 420,
        top: 26,
        width: 400,
        borderRadius: 18,
        background: "rgba(246,246,248,0.94)",
        border: "1px solid rgba(0,0,0,0.08)",
        boxShadow: "0 22px 60px rgba(15,23,42,0.28), 0 4px 14px rgba(15,23,42,0.12)",
        padding: "14px 16px",
        display: "flex",
        gap: 12,
        fontFamily: FONT,
        color: "#1D1D1F",
        opacity: Math.min(1, t * 1.4),
        zIndex: 50,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: "linear-gradient(180deg, #2E9BFF, #0A6CFF)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <Mail size={22} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ fontWeight: 700 }}>RefCheck AI</span>
          <span style={{ color: "#8E8E93" }}>now</span>
        </div>
        <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 2 }}>
          RefCheck complete — {CANDIDATE.name} · {score}/10
        </div>
        <div style={{ fontSize: 13, color: "#48484A", marginTop: 2, lineHeight: 1.35 }}>
          Overall reference score {score}/10 · Recommendation: Yes. View Full Report →
        </div>
      </div>
    </div>
  );
};
