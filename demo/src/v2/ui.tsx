/**
 * Frame-driven ports of frontend/components/* and the globals.css classes.
 * Markup and inline styles follow the real components; only state comes from
 * props (the video's frame) instead of React state and API calls.
 */
import React from "react";
import {
  AlertTriangle,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Phone,
  Star,
} from "lucide-react";
import { C, FONT, MONO, scoreColor } from "./theme";

export const dt = (id?: string) => (id ? { "data-t": id } : {});
export const dh = (id?: string) => (id ? { "data-hl": id } : {});

/* ───────────── Sidebar (components/Sidebar.tsx) ───────────── */

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard, id: "nav-dashboard" },
  { href: "/checks/new", label: "New Check", Icon: Phone, id: "nav-new" },
  { href: "/templates", label: "Templates", Icon: ListChecks, id: "nav-templates" },
];

export const Sidebar: React.FC<{ active: string; email?: string }> = ({
  active,
  email = "sarah@northwind.io",
}) => (
  <aside
    style={{
      position: "absolute",
      top: 0,
      left: 0,
      bottom: 0,
      width: 240,
      background: "rgba(255,255,255,0.85)",
      borderRight: "1px solid #D2D2D7",
      display: "flex",
      flexDirection: "column",
      zIndex: 100,
    }}
  >
    <div style={{ padding: "24px 20px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div
          style={{
            width: 32,
            height: 32,
            background: "linear-gradient(135deg, #0071E3, #0056B0)",
            borderRadius: 8,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Phone size={16} color="#fff" />
        </div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, lineHeight: 1.2 }}>RefCheck AI</div>
          <div
            {...dh("admin-badge")}
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.blue,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
            }}
          >
            Admin
          </div>
        </div>
      </div>
    </div>
    <div style={{ height: 1, background: "#E5E5EA", margin: "0 20px" }} />
    <nav style={{ flex: 1, padding: "12px 12px 0" }}>
      {NAV.map(({ href, label, Icon, id }) => {
        const on = href === active;
        return (
          <div
            key={href}
            {...dt(id)}
            {...dh(id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 12px",
              borderRadius: 10,
              fontSize: 14,
              fontWeight: on ? 600 : 400,
              color: on ? C.blue : C.text,
              background: on ? "rgba(0,113,227,0.08)" : "transparent",
              marginBottom: 2,
            }}
          >
            <Icon size={18} strokeWidth={on ? 2.2 : 1.8} />
            {label}
          </div>
        );
      })}
    </nav>
    <div style={{ padding: 12, borderTop: "1px solid #E5E5EA" }}>
      <div style={{ fontSize: 12, color: C.secondary, padding: "8px 12px" }}>{email}</div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "9px 12px",
          borderRadius: 10,
          color: C.secondary,
          fontSize: 14,
        }}
      >
        <LogOut size={16} />
        Sign out
      </div>
    </div>
  </aside>
);

/** Top of a `data-t` / `data-hl` element in page coordinates (unaffected by scroll). */
export type Y = (id: string) => number;
/** Page scroll for this frame, from element positions and the maximum scroll. */
export type ScrollFn = (y: Y, max: number) => number;

const VIEWPORT_H = 780;

/**
 * Scroll a page to elements rather than pixel offsets. Positions are measured
 * in the content's own coordinates, so they do not depend on the scroll they
 * produce, and the result is clamped like a browser clamps at the page end.
 */
