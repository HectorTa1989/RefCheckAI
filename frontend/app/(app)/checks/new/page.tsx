"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase";
import { api } from "@/lib/api";
import { QuestionTemplate } from "@/lib/types";
import toast from "react-hot-toast";
import { Plus, Trash2, Phone, User, FileText, Layers, Rocket, ChevronRight, ChevronLeft } from "lucide-react";

/* ─── Types ─────────────────────────────────────────────── */
interface RefEntry {
  key: string;
  referee_name: string;
  referee_phone: string;
  referee_email: string;
  relationship: string;
  company_at_time: string;
}

const EMPTY_REF = (): RefEntry => ({
  key: Math.random().toString(36).slice(2),
  referee_name: "",
  referee_phone: "",
  referee_email: "",
  relationship: "",
  company_at_time: "",
});

/* ─── Step indicators ───────────────────────────────────── */
const STEPS = [
  { label: "Candidate",   icon: User },
  { label: "References",  icon: Phone },
  { label: "Template",    icon: Layers },
  { label: "Launch",      icon: Rocket },
];

function StepBar({ current }: { current: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", marginBottom: "36px" }}>
      {STEPS.map(({ label, icon: Icon }, i) => {
        const done    = i < current;
        const active  = i === current;
        const future  = i > current;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center", flex: i < STEPS.length - 1 ? 1 : undefined }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px" }}>
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                background: done ? "#34C759" : active ? "#0071E3" : "#E5E5EA",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.3s",
              }}>
                {done
                  ? <span style={{ color: "#fff", fontSize: "16px", lineHeight: 1 }}>✓</span>
                  : <Icon size={16} color={active ? "#fff" : "#AEAEB2"} />}
              </div>
              <span style={{
                fontSize: "11px", fontWeight: active ? 700 : 500,
                color: active ? "#0071E3" : done ? "#34C759" : "#AEAEB2",
                whiteSpace: "nowrap",
              }}>
                {label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{
                flex: 1, height: "2px", margin: "0 8px",
                marginBottom: "20px",
                background: done ? "#34C759" : "#E5E5EA",
                transition: "background 0.3s",
              }} />
            )}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component ────────────────────────────────────── */
