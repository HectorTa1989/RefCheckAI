import Link from "next/link";
import { Candidate, CALL_STATUS_CONFIG } from "@/lib/types";
import ScoreRing from "./ScoreRing";
import RecommendationBadge from "./RecommendationBadge";
import { formatDistanceToNow } from "date-fns";
import { ChevronRight, Phone } from "lucide-react";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  draft:       { label: "Draft",       color: "#AEAEB2" },
  pending:     { label: "Pending",     color: "#FF9F0A" },
  in_progress: { label: "In Progress", color: "#0071E3" },
  complete:    { label: "Complete",    color: "#34C759" },
  cancelled:   { label: "Cancelled",  color: "#FF3B30" },
};

interface Props {
  candidate: Candidate & { references?: { call_status: string }[] };
}

export default function CandidateCard({ candidate }: Props) {
  const s = STATUS_LABEL[candidate.status] ?? STATUS_LABEL.draft;
  const refs = candidate.references ?? [];
  const completedCount = refs.filter((r) => r.call_status === "completed").length;

  return (
    <Link
      href={`/checks/${candidate.id}`}
      style={{ textDecoration: "none", display: "block" }}
    >
      <div
        className="apple-card"
        style={{
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "20px",
          cursor: "pointer",
        }}
      >
        {/* Score ring */}
        <div style={{ flexShrink: 0, position: "relative", width: 72, height: 72 }}>
          {candidate.overall_score != null ? (
            <ScoreRing
              score={candidate.overall_score}
              size={72}
              strokeWidth={6}
              sublabel="/10"
              animate={false}
            />
          ) : (
            <div
              style={{
                width: 72, height: 72,
                borderRadius: "50%",
                background: "#F5F5F7",
                border: "6px solid #E5E5EA",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <Phone size={22} color="#AEAEB2" />
            </div>
          )}
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "3px" }}>
            <span
              style={{
                fontSize: "16px", fontWeight: 700, color: "#1D1D1F",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}
            >
              {candidate.name}
            </span>
            {candidate.recommendation && (
              <RecommendationBadge rec={candidate.recommendation} size="sm" />
            )}
          </div>

          <div style={{ fontSize: "14px", color: "#6E6E73", marginBottom: "8px" }}>
            {candidate.role_applied_for} · {candidate.company_name}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {/* Status dot + label */}
            <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
              <span
                style={{
                  width: 7, height: 7, borderRadius: "50%",
                  background: s.color, display: "inline-block",
                }}
              />
              <span style={{ fontSize: "12px", color: s.color, fontWeight: 600 }}>
                {s.label}
              </span>
            </span>

            {refs.length > 0 && (
              <span style={{ fontSize: "12px", color: "#AEAEB2" }}>
                {completedCount}/{refs.length} refs complete
              </span>
            )}

            <span style={{ fontSize: "12px", color: "#AEAEB2" }}>
              {formatDistanceToNow(new Date(candidate.created_at), { addSuffix: true })}
            </span>
          </div>
        </div>

        <ChevronRight size={18} color="#AEAEB2" style={{ flexShrink: 0 }} />
      </div>
    </Link>
  );
}
