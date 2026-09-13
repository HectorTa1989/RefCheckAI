"use client";
import { useState } from "react";
import { Reference, CALL_STATUS_CONFIG, ENTHUSIASM_CONFIG, QUESTION_LABELS } from "@/lib/types";
import { ScorePill } from "./ScoreRing";
import { ChevronDown, ChevronUp, AlertTriangle, Star } from "lucide-react";

interface Props {
  reference: Reference;
  idx: number;
}

function EnthusiasmStars({ level }: { level: string }) {
  const cfg = ENTHUSIASM_CONFIG[level as keyof typeof ENTHUSIASM_CONFIG];
  if (!cfg) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
      <div style={{ display: "flex", gap: "2px" }}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={13}
            fill={i <= cfg.stars ? "#FF9F0A" : "none"}
            color={i <= cfg.stars ? "#FF9F0A" : "#D2D2D7"}
          />
        ))}
      </div>
      <span style={{ fontSize: "12px", color: "#6E6E73", fontWeight: 500 }}>
        {cfg.label}
      </span>
    </div>
  );
}

function ScoreBar({ score }: { score: number | null }) {
  if (score == null) {
    return (
      <span style={{ fontSize: "12px", fontWeight: 600, color: "#AEAEB2" }}>
        Not answered
      </span>
    );
  }
  const pct = (score / 5) * 100;
  const color = score >= 4 ? "#34C759" : score >= 3 ? "#FF9F0A" : "#FF3B30";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <div
        style={{
          flex: 1, height: "4px", background: "#E5E5EA",
          borderRadius: "100px", overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%", width: `${pct}%`,
            background: color, borderRadius: "100px",
          }}
        />
      </div>
      <span style={{ fontSize: "12px", fontWeight: 600, color, minWidth: "28px" }}>
        {score}/5
      </span>
    </div>
  );
}