export function useAnchoredScroll(scrollFn: ScrollFn | undefined, fixed: number) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [m, setM] = React.useState<{ a: Record<string, number>; h: number }>({ a: {}, h: 0 });
  React.useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const s = el.offsetWidth ? r.width / el.offsetWidth : 1;
    const a: Record<string, number> = {};
    el.querySelectorAll("[data-t],[data-hl]").forEach((n) => {
      const top = Math.round(((n.getBoundingClientRect().top - r.top) / s) * 2) / 2;
      const t = n.getAttribute("data-t");
      const h = n.getAttribute("data-hl");
      if (t) a[t] = top;
      if (h) a[h] = top;
    });
    const h = el.offsetHeight;
    const keys = Object.keys(a);
    const changed =
      h !== m.h || keys.length !== Object.keys(m.a).length || keys.some((k) => Math.abs((m.a[k] ?? -1e9) - a[k]) > 0.5);
    if (changed) setM({ a, h });
  });
  const max = Math.max(0, m.h - VIEWPORT_H);
  const raw = scrollFn ? scrollFn((id) => m.a[id] ?? 0, max) : fixed;
  return { ref, scroll: Math.min(max, Math.max(0, raw)) };
}

/** (app)/layout.tsx: sidebar + main column. */
export const AppShell: React.FC<{
  active: string;
  scroll?: number;
  scrollFn?: ScrollFn;
  maxWidth: number;
  enter?: number;
  children: React.ReactNode;
  overlay?: React.ReactNode;
}> = ({ active, scroll: fixed = 0, scrollFn, maxWidth, enter = 1, children, overlay }) => {
  const { ref, scroll } = useAnchoredScroll(scrollFn, fixed);
  return (
    <div style={{ position: "absolute", inset: 0, background: C.fill4, fontFamily: FONT }}>
      <Sidebar active={active} />
      <main style={{ position: "absolute", left: 240, top: 0, right: 0, bottom: 0, overflow: "hidden" }}>
        <div
          ref={ref}
          style={{
            padding: "40px 48px",
            maxWidth,
            transform: `translateY(${-scroll + (1 - enter) * 8}px)`,
            opacity: enter,
          }}
        >
          {children}
        </div>
      </main>
      {overlay}
    </div>
  );
};

/** Piecewise scroll plan: each step eases from wherever the last one ended. */
export type ScrollStep = { at: number; dur: number; to: (y: Y, max: number) => number };
export const planScroll =
  (frame: number, steps: ScrollStep[]): ScrollFn =>
  (y, max) => {
    let cur = 0;
    for (const s of steps) {
      if (frame < s.at) break;
      const target = Math.min(max, Math.max(0, s.to(y, max)));
      const k = Math.min(1, (frame - s.at) / s.dur);
      const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
      cur += (target - cur) * e;
    }
    return cur;
  };

/* ───────────── buttons / inputs (globals.css) ───────────── */

type BtnProps = {
  children: React.ReactNode;
  hover?: boolean;
  disabled?: boolean;
  t?: string;
  hl?: string;
  style?: React.CSSProperties;
};

const btnBase: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  fontSize: 15,
  fontWeight: 600,
  padding: "10px 22px",
  borderRadius: 980,
  whiteSpace: "nowrap",
  lineHeight: 1.47,
};

export const BtnPrimary: React.FC<BtnProps> = ({ children, hover, disabled, t, hl, style }) => (
  <span
    {...dt(t)}
    {...dh(hl)}
    style={{
      ...btnBase,
      background: hover && !disabled ? C.blueDk : C.blue,
      color: "#fff",
      opacity: disabled ? 0.45 : 1,
      ...style,
    }}
  >
    {children}
  </span>
);

export const BtnSecondary: React.FC<BtnProps> = ({ children, hover, disabled, t, hl, style }) => (
  <span
    {...dt(t)}
    {...dh(hl)}
    style={{
      ...btnBase,
      background: hover ? C.border : C.fill3,
      color: C.blue,
      opacity: disabled ? 0.45 : 1,
      ...style,
    }}
  >
    {children}
  </span>
);

export const BtnGhost: React.FC<BtnProps> = ({ children, hover, t, hl, style }) => (
  <span
    {...dt(t)}
    {...dh(hl)}
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6,
      background: hover ? C.blueLt : "transparent",
      color: C.blue,
      fontSize: 15,
      fontWeight: 500,
      padding: "8px 16px",
      borderRadius: 980,
      ...style,
    }}
  >
    {children}
  </span>
);

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      display: "block",
      fontSize: 13,
      fontWeight: 600,
      color: C.secondary,
      marginBottom: 6,
      textTransform: "uppercase",
      letterSpacing: "0.04em",
    }}
  >
    {children}
  </div>
);