export default function NewCheckPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [uid, setUid]   = useState("");
  const [saving, setSaving] = useState(false);

  // Step 1 — Candidate
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole]   = useState("");
  const [company, setCompany] = useState("");
  const [jd, setJd]       = useState("");

  // Step 2 — References
  const [refs, setRefs] = useState<RefEntry[]>([EMPTY_REF(), EMPTY_REF()]);

  // Step 3 — Template
  const [templates, setTemplates]     = useState<QuestionTemplate[]>([]);
  const [templateId, setTemplateId]   = useState<string>("");

  // Created candidate ID
  const [candidateId, setCandidateId] = useState<string>("");

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => setUid(data.user?.id ?? ""));
  }, []);

  useEffect(() => {
    if (step === 2 && uid) {
      api.templates.list(uid).then((list) => {
        setTemplates(list);
        const def = list.find((t) => t.is_default);
        if (def) setTemplateId(def.id);
      });
    }
  }, [step, uid]);

  /* ── Ref helpers ──────────────────────────────────────── */
  function updateRef(key: string, field: keyof RefEntry, value: string) {
    setRefs((prev) =>
      prev.map((r) => (r.key === key ? { ...r, [field]: value } : r))
    );
  }
  function addRef() {
    if (refs.length < 4) setRefs((prev) => [...prev, EMPTY_REF()]);
  }
  function removeRef(key: string) {
    if (refs.length > 2) setRefs((prev) => prev.filter((r) => r.key !== key));
  }

  /* ── Step navigation ──────────────────────────────────── */
  function canProceedStep0() {
    return name.trim() && role.trim() && company.trim();
  }
  function canProceedStep1() {
    return refs.every((r) => r.referee_name.trim() && r.referee_phone.trim() && r.relationship.trim());
  }

  /* ── Submit + launch ──────────────────────────────────── */
  async function handleLaunch() {
    setSaving(true);
    try {
      // 1. Create candidate (or use existing if user went back)
      let cid = candidateId;
      if (!cid) {
        const c = await api.candidates.create(uid, {
          name, email, role_applied_for: role,
          company_name: company, job_description_summary: jd,
          template_id: templateId || undefined,
        });
        cid = c.id;
        setCandidateId(cid);
      } else {
        // Update with any changes
        await api.candidates.update(uid, cid, {
          name, email, role_applied_for: role,
          company_name: company, job_description_summary: jd,
          template_id: templateId || undefined,
        });
      }

      // 2. Add references
      await Promise.all(
        refs.map((r) =>
          api.references.add(uid, cid, {
            referee_name: r.referee_name,
            referee_phone: r.referee_phone,
            referee_email: r.referee_email || undefined,
            relationship: r.relationship,
            company_at_time: r.company_at_time || undefined,
          })
        )
      );

      // 3. Start checks
      await api.candidates.start(uid, cid);

      toast.success("Reference checks launched! We'll email you when complete.");
      router.push(`/checks/${cid}`);
    } catch (err: any) {
      toast.error(err.message ?? "Something went wrong");
      setSaving(false);
    }
  }

  const isLastStep = step === 3;

  return (
    <div className="page-enter" style={{ padding: "40px 48px", maxWidth: "720px" }}>
      {/* Header */}
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1D1D1F", letterSpacing: "-0.3px", margin: 0 }}>
          New Reference Check
        </h1>
        <p style={{ fontSize: "15px", color: "#6E6E73", margin: "4px 0 0" }}>
          RefCheck AI will call each reference and return a scored report in ~20 minutes.
        </p>
      </div>

      <StepBar current={step} />

      <div className="apple-card" style={{ padding: "32px" }}>

        {/* ── Step 0: Candidate info ──────────────────────── */}
        {step === 0 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>
              Candidate information
            </h2>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", gap: "14px" }}>
                <div style={{ flex: 1 }}>
                  <label className="label">Full name *</label>
                  <input className="apple-input" placeholder="Maria Chen" value={name}
                    onChange={(e) => setName(e.target.value)} />
                </div>
                <div style={{ flex: 1 }}>
                  <label className="label">Email (optional)</label>
                  <input className="apple-input" type="email" placeholder="maria@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="label">Role being hired for *</label>
                <input className="apple-input" placeholder="Senior Software Engineer" value={role}
                  onChange={(e) => setRole(e.target.value)} />
              </div>
              <div>
                <label className="label">Your company name *</label>
                <input className="apple-input" placeholder="Acme Corp" value={company}
                  onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div>
                <label className="label">Job description summary (optional)</label>
                <textarea className="apple-textarea" rows={3}
                  placeholder="Brief summary of key responsibilities — helps CALL-E ask the right fit questions."
                  value={jd} onChange={(e) => setJd(e.target.value)} />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 1: References ──────────────────────────── */}
        {step === 1 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 4px" }}>
                  Add references
                </h2>
                <p style={{ fontSize: "14px", color: "#6E6E73", margin: 0 }}>
                  Minimum 2, maximum 4. CALL-E calls each one on its own line, all at once.
                </p>
              </div>
              {refs.length < 4 && (
                <button className="btn-secondary" onClick={addRef} style={{ flexShrink: 0 }}>
                  <Plus size={14} /> Add reference
                </button>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {refs.map((ref, i) => (
                <div key={ref.key} style={{
                  padding: "18px", border: "1.5px solid #E5E5EA",
                  borderRadius: "12px", background: "#FAFAFA",
                  position: "relative",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "14px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "#6E6E73", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Reference {i + 1}
                    </span>
                    {refs.length > 2 && (
                      <button
                        onClick={() => removeRef(ref.key)}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "#FF3B30", padding: "2px" }}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label className="label">Full name *</label>
                        <input className="apple-input" placeholder="James Smith" value={ref.referee_name}
                          onChange={(e) => updateRef(ref.key, "referee_name", e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="label">Phone number *</label>
                        <input className="apple-input" placeholder="+15555550100" value={ref.referee_phone}
                          onChange={(e) => updateRef(ref.key, "referee_phone", e.target.value)} />
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "12px" }}>
                      <div style={{ flex: 1 }}>
                        <label className="label">Relationship *</label>
                        <input className="apple-input" placeholder="Former direct manager at Acme" value={ref.relationship}
                          onChange={(e) => updateRef(ref.key, "relationship", e.target.value)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label className="label">Company at time</label>
                        <input className="apple-input" placeholder="Acme Corp" value={ref.company_at_time}
                          onChange={(e) => updateRef(ref.key, "company_at_time", e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="label">Email (optional)</label>
                      <input className="apple-input" type="email" placeholder="james@acme.com" value={ref.referee_email}
                        onChange={(e) => updateRef(ref.key, "referee_email", e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2: Template ────────────────────────────── */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
              Question template
            </h2>
            <p style={{ fontSize: "14px", color: "#6E6E73", margin: "0 0 20px" }}>
              Choose the question set CALL-E will use. Templates are role-optimised.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {templates.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTemplateId(t.id)}
                  style={{
                    width: "100%", textAlign: "left",
                    padding: "16px 18px",
                    border: `2px solid ${templateId === t.id ? "#0071E3" : "#E5E5EA"}`,
                    borderRadius: "12px",
                    background: templateId === t.id ? "#E8F2FD" : "#FAFAFA",
                    cursor: "pointer",
                    transition: "border-color 0.15s, background 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", color: "#1D1D1F" }}>
                        {t.name}
                        {t.is_default && (
                          <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 700, color: "#0071E3",
                            background: "#E8F2FD", padding: "2px 8px", borderRadius: "100px" }}>
                            Default
                          </span>
                        )}
                        {t.is_system && !t.is_default && (
                          <span style={{ marginLeft: "8px", fontSize: "11px", fontWeight: 600, color: "#6E6E73",
                            background: "#F0F0F2", padding: "2px 8px", borderRadius: "100px" }}>
                            System
                          </span>
                        )}
                      </div>
                      {t.description && (
                        <div style={{ fontSize: "13px", color: "#6E6E73", marginTop: "2px" }}>
                          {t.description}
                        </div>
                      )}
                    </div>
                    <div style={{ fontSize: "12px", color: "#AEAEB2", whiteSpace: "nowrap", marginLeft: "12px" }}>
                      {t.questions.length} questions
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Review & Launch ─────────────────────── */}
        {step === 3 && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 20px" }}>
              Review & launch
            </h2>

            {/* Candidate summary */}
            <div style={{ padding: "16px", background: "#F5F5F7", borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "8px" }}>
                Candidate
              </div>
              <div style={{ fontSize: "16px", fontWeight: 700, color: "#1D1D1F" }}>{name}</div>
              <div style={{ fontSize: "14px", color: "#6E6E73" }}>{role} · {company}</div>
            </div>

            {/* References summary */}
            <div style={{ padding: "16px", background: "#F5F5F7", borderRadius: "12px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "10px" }}>
                {refs.length} References
              </div>
              {refs.map((r, i) => (
                <div key={r.key} style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: i < refs.length - 1 ? "8px" : 0 }}>
                  <div style={{ width: 24, height: 24, borderRadius: "50%", background: "#E5E5EA",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: "12px", fontWeight: 700, color: "#6E6E73", flexShrink: 0 }}>
                    {i + 1}
                  </div>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F" }}>{r.referee_name}</span>
                    <span style={{ fontSize: "13px", color: "#6E6E73" }}> · {r.relationship}</span>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: "12px", color: "#AEAEB2" }}>
                    {r.referee_phone}
                  </span>
                </div>
              ))}
            </div>

            {/* Template */}
            {templateId && templates.length > 0 && (
              <div style={{ padding: "16px", background: "#F5F5F7", borderRadius: "12px", marginBottom: "20px" }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#AEAEB2", textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: "6px" }}>
                  Template
                </div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#1D1D1F" }}>
                  {templates.find((t) => t.id === templateId)?.name}
                </div>
              </div>
            )}

            {/* Estimate */}
            <div style={{
              padding: "14px 16px",
              background: "#E8F2FD",
              borderRadius: "12px",
              display: "flex", alignItems: "center", gap: "12px",
            }}>
              <Phone size={20} color="#0071E3" />
              <div>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "#0071E3" }}>
                  Estimated completion: ~20 minutes
                </div>
                <div style={{ fontSize: "13px", color: "#5098D8" }}>
                  All {refs.length} calls run in parallel. We'll email you when they're complete.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── Navigation ──────────────────────────────────── */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          marginTop: "28px", paddingTop: "20px", borderTop: "1px solid #E5E5EA",
        }}>
          <button
            className="btn-secondary"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            style={{ visibility: step === 0 ? "hidden" : "visible" }}
          >
            <ChevronLeft size={15} /> Back
          </button>

          {!isLastStep ? (
            <button
              className="btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={
                (step === 0 && !canProceedStep0()) ||
                (step === 1 && !canProceedStep1())
              }
            >
              Continue <ChevronRight size={15} />
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleLaunch}
              disabled={saving}
              style={{ background: saving ? "#6E6E73" : "linear-gradient(135deg, #0071E3, #0056B0)" }}
            >
              {saving ? (
                <><span className="spinner" style={{ width: 15, height: 15 }} /> Launching…</>
              ) : (
                <><Rocket size={15} /> Launch Reference Checks</>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
