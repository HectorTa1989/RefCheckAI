import React from "react";
import { useCurrentFrame } from "remotion";
import {
  ArrowLeft,
  Download,
  Share2,
  RefreshCw,
  Phone,
  ChevronDown,
  AlertTriangle,
  Quote,
  FileText,
  Check,
} from "lucide-react";
import { Stage } from "../ui/Stage";
import {
  Page,
  Card,
  ScoreRing,
  RecBadge,
  BtnPrimary,
  BtnSecondary,
  Spotlight,
  ChangeBox,
} from "../ui/App";
import { Cursor } from "../ui/Cursor";
import { C, MONO } from "../theme";
import { ramp } from "../anim";
import { CANDIDATE, REFERENCES } from "../data";

/* ─────────────── in-progress ─────────────── */

const CALL_ROWS = [
  { name: "James Okafor", rel: "Former direct manager", state: "completed" },
  { name: "Priya Raman", rel: "Cross-functional peer", state: "calling" },
  { name: "Daniel Weiss", rel: "Skip-level manager", state: "queued" },
];

const STATE_CFG: Record<string, { label: string; color: string; bg: string }> = {
  completed: { label: "Completed", color: C.green, bg: C.greenLt },
  calling: { label: "On call now", color: C.blue, bg: C.blueLt },
  queued: { label: "Queued", color: C.secondary, bg: C.fill3 },
};

