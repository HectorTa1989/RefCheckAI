/**
 * The app's pages, as pure functions of state. Copy and layout follow
 * frontend/app/** so every frame shows what the real page shows in that state.
 */
import React from "react";
import {
  ArrowLeft,
  CheckCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Clock,
  Download,
  Layers,
  Phone,
  Plus,
  RefreshCw,
  Rocket,
  Share2,
  TrendingUp,
  User,
} from "lucide-react";
import {
  AppShell,
  BtnGhost,
  BtnPrimary,
  BtnSecondary,
  Card,
  CandidateCard,
  Field,
  Input,
  Label,
  RecBadge,
  ReferencePanel,
  RefData,
  RingPlaceholder,
  ScoreRing,
  Spinner,
  StatCard,
  StepBar,
  TabBar,
  Toast,
  ScrollFn,
  useAnchoredScroll,
  dh,
  dt,
} from "./ui";
import { CANDIDATE, DASHBOARD, REF_INPUTS, SWE_QUESTIONS, TEMPLATES } from "./data";
import { C, FONT } from "./theme";

const h1: React.CSSProperties = { fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.3px", margin: 0, lineHeight: 1.25 };
const sub: React.CSSProperties = { fontSize: 15, color: C.secondary, margin: "4px 0 0" };
const upperLabel: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 700,
  color: "#AEAEB2",
  textTransform: "uppercase",
  letterSpacing: "0.06em",
};

/*
 * The app uses the ✉️ and ✅ emoji. Headless Chrome on Windows draws them as
 * monochrome outlines, so these reproduce how a Mac renders them.
 */
const EnvelopeEmoji: React.FC = () => (
  <svg width="48" height="40" viewBox="0 0 48 40" style={{ display: "block", margin: "0 auto 12px" }}>
    <defs>
      <linearGradient id="env" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E9EBEF" />
      </linearGradient>
    </defs>
    <rect x="2" y="5" width="44" height="31" rx="4" fill="url(#env)" stroke="#C9CDD4" strokeWidth="1.2" />
    <path d="M3.5 7.5 L24 23 L44.5 7.5" fill="none" stroke="#B4B9C2" strokeWidth="1.6" strokeLinejoin="round" />
    <path d="M3.5 34 L18 19.5 M44.5 34 L30 19.5" fill="none" stroke="#D3D6DC" strokeWidth="1.2" />
  </svg>
);

const CheckEmoji: React.FC = () => (
  <span
    style={{
      width: 18,
      height: 18,
      borderRadius: 5,
      background: "linear-gradient(180deg, #4CD964, #2FB24C)",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    }}
  >
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.5l4.5 4.5L19 7" />
    </svg>
  </span>
);

/* ═════════════ /login ═════════════ */

