import React from "react";
import { C, FONT, VIEWPORT, TITLEBAR } from "../theme";

/** macOS-style browser chrome wrapping the app viewport.
 *  Everything inside is laid out in VIEWPORT coordinates (1320x780). */
export const AppWindow: React.FC<{
  url?: string;
  children: React.ReactNode;
}> = ({ url = "refcheck.ai/dashboard", children }) => (
  <div
    style={{
      width: VIEWPORT.w,
      height: VIEWPORT.h + TITLEBAR,
      borderRadius: 14,
      overflow: "hidden",
      background: C.surface,
      boxShadow:
        "0 40px 100px rgba(0,0,0,0.34), 0 8px 26px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.06)",
      fontFamily: FONT,
      display: "flex",
      flexDirection: "column",
    }}
  >
    {/* title bar */}
    <div
      style={{
        height: TITLEBAR,
        flexShrink: 0,
        background: "#E9E9EB",
        borderBottom: "1px solid #D8D8DC",
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        gap: 8,
      }}
    >
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div
          key={c}
          style={{ width: 11, height: 11, borderRadius: "50%", background: c }}
        />
      ))}
      <div
        style={{
          marginLeft: 14,
          flex: 1,
          maxWidth: 420,
          height: 23,
          borderRadius: 6,
          background: "#FBFBFD",
          border: "1px solid #DDDDE1",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          fontSize: 11.5,
          color: C.secondary,
        }}
      >
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none">
          <rect x="4" y="10" width="16" height="11" rx="2.5" stroke={C.green} strokeWidth="2.4" />
          <path d="M8 10V7a4 4 0 018 0v3" stroke={C.green} strokeWidth="2.4" />
        </svg>
        {url}
      </div>
    </div>

    {/* viewport */}
    <div
      style={{
        width: VIEWPORT.w,
        height: VIEWPORT.h,
        position: "relative",
        overflow: "hidden",
        background: C.fill4,
        color: C.text,
        fontSize: 15,
        lineHeight: 1.47,
      }}
    >
      {children}
    </div>
  </div>
);
