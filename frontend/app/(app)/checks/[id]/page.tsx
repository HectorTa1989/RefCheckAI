"use client";
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { CandidateWithRefs } from "@/lib/types";
import ScoreRing from "@/components/ScoreRing";
import RecommendationBadge from "@/components/RecommendationBadge";
import ReferencePanel from "@/components/ReferencePanel";
import toast from "react-hot-toast";
import { Download, Share2, ArrowLeft, RefreshCw, Phone } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";

const POLL_INTERVAL = 15_000; // 15 s

function StatusBanner({ status }: { status: string }) {
  if (status === "in_progress") {
    return (
      <div style={{
        padding: "12px 18px",
        background: "#E8F2FD",
        borderRadius: "12px",
        marginBottom: "20px",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <div className="spinner" style={{ width: 16, height: 16 }} />
        <span style={{ fontSize: "14px", color: "#0071E3", fontWeight: 500 }}>
          Calls in progress — this page auto-refreshes every 15 seconds.
        </span>
      </div>
    );
  }
  if (status === "complete") {
    return (
      <div style={{
        padding: "12px 18px",
        background: "#E8F9EE",
        borderRadius: "12px",
        marginBottom: "20px",
        display: "flex", alignItems: "center", gap: "10px",
      }}>
        <span style={{ fontSize: "18px" }}>✅</span>
        <span style={{ fontSize: "14px", color: "#1A7F3C", fontWeight: 500 }}>
          All reference checks complete. Report ready.
        </span>
      </div>
    );
  }
  return null;
}

export default function CheckDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData]     = useState<CandidateWithRefs | null>(null);
  const [uid, setUid]       = useState("");
  const [loading, setLoading] = useState(true);
  const [sharing, setSharing] = useState(false);

  const fetchData = useCallback(async (userId: string) => {
    try {
      const res = await api.candidates.get(userId, id);
      setData(res);
    } catch {
      toast.error("Failed to load check");
    }
  }, [id]);

  // Ask the backend to pull finished calls from CALL-E, then re-read. With a
  // public backend the webhook usually got there first; locally this is how
  // results arrive at all.
  const refresh = useCallback(async (userId: string) => {
    await api.candidates.sync(userId, id).catch(() => undefined);
    await fetchData(userId);
  }, [id, fetchData]);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data: authData }) => {
      const userId = authData.user?.id ?? "";
      setUid(userId);
      if (userId) await fetchData(userId);
      setLoading(false);
    });
  }, [fetchData]);

  // Poll while in-progress
  useEffect(() => {
    if (!uid || !data || data.status !== "in_progress") return;
    const id_ = setInterval(() => refresh(uid), POLL_INTERVAL);
    return () => clearInterval(id_);
  }, [uid, data, refresh]);

  async function handleShare() {
    if (!uid) return;
    setSharing(true);
    try {
      const res = await api.candidates.toggleShare(uid, id);
      if (res.share_enabled && res.share_url) {
        await navigator.clipboard.writeText(res.share_url);
        toast.success("Share link copied to clipboard!");
      } else {
        toast("Sharing disabled");
      }
      await fetchData(uid);
    } catch {
      toast.error("Failed to toggle sharing");
    }
    setSharing(false);
  }

  function handleDownloadPdf() {
    window.open(api.reports.pdfUrl(id, uid), "_blank");
  }

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: "40px 48px" }}>
        <p style={{ color: "#FF3B30" }}>Check not found.</p>
        <Link href="/dashboard" className="btn-ghost" style={{ marginTop: "12px" }}>
          ← Dashboard
        </Link>
      </div>
    );
  }

  const isComplete  = data.status === "complete";
  const inProgress  = data.status === "in_progress";
  const completedRefs = data.references.filter((r) => r.call_status === "completed").length;

  return (
    <div className="page-enter" style={{ padding: "40px 48px", maxWidth: "900px" }}>
      {/* Back + actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <Link href="/dashboard" className="btn-ghost" style={{ padding: "8px 0", color: "#6E6E73" }}>
          <ArrowLeft size={15} /> Back
        </Link>
        <div style={{ display: "flex", gap: "10px" }}>
          {inProgress && (
            <button className="btn-secondary" onClick={() => refresh(uid)}>
              <RefreshCw size={14} /> Refresh
            </button>
          )}
          {isComplete && (
            <>
              <button className="btn-secondary" onClick={handleShare} disabled={sharing}>
                <Share2 size={14} />
                {data.share_enabled ? "Disable share" : "Share report"}
              </button>
              <button className="btn-primary" onClick={handleDownloadPdf}>
                <Download size={14} /> Download PDF
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status banner */}
      <StatusBanner status={data.status} />

      {/* Candidate overview card */}
      <div className="apple-card" style={{ padding: "28px 32px", marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "28px", alignItems: "flex-start" }}>
          {/* Score ring */}
          <div style={{ flexShrink: 0, position: "relative", width: 100, height: 100 }}>
            {isComplete && data.overall_score != null ? (
              <ScoreRing score={data.overall_score} size={100} strokeWidth={8} sublabel="/10" />
            ) : (
              <div style={{
                width: 100, height: 100, borderRadius: "50%",
                background: "#F5F5F7", border: "8px solid #E5E5EA",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Phone size={32} color="#AEAEB2" />
              </div>
            )}
          </div>

          {/* Meta */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap", marginBottom: "4px" }}>
              <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#1D1D1F", letterSpacing: "-0.3px", margin: 0 }}>
                {data.name}
              </h1>
              {isComplete && data.recommendation && (
                <RecommendationBadge rec={data.recommendation} size="md" />
              )}
            </div>
            <div style={{ fontSize: "15px", color: "#6E6E73", marginBottom: "16px" }}>
              {data.role_applied_for} · {data.company_name}
            </div>

            {/* Progress chips */}
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              {data.references.map((ref) => {
                const colors: Record<string, string> = {
                  queued: "#AEAEB2", calling: "#0071E3",
                  completed: "#34C759", failed: "#FF3B30",
                  no_answer: "#FF9F0A", declined: "#6E6E73",
                };
                const color = colors[ref.call_status] ?? "#AEAEB2";
                return (
                  <div key={ref.id} style={{
                    display: "flex", alignItems: "center", gap: "5px",
                    padding: "4px 12px", borderRadius: "100px",
                    background: `${color}18`, border: `1px solid ${color}30`,
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
                    <span style={{ fontSize: "12px", fontWeight: 600, color }}>
                      {ref.referee_name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right column — quick stats */}
          {isComplete && (
            <div style={{
              flexShrink: 0, display: "flex", flexDirection: "column", gap: "10px",
              padding: "0 0 0 24px", borderLeft: "1px solid #E5E5EA",
              minWidth: "140px",
            }}>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>Refs checked</div>
                <div style={{ fontSize: "20px", fontWeight: 700, color: "#1D1D1F" }}>
                  {completedRefs}/{data.references.length}
                </div>
              </div>
              <div>
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>Would rehire</div>
                <div style={{ fontSize: "14px", fontWeight: 700 }}>
                  {data.references.filter((r) => r.would_rehire === true).length}/
                  {data.references.filter((r) => r.would_rehire != null).length}
                  <span style={{ fontSize: "12px", color: "#AEAEB2", fontWeight: 400 }}> said yes</span>
                </div>
              </div>
              {data.completed_at && (
                <div>
                  <div style={{ fontSize: "11px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em" }}>Completed</div>
                  <div style={{ fontSize: "12px", color: "#6E6E73" }}>
                    {formatDistanceToNow(new Date(data.completed_at), { addSuffix: true })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Individual reference panels */}
      <h2 style={{ fontSize: "17px", fontWeight: 700, color: "#1D1D1F", marginBottom: "14px" }}>
        Reference details
      </h2>
      {data.references.length === 0 ? (
        <div style={{ color: "#AEAEB2", padding: "20px 0" }}>No references added yet.</div>
      ) : (
        data.references.map((ref, i) => (
          <ReferencePanel key={ref.id} reference={ref} idx={i} />
        ))
      )}
    </div>
  );
}