export const LoginPage: React.FC<{
  email: string;
  focused: boolean;
  caret: boolean;
  sending: boolean;
  sent: boolean;
  hover: boolean;
  frame: number;
  enter?: number;
}> = ({ email, focused, caret, sending, sent, hover, frame, enter = 1 }) => (
  <div
    style={{
      position: "absolute",
      inset: 0,
      background: C.fill4,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 24,
      fontFamily: FONT,
    }}
  >
    <div style={{ width: 400, opacity: enter, transform: `translateY(${(1 - enter) * 10}px)` }}>
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div
          style={{
            width: 60,
            height: 60,
            background: "linear-gradient(135deg, #0071E3 0%, #0056B0 100%)",
            borderRadius: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
          }}
        >
          <Phone size={28} color="#fff" />
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: C.text, letterSpacing: "-0.3px", margin: "0 0 6px" }}>
          RefCheck AI
        </h1>
        <p style={{ fontSize: 15, color: C.secondary, margin: 0 }}>Automated reference verification</p>
      </div>

      <div
        {...dh("login-card")}
        style={{
          background: "#fff",
          borderRadius: 18,
          padding: 32,
          boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)",
        }}
      >
        {sent ? (
          <div style={{ textAlign: "center" }}>
            <EnvelopeEmoji />
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 8px" }}>Check your email</h2>
            <p style={{ fontSize: 15, color: C.secondary, margin: "0 0 20px" }}>
              We sent a sign-in link to <strong>{email}</strong>
            </p>
            <BtnGhost style={{ margin: "0 auto" }}>Use a different email</BtnGhost>
          </div>
        ) : (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>Sign in</h2>
            <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 24px" }}>We'll send a magic link to your email.</p>
            <Label>Work email</Label>
            <div style={{ marginBottom: 20 }}>
              <Input value={email} placeholder="name@company.com" focused={focused} caret={caret} t="login-email" />
            </div>
            <BtnPrimary
              t="login-continue"
              hover={hover}
              style={{ width: "100%", justifyContent: "center", boxSizing: "border-box", ...(sending ? { background: C.blueDk } : {}) }}
            >
              {sending ? (
                <>
                  <Spinner size={16} frame={frame} light /> Sending…
                </>
              ) : (
                "Continue with email"
              )}
            </BtnPrimary>
          </div>
        )}
      </div>
      <p style={{ textAlign: "center", fontSize: 13, color: "#AEAEB2", marginTop: 20 }}>
        By signing in you agree to our Terms & Privacy Policy.
      </p>
    </div>
  </div>
);

/* ═════════════ /dashboard ═════════════ */

export const DashboardPage: React.FC<{ filter: string; enter?: number; newHover?: boolean }> = ({
  filter,
  enter = 1,
  newHover,
}) => {
  const rows = filter === "all" ? DASHBOARD : DASHBOARD.filter((r) => r.status === filter);
  const complete = DASHBOARD.filter((r) => r.status === "complete");
  const avg = (complete.reduce((s, r) => s + (r.score ?? 0), 0) / complete.length).toFixed(1);
  return (
    <AppShell active="/dashboard" maxWidth={900} enter={enter}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 32 }}>
        <div>
          <h1 style={h1}>Dashboard</h1>
          <p style={sub}>{DASHBOARD.length} candidates tracked</p>
        </div>
        <BtnPrimary t="dash-new" hover={newHover}>
          <Plus size={16} />
          New Check
        </BtnPrimary>
      </div>

      <div style={{ display: "flex", gap: 12, marginBottom: 32 }}>
        <StatCard label="Total candidates" value={DASHBOARD.length} Icon={Phone} color="#0071E3" />
        <StatCard label="In progress" value={DASHBOARD.length - complete.length} Icon={Clock} color="#FF9F0A" />
        <StatCard label="Completed" value={complete.length} Icon={CheckCircle} color="#34C759" />
        <StatCard label="Avg score" value={avg} Icon={TrendingUp} color="#AF52DE" />
      </div>

      <div style={{ marginBottom: 20 }}>
        <TabBar
          hl="dash-tabs"
          active={filter}
          tabs={[
            { id: "all", label: "All" },
            { id: "in_progress", label: "In Progress" },
            { id: "complete", label: "Complete" },
          ]}
        />
      </div>

      <div {...dh("dash-list")} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rows.map((r) => (
          <CandidateCard key={r.id} c={r} t={`row-${r.id}`} />
        ))}
      </div>
    </AppShell>
  );
};

/* ═════════════ /templates ═════════════ */

