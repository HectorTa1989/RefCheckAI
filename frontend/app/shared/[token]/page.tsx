"use client";
import { useEffect, useState } from "react";
import { use } from "react";
import { Phone, Download, Lock } from "lucide-react";
import ScoreRing from "@/components/ScoreRing";
import RecommendationBadge from "@/components/RecommendationBadge";
import ReferencePanel from "@/components/ReferencePanel";
import { api } from "@/lib/api";
import { SharedReport } from "@/lib/types";

export default function SharedReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [data, setData] = useState<SharedReport | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.shared
      .get(token)
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          gap: "14px",
          padding: "24px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "16px",
            background: "#F5F5F7",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Lock size={24} color="#AEAEB2" />
        </div>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>
          This report is not available
        </h1>
        <p style={{ fontSize: "15px", color: "#6E6E73", margin: 0, maxWidth: "380px" }}>
          The link may have expired, or the recruiter may have turned sharing off.
        </p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F5F5F7" }}>
      {/* Public header — no sidebar, no account controls */}
      <header
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid #D2D2D7",
          padding: "14px 0",
          position: "sticky",
          top: 0,
          zIndex: 10,
        }}
      >
        <div
          style={{
            maxWidth: "900px",
            margin: "0 auto",
            padding: "0 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "28px",
                height: "28px",
                background: "linear-gradient(135deg, #0071E3, #0056B0)",
                borderRadius: "7px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Phone size={14} color="#fff" />
            </div>
            <span style={{ fontSize: "15px", fontWeight: 700 }}>RefCheck AI</span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: 700,
                color: "#6E6E73",
                background: "#EBEBED",
                padding: "3px 9px",
                borderRadius: "100px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Shared report
            </span>
          </div>
          <a
            className="btn-secondary"
            href={api.shared.pdfUrl(token)}
            target="_blank"
            rel="noreferrer"
          >
            <Download size={14} /> Download PDF
          </a>
        </div>
      </header>

      <div className="page-enter" style={{ maxWidth: "900px", margin: "0 auto", padding: "32px 24px 64px" }}>
        {/* Overview */}
        <div className="apple-card" style={{ padding: "28px 32px", marginBottom: "24px" }}>
          <div style={{ display: "flex", gap: "28px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ flexShrink: 0, width: 100, height: 100 }}>
              {data.overall_score != null ? (
                <ScoreRing score={data.overall_score} size={100} strokeWidth={8} sublabel="/10" />
              ) : (
                <div
                  style={{
                    width: 100,
                    height: 100,
                    borderRadius: "50%",
                    background: "#F5F5F7",
                    border: "8px solid #E5E5EA",
                  }}
                />
              )}
            </div>
            <div style={{ flex: 1, minWidth: "240px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: 800, letterSpacing: "-0.3px", margin: 0 }}>
                  {data.name}
                </h1>
                {data.recommendation && <RecommendationBadge rec={data.recommendation} size="md" />}
              </div>
              <div style={{ fontSize: "15px", color: "#6E6E73", marginBottom: "16px" }}>
                {data.role_applied_for} · {data.company_name}
              </div>
              <div style={{ display: "flex", gap: "36px", flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Refs checked
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>
                    {data.references.filter((r) => r.call_status === "completed").length}/
                    {data.references.length}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                    Would rehire
                  </div>
                  <div style={{ fontSize: "20px", fontWeight: 700 }}>
                    {data.references.filter((r) => r.would_rehire === true).length}/
                    {data.references.filter((r) => r.would_rehire != null).length}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 style={{ fontSize: "17px", fontWeight: 700, marginBottom: "14px" }}>References</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {data.references.map((r, i) => (
            <ReferencePanel key={r.id} reference={r} idx={i} />
          ))}
        </div>

        <p
          style={{
            fontSize: "12px",
            color: "#AEAEB2",
            textAlign: "center",
            marginTop: "36px",
            lineHeight: 1.6,
          }}
        >
          Generated by RefCheck AI · calls placed via CALL-E · candidate consent on file.
          <br />
          Referee contact details are not included in shared reports.
        </p>
      </div>
    </div>
  );
}