export const Progress: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Stage url="refcheck.ai/checks/mc-4821">
      <Page active="/dashboard">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: 6, color: C.secondary, fontSize: 15 }}
          >
            <ArrowLeft size={15} /> Back
          </span>
          <BtnSecondary>
            <RefreshCw size={14} /> Refresh
          </BtnSecondary>
        </div>

        {/* status banner */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            padding: "14px 20px",
            borderRadius: 14,
            background: C.blueLt,
            border: `1px solid rgba(0,113,227,0.22)`,
            marginBottom: 20,
          }}
        >
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: C.blue,
              opacity: 0.5 + Math.sin(frame * 0.22) * 0.5,
            }}
          />
          <span style={{ fontSize: 15, fontWeight: 650, color: "#0B4F9E" }}>
            Reference checks in progress — 1 of 3 complete
          </span>
        </div>

        <Card style={{ padding: "26px 30px", marginBottom: 22 }}>
          <div style={{ display: "flex", gap: 26, alignItems: "center" }}>
            <div
              style={{
                width: 100,
                height: 100,
                borderRadius: "50%",
                background: C.fill4,
                border: `8px solid ${C.border2}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Phone size={32} color={C.tertiary} />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}>
                {CANDIDATE.name}
              </h1>
              <div style={{ fontSize: 15, color: C.secondary, marginTop: 3 }}>
                {CANDIDATE.role} · {CANDIDATE.company}
              </div>
            </div>
          </div>
        </Card>

        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>References</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {CALL_ROWS.map((r) => {
            const cfg = STATE_CFG[r.state];
            return (
              <Card
                key={r.name}
                sm
                style={{
                  padding: "16px 20px",
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 15, fontWeight: 700 }}>{r.name}</div>
                  <div style={{ fontSize: 13, color: C.secondary }}>{r.rel}</div>
                </div>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "5px 13px",
                    borderRadius: 999,
                    background: cfg.bg,
                    color: cfg.color,
                    fontSize: 12.5,
                    fontWeight: 700,
                  }}
                >
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: cfg.color,
                      opacity:
                        r.state === "calling" ? 0.4 + Math.sin(frame * 0.3) * 0.6 : 1,
                    }}
                  />
                  {cfg.label}
                </span>
              </Card>
            );
          })}
        </div>
      </Page>
    </Stage>
  );
};

/* ─────────────── completed report ─────────────── */

const Pill: React.FC<{ label: string; value: string; color?: string }> = ({
  label,
  value,
  color,
}) => (
  <div>
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: C.tertiary,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 19, fontWeight: 700, color: color ?? C.text, marginTop: 2 }}>
      {value}
    </div>
  </div>
);

const QuestionBar: React.FC<{ label: string; score: number; t: number }> = ({
  label,
  score,
  t,
}) => {
  const color = score >= 4.5 ? C.green : score >= 3.5 ? C.blue : C.orange;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 9, opacity: t }}>
      <div style={{ width: 172, fontSize: 13.5, color: C.secondary, flexShrink: 0 }}>{label}</div>
      <div style={{ flex: 1, height: 7, background: C.fill3, borderRadius: 4, overflow: "hidden" }}>
        <div
          style={{
            width: `${(score / 5) * 100 * t}%`,
            height: "100%",
            background: color,
            borderRadius: 4,
          }}
        />
      </div>
      <div style={{ width: 26, fontSize: 13, fontWeight: 700, color, textAlign: "right" }}>
        {score}
      </div>
    </div>
  );
};

export const Report: React.FC = () => {
  const frame = useCurrentFrame();
  const ref0 = REFERENCES[0];

  const ringProgress = ramp(frame, 18, 66, 0, 1);
  const expanded = frame >= 326;
  const expandT = ramp(frame, 326, 356, 0, 1);
  const scroll = ramp(frame, 372, 584, 0, 340);

  const spotRehire = ramp(frame, 112, 130, 0, 1) * ramp(frame, 246, 264, 1, 0);
  const spotRec = ramp(frame, 268, 284, 0, 1) * ramp(frame, 306, 320, 1, 0);

  return (
    <Stage url="refcheck.ai/checks/mc-4821">
      <Page active="/dashboard">
        <div style={{ transform: `translateY(${-scroll}px)` }}>
          {/* actions */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                color: C.secondary,
                fontSize: 15,
              }}
            >
              <ArrowLeft size={15} /> Back
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              <BtnSecondary>
                <Share2 size={14} /> Share report
              </BtnSecondary>
              <BtnPrimary>
                <Download size={14} /> Download PDF
              </BtnPrimary>
            </div>
          </div>

          {/* status banner */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 20px",
              borderRadius: 14,
              background: C.greenLt,
              border: `1px solid rgba(52,199,89,0.28)`,
              marginBottom: 18,
            }}
          >
            <Check size={16} color={C.greenDk} strokeWidth={3} />
            <span style={{ fontSize: 15, fontWeight: 650, color: C.greenDk }}>
              All 3 reference calls complete · 29 min 23 s of conversation
            </span>
          </div>

          {/* overview */}
          <Card style={{ padding: "26px 30px", marginBottom: 20 }}>
            <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
              <div style={{ flexShrink: 0 }}>
                <ScoreRing
                  score={CANDIDATE.overall_score}
                  size={100}
                  strokeWidth={8}
                  sublabel="/10"
                  progress={ringProgress}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}
                >
                  <h1
                    style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: "-0.3px" }}
                  >
                    {CANDIDATE.name}
                  </h1>
                  <RecBadge rec={CANDIDATE.recommendation} size="md" />
                </div>
                <div style={{ fontSize: 15, color: C.secondary, marginBottom: 18 }}>
                  {CANDIDATE.role} · {CANDIDATE.company}
                </div>
                <div style={{ display: "flex", gap: 44 }}>
                  <Pill label="Refs checked" value="3 / 3" />
                  <Pill label="Would rehire" value="3 / 3" color={C.green} />
                  <Pill label="Red flags" value="1" color={C.orange} />
                  <Pill label="Completed" value="today" />
                </div>
              </div>
            </div>
          </Card>

          <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 12 }}>References</h2>

          {/* reference 1 — expands */}
          <Card style={{ marginBottom: 10, overflow: "hidden" }}>
            <div
              style={{
                padding: "16px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <ScoreRing score={ref0.score} size={54} strokeWidth={5} />
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 15, fontWeight: 700 }}>{ref0.referee_name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      padding: "2px 9px",
                      borderRadius: 100,
                      background: C.greenLt,
                      color: C.greenDk,
                    }}
                  >
                    WOULD REHIRE
                  </span>
                </div>
                <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>
                  {ref0.relationship} · {ref0.company_at_time} · {ref0.duration}
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 13, color: C.secondary }}>Very enthusiastic</span>
                <span style={{ fontSize: 13, letterSpacing: 1 }}>★★★★★</span>
                <ChevronDown
                  size={17}
                  color={C.tertiary}
                  style={{ transform: `rotate(${expandT * 180}deg)` }}
                />
              </div>
            </div>

            {expanded && (
              <div
                style={{
                  borderTop: `1px solid ${C.border2}`,
                  padding: "18px 22px",
                  opacity: expandT,
                }}
              >
                <div style={{ display: "flex", gap: 18, marginBottom: 18 }}>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.greenDk,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 8,
                      }}
                    >
                      Strengths
                    </div>
                    {ref0.strengths.map((s, i) => (
                      <div
                        key={s}
                        style={{
                          fontSize: 14,
                          color: C.text,
                          marginBottom: 6,
                          paddingLeft: 16,
                          position: "relative",
                          opacity: ramp(frame, 340 + i * 7, 356 + i * 7, 0, 1),
                        }}
                      >
                        <span style={{ position: "absolute", left: 0, color: C.green }}>✓</span>
                        {s}
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.redDk,
                        textTransform: "uppercase",
                        letterSpacing: "0.06em",
                        marginBottom: 8,
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                      }}
                    >
                      <AlertTriangle size={12} /> Red flags
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: C.secondary,
                        opacity: ramp(frame, 348, 364, 0, 1),
                      }}
                    >
                      None raised on this call.
                    </div>
                  </div>
                </div>

                {/* quote */}
                <div
                  style={{
                    background: C.fill4,
                    borderLeft: `3px solid ${C.blue}`,
                    borderRadius: 10,
                    padding: "13px 16px",
                    marginBottom: 18,
                    opacity: ramp(frame, 366, 386, 0, 1),
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.tertiary,
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      marginBottom: 6,
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                    }}
                  >
                    <Quote size={12} /> Notable quote
                  </div>
                  <div style={{ fontSize: 15.5, color: C.text, fontStyle: "italic", lineHeight: 1.45 }}>
                    “{ref0.quote}”
                  </div>
                </div>

                {/* per-question scores */}
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.tertiary,
                    textTransform: "uppercase",
                    letterSpacing: "0.06em",
                    marginBottom: 10,
                  }}
                >
                  Per-question scores
                </div>
                {ref0.answers.map(([label, score], i) => (
                  <QuestionBar
                    key={label}
                    label={label}
                    score={score}
                    t={ramp(frame, 392 + i * 6, 408 + i * 6, 0, 1)}
                  />
                ))}

                {/* transcript */}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 14,
                    borderTop: `1px solid ${C.border2}`,
                    opacity: ramp(frame, 452, 474, 0, 1),
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 7,
                      color: C.blue,
                      fontSize: 14,
                      fontWeight: 600,
                      marginBottom: 10,
                    }}
                  >
                    <FileText size={14} /> Show full transcript
                  </div>
                  <div
                    style={{
                      background: "#FAFAFB",
                      border: `1px solid ${C.border2}`,
                      borderRadius: 10,
                      padding: "12px 14px",
                      fontFamily: MONO,
                      fontSize: 12.5,
                      color: C.secondary,
                      lineHeight: 1.7,
                    }}
                  >
                    <div>
                      <b style={{ color: C.blue }}>agent:</b> Would you hire Maria again if you had
                      the opportunity?
                    </div>
                    <div>
                      <b style={{ color: C.text }}>james:</b> Absolutely. If I were starting a team
                      tomorrow, she’s the first call I make.
                    </div>
                    <div>
                      <b style={{ color: C.blue }}>agent:</b> That’s a strong endorsement — can you
                      tell me more about what earns it?
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>

          {/* references 2 & 3 collapsed */}
          {REFERENCES.slice(1).map((r) => (
            <Card
              key={r.referee_name}
              style={{
                marginBottom: 10,
                padding: "16px 22px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}
            >
              <ScoreRing score={r.score} size={54} strokeWidth={5} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>{r.referee_name}</div>
                <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>
                  {r.relationship} · {r.company_at_time} · {r.duration}
                </div>
              </div>
              <ChevronDown size={17} color={C.tertiary} />
            </Card>
          ))}
        </div>
      </Page>

      {/* clicking the reference row at f326 opens it. The page starts scrolling
          at f372, so this releases before then rather than drifting off target. */}
      <ChangeBox frame={frame} at={330} x={306} y={388} w={856} h={90} tone="blue"
                 hold={26} label="Reference expanded" />

      {/* callouts */}
      <Spotlight x={628} y={236} w={124} h={54} opacity={spotRehire} radius={10} />
      <div
        style={{
          position: "absolute",
          left: 610,
          top: 300,
          background: "#14161A",
          color: "#fff",
          padding: "9px 15px",
          borderRadius: 11,
          fontSize: 13.5,
          fontWeight: 600,
          opacity: spotRehire,
          transform: `translateY(${(1 - spotRehire) * 8}px)`,
          boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
          zIndex: 600,
          whiteSpace: "nowrap",
        }}
      >
        “Would rehire” carries <span style={{ color: "#7EE787" }}>2× weight</span> in the score
      </div>
      <Spotlight x={556} y={218} w={112} h={30} opacity={spotRec} radius={999} />

      <Cursor
        moves={[
          { at: 0, x: 760, y: 640 },
          { at: 96, x: 690, y: 262 },
          { at: 266, x: 606, y: 232 },
          { at: 300, x: 620, y: 400 },
        ]}
        clicks={[326]}
      />
    </Stage>
  );
};

/* ─────────────── PDF export ─────────────── */

export const Export: React.FC = () => {
  const frame = useCurrentFrame();
  const sheet = ramp(frame, 76, 108, 0, 1);

  return (
    <Stage url="refcheck.ai/checks/mc-4821">
      <Page active="/dashboard">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 18,
          }}
        >
          <span
            style={{ display: "flex", alignItems: "center", gap: 6, color: C.secondary, fontSize: 15 }}
          >
            <ArrowLeft size={15} /> Back
          </span>
          <div style={{ display: "flex", gap: 10 }}>
            <BtnSecondary>
              <Share2 size={14} /> Share report
            </BtnSecondary>
            <BtnPrimary hover={frame >= 44 && frame < 80}>
              <Download size={14} /> Download PDF
            </BtnPrimary>
          </div>
        </div>

        <Card style={{ padding: "26px 30px" }}>
          <div style={{ display: "flex", gap: 26, alignItems: "flex-start" }}>
            <ScoreRing score={CANDIDATE.overall_score} size={100} strokeWidth={8} sublabel="/10" />
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0 }}>{CANDIDATE.name}</h1>
                <RecBadge rec={CANDIDATE.recommendation} size="md" />
              </div>
              <div style={{ fontSize: 15, color: C.secondary }}>
                {CANDIDATE.role} · {CANDIDATE.company}
              </div>
            </div>
          </div>
        </Card>
      </Page>

      {/* clicking Download PDF at f74 produces the report sheet */}
      <ChangeBox frame={frame} at={104} x={424} y={124} w={482} h={652} tone="green"
                 hold={60} radius={12} label="PDF generated" />

      {/* dim behind the preview sheet */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.20)",
          opacity: sheet,
          zIndex: 690,
        }}
      />

      {/* PDF sheet sliding up */}
      <div
        style={{
          position: "absolute",
          left: 430,
          top: 130,
          width: 470,
          height: 640,
          background: "#fff",
          borderRadius: 10,
          boxShadow: "0 30px 80px rgba(0,0,0,0.32)",
          transform: `translateY(${(1 - sheet) * 90}px)`,
          opacity: sheet,
          padding: "34px 38px",
          boxSizing: "border-box",
          zIndex: 700,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 19, fontWeight: 800, letterSpacing: "-0.3px" }}>
            Reference Report
          </div>
          <div style={{ fontSize: 11, color: C.tertiary, fontWeight: 700 }}>REFCHECK AI</div>
        </div>
        <div style={{ height: 2, background: C.blue, width: 44, margin: "10px 0 20px" }} />

        <div style={{ display: "flex", gap: 18, alignItems: "center", marginBottom: 22 }}>
          <ScoreRing score={8.7} size={74} strokeWidth={7} sublabel="/10" />
          <div>
            <div style={{ fontSize: 17, fontWeight: 700 }}>Maria Chen</div>
            <div style={{ fontSize: 13, color: C.secondary, marginBottom: 6 }}>
              Senior Software Engineer
            </div>
            <RecBadge rec="strong_yes" size="sm" />
          </div>
        </div>

        {REFERENCES.map((r) => (
          <div
            key={r.referee_name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "9px 0",
              borderTop: `1px solid ${C.border2}`,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{r.referee_name}</div>
              <div style={{ fontSize: 11.5, color: C.secondary }}>{r.relationship}</div>
            </div>
            <div style={{ fontSize: 14, fontWeight: 800, color: C.green }}>{r.score}</div>
          </div>
        ))}

        <div
          style={{
            marginTop: 16,
            paddingTop: 14,
            borderTop: `1px solid ${C.border2}`,
            fontSize: 11.5,
            color: C.secondary,
            lineHeight: 1.6,
          }}
        >
          <b style={{ color: C.text }}>Summary.</b> Three independent references, all recommending
          rehire. Consistent themes: ownership of the payments migration, calm incident handling,
          honest estimates. One growth note on scope discipline under tight timelines.
        </div>

        <div
          style={{
            position: "absolute",
            left: 38,
            right: 38,
            bottom: 24,
            fontSize: 10,
            color: C.tertiary,
            borderTop: `1px solid ${C.border2}`,
            paddingTop: 10,
          }}
        >
          Generated by RefCheck AI · calls placed via CALL-E · candidate consent on file
        </div>
      </div>

      <Cursor
        moves={[
          { at: 0, x: 620, y: 400 },
          { at: 26, x: 1092, y: 52 },
        ]}
        clicks={[74]}
      />
    </Stage>
  );
};