export const TemplatesPage: React.FC<{ expanded: string | null; open?: number; enter?: number; scrollFn?: ScrollFn }> = ({
  expanded,
  open = 1,
  enter = 1,
  scrollFn,
}) => (
  <AppShell active="/templates" maxWidth={800} enter={enter} scrollFn={scrollFn}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
      <div>
        <h1 style={h1}>Question Templates</h1>
        <p style={sub}>Manage the question sets CALL-E uses during reference calls.</p>
      </div>
      <BtnPrimary t="tpl-new">
        <Plus size={15} /> New template
      </BtnPrimary>
    </div>

    <h2 style={{ fontSize: 16, fontWeight: 700, color: C.text, margin: "0 0 12px" }}>System templates</h2>
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {TEMPLATES.map((t) => {
        const isOpen = expanded === t.id;
        return (
          <Card sm key={t.id} hl={`tpl-${t.id}`} style={{ overflow: "hidden" }}>
            <div {...dt(`tpl-${t.id}`)} style={{ display: "flex", alignItems: "center", padding: "16px 20px" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.name}</span>
                  {t.is_default && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#0071E3", background: "#E8F2FD", padding: "2px 8px", borderRadius: 100 }}>
                      Default
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>{t.description}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: "#AEAEB2" }}>{t.questions} questions</span>
                {isOpen ? <ChevronUp size={16} color="#AEAEB2" /> : <ChevronDown size={16} color="#AEAEB2" />}
              </div>
            </div>
            {isOpen && (
              <div style={{ padding: "0 20px 16px", borderTop: "1px solid #F0F0F2", opacity: open }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 14 }}>
                  {SWE_QUESTIONS.map((q, i) => (
                    <div
                      key={q.text}
                      {...dh(q.follow_up ? `tpl-q${i}` : undefined)}
                      style={{
                        padding: "10px 14px",
                        background: "#F5F5F7",
                        borderRadius: 8,
                        fontSize: 13,
                        color: "#3D3D42",
                        lineHeight: 1.5,
                      }}
                    >
                      <span style={{ fontWeight: 700, color: "#AEAEB2", marginRight: 8 }}>Q{i + 1}</span>
                      {q.text}
                      {q.follow_up && (
                        <div style={{ fontSize: 12, color: "#AEAEB2", marginTop: 4, fontStyle: "italic" }}>
                          Follow-up: {q.follow_up}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  </AppShell>
);

/* ═════════════ /checks/new ═════════════ */

export type RefDraft = { name: string; phone: string; rel: string; co: string };
export type WizardState = {
  step: number;
  enter?: number;
  scrollFn?: ScrollFn;
  cand: { name: string; role: string; company: string; jd: string };
  focus: string | null;
  caret: boolean;
  refs: RefDraft[];
  thirdIn?: number;
  template: string;
  continueHover?: boolean;
  continueEnabled: boolean;
  launching?: boolean;
  frame: number;
};

const STEP_ICONS = [User, Phone, Layers, Rocket];

const RefCardDraft: React.FC<{ i: number; r: RefDraft; focus: string | null; caret: boolean; trash: boolean; opacity?: number }> = ({
  i,
  r,
  focus,
  caret,
  trash,
  opacity = 1,
}) => {
  const f = (field: string) => focus === `ref${i}-${field}`;
  return (
    <div
      {...dh(`ref-card-${i}`)}
      style={{
        padding: 18,
        border: "1.5px solid #E5E5EA",
        borderRadius: 12,
        background: "#FAFAFA",
        position: "relative",
        opacity,
        transform: `translateY(${(1 - opacity) * 10}px)`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: C.secondary, textTransform: "uppercase", letterSpacing: "0.06em" }}>
          Reference {i + 1}
        </span>
        {trash && (
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#FF3B30" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
          </svg>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", gap: 12 }}>
          <Field style={{ flex: 1 }} label="Full name *" placeholder="James Smith" value={r.name} focused={f("name")} caret={caret} t={`ref${i}-name`} />
          <Field style={{ flex: 1 }} label="Phone number *" placeholder="+15555550100" value={r.phone} focused={f("phone")} caret={caret} />
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          <Field style={{ flex: 1 }} label="Relationship *" placeholder="Former direct manager at Acme" value={r.rel} focused={f("rel")} caret={caret} />
          <Field style={{ flex: 1 }} label="Company at time" placeholder="Acme Corp" value={r.co} focused={f("co")} caret={caret} />
        </div>
        <Field label="Email (optional)" placeholder="james@acme.com" value="" />
      </div>
    </div>
  );
};

export const NewCheckPage: React.FC<{ s: WizardState }> = ({ s }) => {
  const last = s.step === 3;
  return (
    <AppShell active="/checks/new" maxWidth={720} enter={s.enter ?? 1} scrollFn={s.scrollFn}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={h1}>New Reference Check</h1>
        <p style={sub}>RefCheck AI will call each reference and return a scored report in ~20 minutes.</p>
      </div>

      <StepBar current={s.step} icons={STEP_ICONS} hl="stepbar" />

      <Card style={{ padding: 32 }}>
        {s.step === 0 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Candidate information</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", gap: 14 }}>
                <Field style={{ flex: 1 }} label="Full name *" placeholder="Maria Chen" value={s.cand.name} focused={s.focus === "name"} caret={s.caret} t="c-name" />
                <Field style={{ flex: 1 }} label="Email (optional)" placeholder="maria@example.com" value="" />
              </div>
              <Field label="Role being hired for *" placeholder="Senior Software Engineer" value={s.cand.role} focused={s.focus === "role"} caret={s.caret} t="c-role" />
              <Field label="Your company name *" placeholder="Acme Corp" value={s.cand.company} focused={s.focus === "company"} caret={s.caret} t="c-company" />
              <Field
                label="Job description summary (optional)"
                placeholder="Brief summary of key responsibilities — helps CALL-E ask the right fit questions."
                value={s.cand.jd}
                focused={s.focus === "jd"}
                caret={s.caret}
                t="c-jd"
                multiline
              />
            </div>
          </div>
        )}

        {s.step === 1 && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Add references</h2>
                <p style={{ fontSize: 14, color: C.secondary, margin: 0 }}>
                  Minimum 2, maximum 4. CALL-E calls each one on its own line, all at once.
                </p>
              </div>
              <BtnSecondary t="add-ref" style={{ flexShrink: 0 }}>
                <Plus size={14} /> Add reference
              </BtnSecondary>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {s.refs.map((r, i) => (
                <RefCardDraft
                  key={i}
                  i={i}
                  r={r}
                  focus={s.focus}
                  caret={s.caret}
                  trash={s.refs.length > 2}
                  opacity={i === 2 ? s.thirdIn ?? 1 : 1}
                />
              ))}
            </div>
          </div>
        )}

        {s.step === 2 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>Question template</h2>
            <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 20px" }}>
              Choose the question set CALL-E will use. Templates are role-optimised.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {TEMPLATES.map((t) => {
                const on = s.template === t.id;
                return (
                  <div
                    key={t.id}
                    {...dt(`pick-${t.id}`)}
                    {...dh(`pick-${t.id}`)}
                    style={{
                      width: "100%",
                      padding: "16px 18px",
                      border: `2px solid ${on ? "#0071E3" : "#E5E5EA"}`,
                      borderRadius: 12,
                      background: on ? "#E8F2FD" : "#FAFAFA",
                      boxSizing: "border-box",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.text }}>
                          {t.name}
                          {t.is_default ? (
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 700, color: "#0071E3", background: "#E8F2FD", padding: "2px 8px", borderRadius: 100 }}>
                              Default
                            </span>
                          ) : (
                            <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600, color: C.secondary, background: "#F0F0F2", padding: "2px 8px", borderRadius: 100 }}>
                              System
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>{t.description}</div>
                      </div>
                      <div style={{ fontSize: 12, color: "#AEAEB2", whiteSpace: "nowrap", marginLeft: 12 }}>{t.questions} questions</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {s.step === 3 && (
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Review & launch</h2>
            <div style={{ padding: 16, background: C.fill4, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ ...upperLabel, marginBottom: 8 }}>Candidate</div>
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{CANDIDATE.name}</div>
              <div style={{ fontSize: 14, color: C.secondary }}>
                {CANDIDATE.role} · {CANDIDATE.company}
              </div>
            </div>
            <div style={{ padding: 16, background: C.fill4, borderRadius: 12, marginBottom: 16 }}>
              <div style={{ ...upperLabel, marginBottom: 10 }}>{REF_INPUTS.length} References</div>
              {REF_INPUTS.map((r, i) => (
                <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: i < 2 ? 8 : 0 }}>
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      background: "#E5E5EA",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: C.secondary,
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </div>
                  <div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.name}</span>
                    <span style={{ fontSize: 13, color: C.secondary }}> · {r.rel}</span>
                  </div>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#AEAEB2" }}>{r.phone}</span>
                </div>
              ))}
            </div>
            <div style={{ padding: 16, background: C.fill4, borderRadius: 12, marginBottom: 20 }}>
              <div style={{ ...upperLabel, marginBottom: 6 }}>Template</div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>Software Engineer</div>
            </div>
            <div style={{ padding: "14px 16px", background: "#E8F2FD", borderRadius: 12, display: "flex", alignItems: "center", gap: 12 }}>
              <Phone size={20} color="#0071E3" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#0071E3" }}>Estimated completion: ~20 minutes</div>
                <div style={{ fontSize: 13, color: "#5098D8" }}>
                  All {REF_INPUTS.length} calls run in parallel. We'll email you when they're complete.
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 28,
            paddingTop: 20,
            borderTop: "1px solid #E5E5EA",
          }}
        >
          <BtnSecondary style={{ visibility: s.step === 0 ? "hidden" : "visible" }}>
            <ChevronLeft size={15} /> Back
          </BtnSecondary>
          {!last ? (
            <BtnPrimary t="continue" hl="continue" hover={s.continueHover} disabled={!s.continueEnabled}>
              Continue <ChevronRight size={15} />
            </BtnPrimary>
          ) : (
            <BtnPrimary
              t="launch"
              hl="launch"
              style={{ background: s.launching ? "#6E6E73" : "linear-gradient(135deg, #0071E3, #0056B0)" }}
            >
              {s.launching ? (
                <>
                  <Spinner size={15} frame={s.frame} light /> Launching…
                </>
              ) : (
                <>
                  <Rocket size={15} /> Launch Reference Checks
                </>
              )}
            </BtnPrimary>
          )}
        </div>
      </Card>
    </AppShell>
  );
};

/* ═════════════ /checks/[id] ═════════════ */

const CHIP: Record<string, string> = {
  queued: "#AEAEB2",
  calling: "#0071E3",
  completed: "#34C759",
  failed: "#FF3B30",
};

export type CheckState = {
  complete: boolean;
  refs: RefData[];
  ring: number;
  scrollFn?: ScrollFn;
  enter?: number;
  expanded: Record<string, boolean>;
  open?: Record<string, number>;
  transcript?: boolean;
  shared?: boolean;
  toast?: { text: string; t: number } | null;
  frame: number;
  shareHover?: boolean;
  pdfHover?: boolean;
};

export const CheckPage: React.FC<{ s: CheckState }> = ({ s }) => {
  const completed = s.refs.filter((r) => r.call_status === "completed").length;
  const rehireYes = s.refs.filter((r) => r.would_rehire === true).length;
  const rehireKnown = s.refs.filter((r) => r.would_rehire != null).length;
  return (
    <AppShell
      active="/dashboard"
      maxWidth={900}
      enter={s.enter ?? 1}
      scrollFn={s.scrollFn}
      overlay={s.toast ? <Toast text={s.toast.text} t={s.toast.t} /> : null}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <BtnGhost style={{ padding: "8px 0", color: C.secondary }}>
          <ArrowLeft size={15} /> Back
        </BtnGhost>
        <div {...dh("actions")} style={{ display: "flex", gap: 10 }}>
          {!s.complete ? (
            <BtnSecondary t="refresh">
              <RefreshCw size={14} /> Refresh
            </BtnSecondary>
          ) : (
            <>
              <BtnSecondary t="share" hl="share" hover={s.shareHover}>
                <Share2 size={14} />
                {s.shared ? "Disable share" : "Share report"}
              </BtnSecondary>
              <BtnPrimary t="pdf" hover={s.pdfHover}>
                <Download size={14} /> Download PDF
              </BtnPrimary>
            </>
          )}
        </div>
      </div>

      {s.complete ? (
        <div
          {...dh("banner")}
          style={{ padding: "12px 18px", background: "#E8F9EE", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}
        >
          <CheckEmoji />
          <span style={{ fontSize: 14, color: "#1A7F3C", fontWeight: 500 }}>All reference checks complete. Report ready.</span>
        </div>
      ) : (
        <div
          {...dh("banner")}
          style={{ padding: "12px 18px", background: "#E8F2FD", borderRadius: 12, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}
        >
          <Spinner size={16} frame={s.frame} />
          <span style={{ fontSize: 14, color: "#0071E3", fontWeight: 500 }}>
            Calls in progress — this page auto-refreshes every 15 seconds.
          </span>
        </div>
      )}

      <Card hl="overview" style={{ padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          <div {...dh("ring")} style={{ flexShrink: 0, width: 100, height: 100 }}>
            {s.complete ? (
              <ScoreRing score={CANDIDATE.overall} size={100} strokeWidth={8} sublabel="/10" progress={s.ring} />
            ) : (
              <RingPlaceholder size={100} border={8} icon={32} />
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, color: C.text, letterSpacing: "-0.3px", margin: 0 }}>{CANDIDATE.name}</h1>
              {s.complete && <RecBadge rec={CANDIDATE.rec} size="md" hl="rec" />}
            </div>
            <div style={{ fontSize: 15, color: C.secondary, marginBottom: 16 }}>
              {CANDIDATE.role} · {CANDIDATE.company}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {s.refs.map((r) => {
                const color = CHIP[r.call_status];
                return (
                  <div
                    key={r.key}
                    {...dh(`chip-${r.key}`)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      padding: "4px 12px",
                      borderRadius: 100,
                      background: `${color}18`,
                      border: `1px solid ${color}30`,
                    }}
                  >
                    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, display: "inline-block" }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color }}>{r.referee_name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {s.complete && (
            <div
              {...dh("stats")}
              style={{
                flexShrink: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                padding: "0 0 0 24px",
                borderLeft: "1px solid #E5E5EA",
                minWidth: 140,
              }}
            >
              <div>
                <div style={{ ...upperLabel, fontSize: 11 }}>Refs checked</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                  {completed}/{s.refs.length}
                </div>
              </div>
              <div>
                <div style={{ ...upperLabel, fontSize: 11 }}>Would rehire</div>
                <div style={{ fontSize: 14, fontWeight: 700 }}>
                  {rehireYes}/{rehireKnown}
                  <span style={{ fontSize: 12, color: "#AEAEB2", fontWeight: 400 }}> said yes</span>
                </div>
              </div>
              <div>
                <div style={{ ...upperLabel, fontSize: 11 }}>Completed</div>
                <div style={{ fontSize: 12, color: C.secondary }}>less than a minute ago</div>
              </div>
            </div>
          )}
        </div>
      </Card>

      <h2 style={{ fontSize: 17, fontWeight: 700, color: C.text, marginBottom: 14 }}>Reference details</h2>
      {s.refs.map((r) => (
        <ReferencePanel
          key={r.key}
          r={r}
          idPrefix={`rp-${r.key}`}
          expanded={!!s.expanded[r.key]}
          open={s.open?.[r.key] ?? 1}
          showTranscript={r.key === "james" && !!s.transcript}
        />
      ))}
    </AppShell>
  );
};

/* ═════════════ /shared/[token] ═════════════ */

export const SharedPage: React.FC<{ refs: RefData[]; scrollFn?: ScrollFn; enter?: number; pdfHover?: boolean }> = ({
  refs,
  scrollFn,
  enter = 1,
  pdfHover,
}) => {
  const { ref, scroll } = useAnchoredScroll(scrollFn, 0);
  return (
  <div style={{ position: "absolute", inset: 0, background: C.fill4, fontFamily: FONT, overflow: "hidden" }}>
    <header
      style={{
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderBottom: "1px solid #D2D2D7",
        padding: "14px 0",
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 28,
              height: 28,
              background: "linear-gradient(135deg, #0071E3, #0056B0)",
              borderRadius: 7,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Phone size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700 }}>RefCheck AI</span>
          <span
            {...dh("shared-badge")}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.secondary,
              background: "#EBEBED",
              padding: "3px 9px",
              borderRadius: 100,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
          >
            Shared report
          </span>
        </div>
        <BtnSecondary t="shared-pdf" hover={pdfHover}>
          <Download size={14} /> Download PDF
        </BtnSecondary>
      </div>
    </header>

    <div
      ref={ref}
      style={{
        maxWidth: 900,
        margin: "0 auto",
        padding: "92px 24px 64px",
        transform: `translateY(${-scroll + (1 - enter) * 8}px)`,
        opacity: enter,
      }}
    >
      <Card style={{ padding: "28px 32px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
          <ScoreRing score={CANDIDATE.overall} size={100} strokeWidth={8} sublabel="/10" />
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
              <h1 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.3px", margin: 0 }}>{CANDIDATE.name}</h1>
              <RecBadge rec={CANDIDATE.rec} size="md" />
            </div>
            <div style={{ fontSize: 15, color: C.secondary, marginBottom: 16 }}>
              {CANDIDATE.role} · {CANDIDATE.company}
            </div>
            <div style={{ display: "flex", gap: 36 }}>
              <div>
                <div style={{ ...upperLabel, fontSize: 11 }}>Refs checked</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>3/3</div>
              </div>
              <div>
                <div style={{ ...upperLabel, fontSize: 11 }}>Would rehire</div>
                <div style={{ fontSize: 20, fontWeight: 700 }}>2/2</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
      <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 14 }}>References</h2>
      {refs.map((r, i) => (
        <ReferencePanel key={r.key} r={{ ...r, transcript: undefined }} idPrefix={`sp-${r.key}`} expanded={i === 0} maxAnswers={2} />
      ))}
      <p {...dh("shared-privacy")} style={{ fontSize: 12, color: "#AEAEB2", textAlign: "center", marginTop: 36, lineHeight: 1.6 }}>
        Generated by RefCheck AI · calls placed via CALL-E · candidate consent on file.
        <br />
        Referee contact details are not included in shared reports.
      </p>
    </div>
  </div>
  );
};

/* ═════════════ PDF (backend/templates/report.html in the browser viewer) ═════════════ */

export const PdfViewer: React.FC<{ refs: RefData[]; t: number }> = ({ refs, t }) => (
  <div style={{ position: "absolute", inset: 0, background: "#525659", fontFamily: FONT, opacity: t }}>
    <div
      style={{
        height: 44,
        background: "#323639",
        display: "flex",
        alignItems: "center",
        padding: "0 18px",
        color: "#F1F3F4",
        fontSize: 13,
        gap: 18,
        boxShadow: "0 1px 4px rgba(0,0,0,0.4)",
      }}
    >
      <span style={{ fontWeight: 500 }}>RefCheck_Maria_Chen.pdf</span>
      <span style={{ marginLeft: "auto", opacity: 0.8 }}>1 / 4</span>
      <span style={{ opacity: 0.8 }}>—</span>
      <span style={{ opacity: 0.8 }}>100%</span>
      <span style={{ opacity: 0.8 }}>+</span>
    </div>
    <div style={{ display: "flex", justifyContent: "center", paddingTop: 26 }}>
      <div
        {...dh("pdf-page")}
        style={{
          width: 560,
          height: 792,
          background: "#fff",
          boxShadow: "0 6px 24px rgba(0,0,0,0.45)",
          transform: `translateY(${(1 - t) * 30}px)`,
          overflow: "hidden",
          fontFamily: "Inter, sans-serif",
          color: "#1D1D1F",
        }}
      >
        <div style={{ background: "linear-gradient(135deg, #0071E3 0%, #0056B0 100%)", color: "#fff", padding: "40px 40px 32px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, opacity: 0.85, marginBottom: 20 }}>RefCheck AI</div>
          <div style={{ fontSize: 27, fontWeight: 800, letterSpacing: "-0.5px", marginBottom: 3 }}>{CANDIDATE.name}</div>
          <div style={{ fontSize: 13.5, opacity: 0.8, marginBottom: 24 }}>
            {CANDIDATE.role} · {CANDIDATE.company}
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 54, fontWeight: 800, letterSpacing: "-2px", lineHeight: 1 }}>
                {CANDIDATE.overall.toFixed(1)}
                <span style={{ fontSize: 20, opacity: 0.6 }}>/10</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 10.5, opacity: 0.7 }}>Overall Reference Score</div>
            </div>
            <div style={{ paddingBottom: 8 }}>
              <span
                style={{
                  display: "inline-block",
                  background: "rgba(255,255,255,0.2)",
                  border: "1.5px solid rgba(255,255,255,0.4)",
                  borderRadius: 100,
                  padding: "6px 16px",
                  fontSize: 11.5,
                  fontWeight: 700,
                }}
              >
                Yes
              </span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 14, marginTop: 18, opacity: 0.7, fontSize: 10.5 }}>
            <span>3 references checked</span>
            <span>·</span>
            <span>Generated September 11, 2026 at 04:12 PM</span>
          </div>
        </div>
        <div style={{ padding: "26px 40px", borderBottom: "1px solid #E5E5EA" }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "#0071E3", marginBottom: 14 }}>
            Reference Summary
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {refs.map((r) => (
              <div key={r.key} style={{ flex: 1, border: "1px solid #E5E5EA", borderRadius: 10, padding: 13, background: "#FAFAFA" }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 2 }}>{r.referee_name}</div>
                <div style={{ fontSize: 9.5, color: C.secondary, marginBottom: 9, minHeight: 26 }}>{r.relationship}</div>
                <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1 }}>
                  {(r.overall_reference_score ?? 0).toFixed(1)}
                  <span style={{ fontSize: 11, color: C.secondary }}>/10</span>
                </div>
                <div style={{ marginTop: 4, fontSize: 9.5, color: C.secondary }}>
                  {r.referee_enthusiasm === "very_enthusiastic" ? "Very Enthusiastic" : r.referee_enthusiasm === "positive" ? "Positive" : "Neutral"}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    fontSize: 8.5,
                    fontWeight: 600,
                    padding: "3px 8px",
                    borderRadius: 100,
                    marginTop: 6,
                    background: r.would_rehire ? "#E8F9EE" : "#F5F5F7",
                    color: r.would_rehire ? "#1A7F3C" : C.secondary,
                  }}
                >
                  {r.would_rehire ? "Would rehire ✓" : "Rehire not stated"}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div style={{ padding: "22px 40px" }}>
          <div style={{ fontSize: 8.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1.2px", color: "#0071E3", marginBottom: 12 }}>
            Reference 1 of 3
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", paddingBottom: 10, borderBottom: "1px solid #E5E5EA", marginBottom: 10 }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{refs[0].referee_name}</div>
              <div style={{ fontSize: 10.5, color: C.secondary }}>
                {refs[0].relationship} · {refs[0].company_at_time}
              </div>
            </div>
            <div style={{ fontSize: 22, fontWeight: 800, color: "#0071E3" }}>
              {(refs[0].overall_reference_score ?? 0).toFixed(1)}
              <span style={{ fontSize: 11, color: C.secondary }}>/10</span>
            </div>
          </div>
          <div style={{ fontSize: 10.5, color: "#3D3D42", lineHeight: 1.6 }}>{refs[0].summary}</div>
        </div>
      </div>
    </div>
  </div>
);