const Caret: React.FC<{ on: boolean }> = ({ on }) => (
  <span
    style={{
      display: "inline-block",
      width: 1.5,
      height: 17,
      background: on ? C.blue : "transparent",
      marginLeft: 1,
      verticalAlign: "-3px",
    }}
  />
);

export const Input: React.FC<{
  value: string;
  placeholder: string;
  focused?: boolean;
  caret?: boolean;
  t?: string;
  hl?: string;
  multiline?: boolean;
}> = ({ value, placeholder, focused, caret, t, hl, multiline }) => (
  <div
    {...dt(t)}
    {...dh(hl)}
    style={{
      display: "block",
      width: "100%",
      padding: "11px 14px",
      background: C.fill4,
      border: `1.5px solid ${focused ? C.blue : C.border}`,
      boxShadow: focused ? "0 0 0 3px rgba(0,113,227,0.15)" : "none",
      borderRadius: 10,
      fontSize: 15,
      color: value ? C.text : C.tertiary,
      boxSizing: "border-box",
      whiteSpace: multiline ? "normal" : "nowrap",
      overflow: "hidden",
      minHeight: multiline ? 100 : undefined,
      lineHeight: 1.47,
    }}
  >
    {value || (focused ? "" : placeholder)}
    {focused && <Caret on={!!caret} />}
    {!value && focused && <span style={{ color: C.tertiary }}>{placeholder}</span>}
  </div>
);

export const Field: React.FC<{
  label: string;
  value: string;
  placeholder: string;
  focused?: boolean;
  caret?: boolean;
  t?: string;
  hl?: string;
  multiline?: boolean;
  style?: React.CSSProperties;
}> = ({ label, style, ...rest }) => (
  <div style={style}>
    <Label>{label}</Label>
    <Input {...rest} />
  </div>
);

export const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  sm?: boolean;
  hl?: string;
  t?: string;
}> = ({ children, style, sm, hl, t }) => (
  <div
    {...dh(hl)}
    {...dt(t)}
    style={{
      background: "#fff",
      borderRadius: sm ? 12 : 18,
      boxShadow: sm
        ? "0 1px 4px rgba(0,0,0,0.06), 0 0 1px rgba(0,0,0,0.04)"
        : "0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const Spinner: React.FC<{ size?: number; frame: number; light?: boolean }> = ({
  size = 20,
  frame,
  light,
}) => (
  <span
    style={{
      display: "inline-block",
      width: size,
      height: size,
      border: `2px solid ${light ? "rgba(255,255,255,0.35)" : C.fill3}`,
      borderTopColor: light ? "#fff" : C.blue,
      borderRadius: "50%",
      transform: `rotate(${(frame * 360) / 21}deg)`,
      flexShrink: 0,
    }}
  />
);

/* ───────────── ScoreRing / ScorePill / RecommendationBadge ───────────── */

/** `progress` 0..1 replays the real ring's 1 s overshoot fill. */
export const ScoreRing: React.FC<{
  score: number;
  size?: number;
  strokeWidth?: number;
  sublabel?: string;
  progress?: number;
}> = ({ score, size = 96, strokeWidth = 8, sublabel, progress = 1 }) => {
  const color = scoreColor(score);
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 10)) * progress;
  const fontSize = size < 80 ? size * 0.26 : size * 0.22;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E5E5EA" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - pct)}
          style={{ filter: `drop-shadow(0 0 6px ${color}55)` }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ fontSize, fontWeight: 800, color, letterSpacing: "-0.02em", lineHeight: 1 }}>
          {score > 0 ? score.toFixed(1) : "—"}
        </div>
        {sublabel && (
          <div style={{ fontSize: fontSize * 0.52, color: C.secondary, marginTop: 2, fontWeight: 500 }}>
            {sublabel}
          </div>
        )}
      </div>
    </div>
  );
};

