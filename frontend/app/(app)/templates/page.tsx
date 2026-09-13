"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { QuestionTemplate } from "@/lib/types";
import { resolveAccess } from "@/lib/polar";
import toast from "react-hot-toast";
import { Plus, Trash2, Lock, ChevronDown, ChevronUp } from "lucide-react";

export default function TemplatesPage() {
  const [uid, setUid]           = useState("");
  const [email, setEmail]       = useState("");
  const [templates, setTemplates] = useState<QuestionTemplate[]>([]);
  const [loading, setLoading]   = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [access, setAccess]     = useState(resolveAccess(null));

  // New template form
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName]   = useState("");
  const [newDesc, setNewDesc]   = useState("");
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(async ({ data }) => {
      const userId = data.user?.id ?? "";
      const userEmail = data.user?.email ?? "";
      setUid(userId);
      setEmail(userEmail);

      // Resolve plan from DB profile
      const profile = await sb.from("profiles").select("plan").eq("id", userId).single();
      const plan = profile.data?.plan ?? "free";
      setAccess(resolveAccess(userEmail, plan));

      if (userId) {
        const list = await api.templates.list(userId);
        setTemplates(list);
      }
      setLoading(false);
    });
  }, []);

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const t = await api.templates.create(uid, {
        name: newName,
        description: newDesc,
        questions: [],
      });
      setTemplates((prev) => [...prev, t]);
      setNewName(""); setNewDesc(""); setShowForm(false);
      toast.success("Template created");
    } catch {
      toast.error("Failed to create template");
    }
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template?")) return;
    await api.templates.delete(uid, id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    toast.success("Template deleted");
  }

  const system = templates.filter((t) => t.is_system);
  const custom  = templates.filter((t) => !t.is_system);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  return (
    <div className="page-enter" style={{ padding: "40px 48px", maxWidth: "800px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.3px", margin: 0 }}>
            Question Templates
          </h1>
          <p style={{ fontSize: "15px", color: "#6E6E73", margin: "4px 0 0" }}>
            Manage the question sets CALL-E uses during reference calls.
          </p>
        </div>
        {access.canCustomTemplates ? (
          <button className="btn-primary" onClick={() => setShowForm((v) => !v)}>
            <Plus size={15} /> New template
          </button>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: "8px",
            padding: "10px 18px", borderRadius: "980px",
            background: "#F5F5F7", color: "#6E6E73", fontSize: "14px", fontWeight: 600 }}>
            <Lock size={14} /> Pro feature
          </div>
        )}
      </div>

      {/* New template form */}
      {showForm && access.canCustomTemplates && (
        <div className="apple-card" style={{ padding: "22px", marginBottom: "24px" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 16px" }}>
            New custom template
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <label className="label">Template name *</label>
              <input className="apple-input" placeholder="e.g. Executive Hire" value={newName}
                onChange={(e) => setNewName(e.target.value)} />
            </div>
            <div>
              <label className="label">Description</label>
              <input className="apple-input" placeholder="Optional description" value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)} />
            </div>
            <p style={{ fontSize: "13px", color: "#AEAEB2", margin: 0 }}>
              After creating, you can edit the template questions in the Supabase console or via API.
            </p>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-primary" onClick={handleCreate} disabled={saving || !newName.trim()}>
                {saving ? "Creating…" : "Create template"}
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* System templates */}
      <div style={{ marginBottom: "28px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>
          System templates
        </h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {system.map((t) => (
            <div key={t.id} className="apple-card-sm" style={{ overflow: "hidden" }}>
              <button
                onClick={() => setExpanded((v) => (v === t.id ? null : t.id))}
                style={{
                  width: "100%", display: "flex", alignItems: "center",
                  padding: "16px 20px", background: "transparent",
                  border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "15px", fontWeight: 700, color: "#1D1D1F" }}>{t.name}</span>
                    {t.is_default && (
                      <span style={{ fontSize: "11px", fontWeight: 700, color: "#0071E3",
                        background: "#E8F2FD", padding: "2px 8px", borderRadius: "100px" }}>
                        Default
                      </span>
                    )}
                  </div>
                  {t.description && (
                    <div style={{ fontSize: "13px", color: "#6E6E73", marginTop: "2px" }}>
                      {t.description}
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "12px", color: "#AEAEB2" }}>{t.questions.length} questions</span>
                  {expanded === t.id
                    ? <ChevronUp size={16} color="#AEAEB2" />
                    : <ChevronDown size={16} color="#AEAEB2" />}
                </div>
              </button>

              {expanded === t.id && (
                <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F0F0F2" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "14px" }}>
                    {t.questions.map((q, i) => (
                      <div key={q.id} style={{
                        padding: "10px 14px", background: "#F5F5F7",
                        borderRadius: "8px", fontSize: "13px", color: "#3D3D42",
                        lineHeight: 1.5,
                      }}>
                        <span style={{ fontWeight: 700, color: "#AEAEB2", marginRight: "8px" }}>
                          Q{i + 1}
                        </span>
                        {q.text}
                        {q.follow_up && (
                          <div style={{ fontSize: "12px", color: "#AEAEB2", marginTop: "4px", fontStyle: "italic" }}>
                            Follow-up: {q.follow_up}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Custom templates */}
      {custom.length > 0 && (
        <div>
          <h2 style={{ fontSize: "16px", fontWeight: 700, color: "#1D1D1F", margin: "0 0 12px" }}>
            Your templates
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {custom.map((t) => (
              <div key={t.id} className="apple-card-sm" style={{
                padding: "16px 20px", display: "flex", alignItems: "center",
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "15px", fontWeight: 700, color: "#1D1D1F" }}>{t.name}</div>
                  {t.description && (
                    <div style={{ fontSize: "13px", color: "#6E6E73" }}>{t.description}</div>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ fontSize: "12px", color: "#AEAEB2" }}>{t.questions.length} questions</span>
                  <button
                    onClick={() => handleDelete(t.id)}
                    style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: "4px" }}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upgrade prompt for free users */}
      {!access.canCustomTemplates && (
        <div className="apple-card" style={{ padding: "28px 32px", marginTop: "24px", textAlign: "center" }}>
          <Lock size={28} color="#AEAEB2" style={{ marginBottom: "10px" }} />
          <h3 style={{ fontSize: "17px", fontWeight: 700, margin: "0 0 6px" }}>
            Custom templates are a Pro feature
          </h3>
          <p style={{ fontSize: "14px", color: "#6E6E73", margin: "0 0 16px" }}>
            Upgrade to Pro to create and manage custom question sets for any role.
          </p>
          <a
            href={`https://polar.sh/refcheck/refcheck-pro?email=${encodeURIComponent(email)}`}
            target="_blank"
            rel="noreferrer"
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            Upgrade to Pro — $29/mo
          </a>
        </div>
      )}
    </div>
  );
}
