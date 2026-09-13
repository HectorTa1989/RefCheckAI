"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { Candidate } from "@/lib/types";
import CandidateCard from "@/components/CandidateCard";
import Link from "next/link";
import { Plus, Phone, CheckCircle, Clock, TrendingUp } from "lucide-react";

function StatCard({ label, value, icon: Icon, color }: {
  label: string; value: string | number; icon: React.ElementType; color: string;
}) {
  return (
    <div className="apple-card-sm" style={{ padding: "18px 20px", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: "26px", fontWeight: 800, color: "#1D1D1F", letterSpacing: "-0.5px" }}>
            {value}
          </div>
          <div style={{ fontSize: "13px", color: "#6E6E73", marginTop: "2px" }}>{label}</div>
        </div>
        <div style={{
          width: 36, height: 36, borderRadius: "10px",
          background: `${color}18`,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon size={18} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [uid, setUid] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "in_progress" | "complete">("all");

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id ?? "";
      setUid(userId);
      if (userId) {
        const list = await api.candidates.list(userId);
        setCandidates(list);
      }
      setLoading(false);
    });
  }, []);

  const active    = candidates.filter((c) => c.status === "in_progress");
  const complete  = candidates.filter((c) => c.status === "complete");
  const avgScore  = complete.length
    ? (complete.reduce((s, c) => s + (c.overall_score ?? 0), 0) / complete.length).toFixed(1)
    : "—";

  const filtered = filter === "all"
    ? candidates
    : candidates.filter((c) => c.status === filter);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: "40px 48px", maxWidth: "900px" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.3px", margin: 0 }}>
            Dashboard
          </h1>
          <p style={{ fontSize: "15px", color: "#6E6E73", margin: "4px 0 0" }}>
            {candidates.length === 0
              ? "No reference checks yet — start one below"
              : `${candidates.length} candidate${candidates.length !== 1 ? "s" : ""} tracked`}
          </p>
        </div>
        <Link href="/checks/new" className="btn-primary">
          <Plus size={16} />
          New Check
        </Link>
      </div>

      {/* Stats row */}
      <div style={{ display: "flex", gap: "12px", marginBottom: "32px" }}>
        <StatCard label="Total candidates"  value={candidates.length}  icon={Phone}        color="#0071E3" />
        <StatCard label="In progress"       value={active.length}      icon={Clock}        color="#FF9F0A" />
        <StatCard label="Completed"         value={complete.length}    icon={CheckCircle}  color="#34C759" />
        <StatCard label="Avg score"         value={avgScore}           icon={TrendingUp}   color="#AF52DE" />
      </div>

      {/* Filter tabs */}
      {candidates.length > 0 && (
        <div className="tab-bar" style={{ marginBottom: "20px", width: "fit-content" }}>
          {([["all", "All"], ["in_progress", "In Progress"], ["complete", "Complete"]] as const).map(
            ([val, label]) => (
              <button
                key={val}
                className={`tab-item ${filter === val ? "active" : ""}`}
                onClick={() => setFilter(val)}
              >
                {label}
              </button>
            )
          )}
        </div>
      )}

      {/* Candidate list */}
      {candidates.length === 0 ? (
        <div
          className="apple-card"
          style={{
            padding: "64px 40px", textAlign: "center",
            display: "flex", flexDirection: "column", alignItems: "center", gap: "16px",
          }}
        >
          <div style={{
            width: 64, height: 64, borderRadius: "18px",
            background: "linear-gradient(135deg, #0071E3, #0056B0)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Phone size={30} color="#fff" />
          </div>
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
              No reference checks yet
            </h2>
            <p style={{ fontSize: "15px", color: "#6E6E73", margin: 0 }}>
              Add your first candidate and RefCheck AI will handle the calls.
            </p>
          </div>
          <Link href="/checks/new" className="btn-primary" style={{ marginTop: "4px" }}>
            <Plus size={16} />
            Start first check
          </Link>
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "48px", color: "#AEAEB2" }}>
          No candidates in this category
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {filtered.map((c) => (
            <CandidateCard key={c.id} candidate={c} />
          ))}
        </div>
      )}
    </div>
  );
}