/** Grey placeholder ring shown before a score exists. */
export const RingPlaceholder: React.FC<{ size: number; border: number; icon: number }> = ({
  size,
  border,
  icon,
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: "50%",
      background: C.fill4,
      border: `${border}px solid #E5E5EA`,
      boxSizing: "border-box",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <Phone size={icon} color={C.tertiary} />
  </div>
);

export const ScorePill: React.FC<{ score: number }> = ({ score }) => {
  const color = scoreColor(score);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "2px 8px",
        borderRadius: 100,
        background: `${color}18`,
        color,
        fontSize: 13,
        fontWeight: 700,
        letterSpacing: "-0.01em",
      }}
    >
      {score.toFixed(1)}
    </span>
  );
};

const REC: Record<string, { label: string; color: string; bg: string }> = {
  strong_yes: { label: "Strong Yes", color: "#34C759", bg: "#E8F9EE" },
  yes: { label: "Yes", color: "#34C759", bg: "#E8F9EE" },
  neutral: { label: "Neutral", color: "#FF9F0A", bg: "#FFF4E5" },
  no: { label: "No", color: "#FF3B30", bg: "#FEE8E8" },
  strong_no: { label: "Strong No", color: "#FF3B30", bg: "#FEE8E8" },
};

export const RecBadge: React.FC<{ rec: string; size?: "sm" | "md" | "lg"; hl?: string }> = ({
  rec,
  size = "md",
  hl,
}) => {
  const cfg = REC[rec];
  const pad = size === "sm" ? "3px 10px" : size === "lg" ? "7px 18px" : "5px 14px";
  const fs = size === "sm" ? 11 : size === "lg" ? 15 : 13;
  return (
    <span
      {...dh(hl)}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: pad,
        borderRadius: 100,
        background: cfg.bg,
        color: cfg.color,
        fontSize: fs,
        fontWeight: 700,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
};

/* ───────────── dashboard pieces ───────────── */

export const StatCard: React.FC<{
  label: string;
  value: string | number;
  Icon: React.ElementType;
  color: string;
  hl?: string;
}> = ({ label, value, Icon, color, hl }) => (
  <Card sm hl={hl} style={{ padding: "18px 20px", flex: 1 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px", lineHeight: 1.25 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>{label}</div>
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={color} />
      </div>
    </div>
  </Card>
);

export const TabBar: React.FC<{ tabs: { id: string; label: string }[]; active: string; hl?: string }> = ({
  tabs,
  active,
  hl,
}) => (
  <div
    {...dh(hl)}
    style={{
      display: "flex",
      gap: 2,
      background: C.fill3,
      borderRadius: 10,
      padding: 3,
      width: "fit-content",
    }}
  >
    {tabs.map((t) => {
      const on = t.id === active;
      return (
        <div
          key={t.id}
          {...dt(`tab-${t.id}`)}
          style={{
            flex: 1,
            textAlign: "center",
            padding: "7px 14px",
            borderRadius: 8,
            fontSize: 14,
            fontWeight: on ? 600 : 500,
            color: on ? C.text : C.secondary,
            background: on ? "#fff" : "transparent",
            boxShadow: on ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {t.label}
        </div>
      );
    })}
  </div>
);

const CARD_STATUS: Record<string, { label: string; color: string }> = {
  in_progress: { label: "In Progress", color: "#0071E3" },
  complete: { label: "Complete", color: "#34C759" },
};

export type CandidateRow = {
  id: string;
  name: string;
  role: string;
  company: string;
  score: number | null;
  rec: string | null;
  status: "in_progress" | "complete";
  when: string;
};

/** components/CandidateCard.tsx */
export const CandidateCard: React.FC<{ c: CandidateRow; t?: string }> = ({ c, t }) => {
  const s = CARD_STATUS[c.status];
  return (
    <Card t={t} style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
      {c.score != null ? (
        <ScoreRing score={c.score} size={72} strokeWidth={6} sublabel="/10" />
      ) : (
        <RingPlaceholder size={72} border={6} icon={22} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{c.name}</span>
          {c.rec && <RecBadge rec={c.rec} size="sm" />}
        </div>
        <div style={{ fontSize: 14, color: C.secondary, marginBottom: 8 }}>
          {c.role} · {c.company}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: s.color, display: "inline-block" }} />
            <span style={{ fontSize: 12, color: s.color, fontWeight: 600 }}>{s.label}</span>
          </span>
          <span style={{ fontSize: 12, color: C.tertiary }}>{c.when}</span>
        </div>
      </div>
      <ChevronRight size={18} color={C.tertiary} style={{ flexShrink: 0 }} />
    </Card>
  );
};

/* ───────────── new-check StepBar (checks/new/page.tsx) ───────────── */

export const StepBar: React.FC<{ current: number; hl?: string; icons: React.ElementType[] }> = ({
  current,
  hl,
  icons,
}) => {
  const labels = ["Candidate", "References", "Template", "Launch"];
  return (
    <div {...dh(hl)} style={{ display: "flex", alignItems: "center", marginBottom: 36 }}>
      {labels.map((label, i) => {
        const Icon = icons[i];
        const done = i < current;
        const active = i === current;
        return (
          <div key={label} style={{ display: "flex", alignItems: "center", flex: i < 3 ? 1 : undefined }}>
            <div
              {...dh(`step-${i}`)}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: done ? "#34C759" : active ? "#0071E3" : "#E5E5EA",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {done ? (
                  <span style={{ color: "#fff", fontSize: 16, lineHeight: 1 }}>✓</span>
                ) : (
                  <Icon size={16} color={active ? "#fff" : "#AEAEB2"} />
                )}
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#0071E3" : done ? "#34C759" : "#AEAEB2",
                  whiteSpace: "nowrap",
                }}
              >
                {label}
              </span>
            </div>
            {i < 3 && (
              <div
                style={{
                  flex: 1,
                  height: 2,
                  margin: "0 8px",
                  marginBottom: 20,
                  background: done ? "#34C759" : "#E5E5EA",
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ───────────── toast (react-hot-toast as themed in app/layout.tsx) ───────────── */

export const Toast: React.FC<{ text: string; t: number }> = ({ text, t }) => {
  if (t <= 0) return null;
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 16 + (1 - t) * -30,
        display: "flex",
        justifyContent: "center",
        opacity: t,
        zIndex: 800,
        pointerEvents: "none",
      }}
    >
      <div
        {...dh("toast")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "#1D1D1F",
          color: "#fff",
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 500,
          padding: "12px 18px",
          boxShadow: "0 4px 24px rgba(0,0,0,0.18)",
          transform: `scale(${0.9 + t * 0.1})`,
        }}
      >
        <span
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#34C759",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={13} color="#fff" strokeWidth={3.2} />
        </span>
        {text}
      </div>
    </div>
  );
};

/* ───────────── ReferencePanel (components/ReferencePanel.tsx) ───────────── */

export type Answer = { text: string; score: number | null };
export type RefData = {
  key: string;
  referee_name: string;
  relationship: string;
  company_at_time?: string;
  call_status: "queued" | "calling" | "completed" | "failed";
  overall_reference_score?: number | null;
  would_rehire?: boolean | null;
  referee_enthusiasm?: string | null;
  summary?: string;
  strengths?: string[];
  red_flags?: string[];
  notable_quotes?: string[];
  answers?: Record<string, Answer>;
  transcript?: string;
};

export const STATUS_CFG: Record<string, { label: string; color: string }> = {
  queued: { label: "Queued", color: "#6E6E73" },
  calling: { label: "In Progress", color: "#0071E3" },
  completed: { label: "Completed", color: "#34C759" },
  failed: { label: "Failed", color: "#FF3B30" },
};

const ENTHUSIASM: Record<string, { label: string; stars: number }> = {
  very_enthusiastic: { label: "Very Enthusiastic", stars: 5 },
  positive: { label: "Positive", stars: 4 },
  neutral: { label: "Neutral", stars: 3 },
  hesitant: { label: "Hesitant", stars: 2 },
  negative: { label: "Negative", stars: 1 },
};

export const QUESTION_LABELS: Record<string, string> = {
  q_relationship: "Working Relationship",
  q_role: "Responsibilities",
  q_strengths: "Key Strengths",
  q_areas_for_growth: "Areas for Growth",
  q_achievement: "Notable Achievement",
  q_under_pressure: "Under Pressure",
  q_collaboration: "Collaboration",
  q_rehire: "Would Rehire",
  q_fit: "Role Fit",
  q_technical: "Technical Ability",
  q_problem_solving: "Problem Solving",
  q_code_quality: "Code Quality",
  q_learning: "Learning Agility",
};

const upper: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

const ScoreBar: React.FC<{ score: number | null }> = ({ score }) => {
  if (score == null) {
    return <span style={{ fontSize: 12, fontWeight: 600, color: "#AEAEB2" }}>Not answered</span>;
  }
  const color = score >= 4 ? "#34C759" : score >= 3 ? "#FF9F0A" : "#FF3B30";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ flex: 1, height: 4, background: "#E5E5EA", borderRadius: 100, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(score / 5) * 100}%`, background: color, borderRadius: 100 }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color, minWidth: 28 }}>{score}/5</span>
    </div>
  );
};

export const ReferencePanel: React.FC<{
  r: RefData;
  expanded: boolean;
  showTranscript?: boolean;
  /** 0..1 reveal of the expanded body */
  open?: number;
  idPrefix: string;
  /** show only the first N question cards (keeps long panels in budget) */
  maxAnswers?: number;
}> = ({ r, expanded, showTranscript, open = 1, idPrefix, maxAnswers }) => {
  const status = STATUS_CFG[r.call_status];
  const answers = r.answers ?? {};
  const qids = Object.keys(answers).slice(0, maxAnswers ?? 99);
  const enth = r.referee_enthusiasm ? ENTHUSIASM[r.referee_enthusiasm] : null;
  return (
    <Card hl={`${idPrefix}-card`} style={{ overflow: "hidden", marginBottom: 12 }}>
      <div
        {...dt(`${idPrefix}-head`)}
        style={{ width: "100%", display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", boxSizing: "border-box" }}
      >
        <span
          {...dh(`${idPrefix}-dot`)}
          style={{
            display: "inline-block",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: status.color,
            boxShadow: `0 0 0 3px ${status.color}22`,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{r.referee_name}</span>
            {r.overall_reference_score != null && <ScorePill score={r.overall_reference_score} />}
            {r.would_rehire === true && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: "2px 8px",
                  borderRadius: 100,
                  background: "#E8F9EE",
                  color: "#1A7F3C",
                }}
              >
                Would rehire ✓
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>
            {r.relationship}
            {r.company_at_time ? ` · ${r.company_at_time}` : ""}
          </div>
        </div>
        <div {...dh(`${idPrefix}-status`)} style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 12, color: status.color, fontWeight: 600 }}>{status.label}</span>
          {expanded ? <ChevronUp size={16} color="#AEAEB2" /> : <ChevronDown size={16} color="#AEAEB2" />}
        </div>
      </div>

      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F0F0F2", opacity: open }}>
          {enth && (
            <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#AEAEB2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Enthusiasm
              </span>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star key={i} size={13} fill={i <= enth.stars ? "#FF9F0A" : "none"} color={i <= enth.stars ? "#FF9F0A" : "#D2D2D7"} />
                  ))}
                </div>
                <span style={{ fontSize: 12, color: C.secondary, fontWeight: 500 }}>{enth.label}</span>
              </div>
            </div>
          )}

          {r.summary && (
            <div
              style={{
                marginTop: 14,
                padding: "14px 16px",
                background: "#F5F5F7",
                borderRadius: 10,
                fontSize: 14,
                color: "#3D3D42",
                lineHeight: 1.6,
              }}
            >
              {r.summary}
            </div>
          )}

          {(r.strengths?.length || r.red_flags?.length) ? (
            <div style={{ display: "flex", gap: 12, marginTop: 14 }}>
              {r.strengths && r.strengths.length > 0 && (
                <div {...dh(`${idPrefix}-strengths`)} style={{ flex: 1, background: "#E8F9EE", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ ...upper, color: "#1A7F3C", marginBottom: 8 }}>Strengths</div>
                  {r.strengths.map((s) => (
                    <div key={s} style={{ fontSize: 13, color: "#1A7F3C", marginBottom: 3 }}>
                      · {s}
                    </div>
                  ))}
                </div>
              )}
              {r.red_flags && r.red_flags.length > 0 ? (
                <div {...dh(`${idPrefix}-flags`)} style={{ flex: 1, background: "#FEE8E8", borderRadius: 10, padding: "12px 14px" }}>
                  <div style={{ ...upper, color: "#B91C1C", marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
                    <AlertTriangle size={11} /> Red Flags
                  </div>
                  {r.red_flags.map((f) => (
                    <div key={f} style={{ fontSize: 13, color: "#B91C1C", marginBottom: 3 }}>
                      · {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  {...dh(`${idPrefix}-flags`)}
                  style={{
                    flex: 1,
                    background: "#F5F5F7",
                    borderRadius: 10,
                    padding: "12px 14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 13, color: "#AEAEB2" }}>✓ No red flags noted</span>
                </div>
              )}
            </div>
          ) : null}

          {r.notable_quotes && r.notable_quotes.length > 0 && (
            <div {...dh(`${idPrefix}-quotes`)} style={{ marginTop: 14 }}>
              <div style={{ ...upper, color: "#AEAEB2", marginBottom: 8 }}>Notable Quotes</div>
              {r.notable_quotes.map((q) => (
                <div
                  key={q}
                  style={{
                    padding: "10px 14px",
                    borderLeft: "3px solid #0071E3",
                    background: "#F5F5F7",
                    borderRadius: "0 8px 8px 0",
                    fontSize: 14,
                    fontStyle: "italic",
                    color: "#3D3D42",
                    marginBottom: 6,
                    lineHeight: 1.5,
                  }}
                >
                  "{q}"
                </div>
              ))}
            </div>
          )}

          {r.call_status === "completed" && qids.length > 0 && (
            <div {...dh(`${idPrefix}-answers`)} style={{ marginTop: 16 }}>
              <div style={{ ...upper, color: "#AEAEB2", marginBottom: 10 }}>Question Breakdown</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {qids.map((qid) => {
                  const ans = answers[qid];
                  return (
                    <div key={qid} style={{ padding: "12px 14px", background: "#FAFAFA", borderRadius: 10, border: "1px solid #F0F0F2" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: C.secondary }}>{QUESTION_LABELS[qid] ?? qid}</span>
                        <div style={{ minWidth: 120, marginLeft: 12 }}>
                          <ScoreBar score={ans.score} />
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: ans.text ? C.text : "#AEAEB2", lineHeight: 1.5, margin: 0 }}>
                        {ans.text || "The referee did not answer this question."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {r.transcript && (
            <div style={{ marginTop: 14 }}>
              <BtnGhost t={`${idPrefix}-transcript-btn`} style={{ padding: "8px 0", fontSize: 13 }}>
                {showTranscript ? "Hide" : "Show"} full transcript
              </BtnGhost>
              {showTranscript && (
                <div
                  {...dh(`${idPrefix}-transcript`)}
                  style={{
                    marginTop: 8,
                    padding: 14,
                    background: "#F5F5F7",
                    borderRadius: 10,
                    fontFamily: MONO,
                    fontSize: 12,
                    color: "#3D3D42",
                    lineHeight: 1.7,
                    maxHeight: 320,
                    overflow: "hidden",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {r.transcript}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};