export default function ReferencePanel({ reference: ref, idx }: Props) {
  const [expanded, setExpanded] = useState(idx === 0);
  const [showTranscript, setShowTranscript] = useState(false);

  const statusCfg = CALL_STATUS_CONFIG[ref.call_status];
  const hasResults = ref.call_status === "completed" && ref.answers;
  const answers = ref.answers ?? {};
  const answerKeys = Object.keys(answers);

  return (
    <div
      className="apple-card"
      style={{ overflow: "hidden", marginBottom: "12px" }}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded((v) => !v)}
        style={{
          width: "100%", display: "flex", alignItems: "center", gap: "16px",
          padding: "18px 20px", background: "transparent", border: "none",
          cursor: "pointer", textAlign: "left",
        }}
      >
        {/* Status dot */}
        <div style={{ flexShrink: 0 }}>
          <span
            style={{
              display: "inline-block",
              width: 10, height: 10, borderRadius: "50%",
              background: statusCfg.color,
              boxShadow: `0 0 0 3px ${statusCfg.color}22`,
            }}
          />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "15px", fontWeight: 700, color: "#1D1D1F" }}>
              {ref.referee_name}
            </span>
            {ref.overall_reference_score != null && (
              <ScorePill score={ref.overall_reference_score} />
            )}
            {ref.would_rehire === true && (
              <span style={{
                fontSize: "11px", fontWeight: 700, padding: "2px 8px",
                borderRadius: "100px", background: "#E8F9EE", color: "#1A7F3C",
              }}>
                Would rehire ✓
              </span>
            )}
            {ref.would_rehire === false && (
              <span style={{
                fontSize: "11px", fontWeight: 700, padding: "2px 8px",
                borderRadius: "100px", background: "#FEE8E8", color: "#B91C1C",
              }}>
                Would not rehire
              </span>
            )}
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E73", marginTop: "2px" }}>
            {ref.relationship}
            {ref.company_at_time ? ` · ${ref.company_at_time}` : ""}
          </div>
        </div>

        <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "12px", color: statusCfg.color, fontWeight: 600 }}>
            {statusCfg.label}
          </span>
          {expanded ? <ChevronUp size={16} color="#AEAEB2" /> : <ChevronDown size={16} color="#AEAEB2" />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: "0 20px 20px", borderTop: "1px solid #F0F0F2" }}>
          {/* Enthusiasm */}
          {ref.referee_enthusiasm && (
            <div style={{ marginTop: "14px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "12px", color: "#AEAEB2", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                Enthusiasm
              </span>
              <EnthusiasmStars level={ref.referee_enthusiasm} />
            </div>
          )}

          {/* Summary */}
          {ref.summary && (
            <div style={{
              marginTop: "14px", padding: "14px 16px",
              background: "#F5F5F7", borderRadius: "10px",
              fontSize: "14px", color: "#3D3D42", lineHeight: 1.6,
            }}>
              {ref.summary}
            </div>
          )}

          {/* Strengths + Red flags */}
          {(ref.strengths?.length || ref.red_flags?.length) && (
            <div style={{ display: "flex", gap: "12px", marginTop: "14px" }}>
              {ref.strengths && ref.strengths.length > 0 && (
                <div style={{
                  flex: 1, background: "#E8F9EE", borderRadius: "10px", padding: "12px 14px",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#1A7F3C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                    Strengths
                  </div>
                  {ref.strengths.map((s, i) => (
                    <div key={i} style={{ fontSize: "13px", color: "#1A7F3C", marginBottom: "3px" }}>
                      · {s}
                    </div>
                  ))}
                </div>
              )}
              {ref.red_flags && ref.red_flags.length > 0 ? (
                <div style={{
                  flex: 1, background: "#FEE8E8", borderRadius: "10px", padding: "12px 14px",
                }}>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#B91C1C", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "4px" }}>
                    <AlertTriangle size={11} /> Red Flags
                  </div>
                  {ref.red_flags.map((f, i) => (
                    <div key={i} style={{ fontSize: "13px", color: "#B91C1C", marginBottom: "3px" }}>
                      · {f}
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{
                  flex: 1, background: "#F5F5F7", borderRadius: "10px", padding: "12px 14px",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <span style={{ fontSize: "13px", color: "#AEAEB2" }}>
                    ✓ No red flags noted
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notable quotes */}
          {ref.notable_quotes && ref.notable_quotes.length > 0 && (
            <div style={{ marginTop: "14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                Notable Quotes
              </div>
              {ref.notable_quotes.map((q, i) => (
                <div key={i} style={{
                  padding: "10px 14px",
                  borderLeft: "3px solid #0071E3",
                  background: "#F5F5F7",
                  borderRadius: "0 8px 8px 0",
                  fontSize: "14px", fontStyle: "italic", color: "#3D3D42",
                  marginBottom: "6px", lineHeight: 1.5,
                }}>
                  "{q}"
                </div>
              ))}
            </div>
          )}

          {/* Q&A breakdown */}
          {hasResults && answerKeys.length > 0 && (
            <div style={{ marginTop: "16px" }}>
              <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                Question Breakdown
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {answerKeys.map((qid) => {
                  const ans = answers[qid];
                  if (!ans) return null;
                  return (
                    <div key={qid} style={{ padding: "12px 14px", background: "#FAFAFA", borderRadius: "10px", border: "1px solid #F0F0F2" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                        <span style={{ fontSize: "12px", fontWeight: 600, color: "#6E6E73" }}>
                          {QUESTION_LABELS[qid] ?? qid}
                        </span>
                        <div style={{ minWidth: "120px", marginLeft: "12px" }}>
                          <ScoreBar score={ans.score} />
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: ans.text ? "#1D1D1F" : "#AEAEB2", lineHeight: 1.5, margin: 0 }}>
                        {ans.text || "The referee did not answer this question."}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Transcript toggle */}
          {ref.transcript && (
            <div style={{ marginTop: "14px" }}>
              <button
                className="btn-ghost"
                onClick={() => setShowTranscript((v) => !v)}
                style={{ padding: "8px 0", fontSize: "13px" }}
              >
                {showTranscript ? "Hide" : "Show"} full transcript
              </button>
              {showTranscript && (
                <div style={{
                  marginTop: "8px", padding: "14px", background: "#F5F5F7",
                  borderRadius: "10px", fontFamily: "monospace",
                  fontSize: "12px", color: "#3D3D42", lineHeight: 1.7,
                  maxHeight: "320px", overflowY: "auto",
                  whiteSpace: "pre-wrap",
                }}>
                  {ref.transcript}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
