import { RECOMMENDATION_CONFIG, RecommendationType } from "@/lib/types";

interface Props {
  rec: RecommendationType;
  size?: "sm" | "md" | "lg";
}

export default function RecommendationBadge({ rec, size = "md" }: Props) {
  const cfg = RECOMMENDATION_CONFIG[rec];
  const pad   = size === "sm" ? "3px 10px" : size === "lg" ? "7px 18px" : "5px 14px";
  const fs    = size === "sm" ? 11 : size === "lg" ? 15 : 13;
  return (
    <span
      style={{
        display: "inline-flex", alignItems: "center", gap: "5px",
        padding: pad,
        borderRadius: "100px",
        background: cfg.bg,
        color: cfg.color,
        fontSize: `${fs}px`,
        fontWeight: 700,
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
      }}
    >
      {cfg.label}
    </span>
  );
}
