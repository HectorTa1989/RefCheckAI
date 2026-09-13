import React from "react";
import { useCurrentFrame } from "remotion";
import {
  User,
  Phone,
  Layers,
  Rocket,
  Plus,
  Check,
  ChevronLeft,
  ChevronRight,
  ListChecks,
} from "lucide-react";
import { Stage } from "../ui/Stage";
import {
  Page,
  Card,
  Label,
  Input,
  BtnPrimary,
  BtnSecondary,
  Spotlight,
  ChangeBox,
} from "../ui/App";
import { Cursor } from "../ui/Cursor";
import { C } from "../theme";
import { ramp, typed } from "../anim";
import { TEMPLATES } from "../data";

const STEPS = [
  { label: "Candidate", Icon: User },
  { label: "References", Icon: Phone },
  { label: "Template", Icon: Layers },
  { label: "Launch", Icon: Rocket },
];

const StepBar: React.FC<{ current: number }> = ({ current }) => (
  <div style={{ display: "flex", alignItems: "center", marginBottom: 24 }}>
    {STEPS.map(({ label, Icon }, i) => {
      const done = i < current;
      const on = i === current;
      const color = done || on ? C.blue : C.tertiary;
      return (
        <div
          key={label}
          style={{
            display: "flex",
            alignItems: "center",
            flex: i < STEPS.length - 1 ? 1 : undefined,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
            <div
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: done ? C.blue : on ? "rgba(0,113,227,0.10)" : C.fill3,
                border: on ? `2px solid ${C.blue}` : "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {done ? (
                <Check size={15} color="#fff" strokeWidth={3} />
              ) : (
                <Icon size={14} color={color} strokeWidth={2.2} />
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: on ? 650 : 500,
                color: on ? C.text : done ? C.blue : C.tertiary,
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              style={{
                flex: 1,
                height: 2,
                margin: "0 14px",
                borderRadius: 2,
                background: done ? C.blue : C.border2,
              }}
            />
          )}
        </div>
      );
    })}
  </div>
);

/** Fixed-height wizard shell so button coordinates never move. */
const WizardShell: React.FC<{
  step: number;
  children: React.ReactNode;
  primary: React.ReactNode;
  primaryHover?: boolean;
  primaryWide?: boolean;
}> = ({ step, children, primary, primaryHover, primaryWide }) => (
  <Page active="/checks/new">
    <h1
      style={{
        fontSize: 28,
        fontWeight: 700,
        color: C.text,
        letterSpacing: "-0.3px",
        margin: "0 0 16px",
      }}
    >
      New reference check
    </h1>
    <StepBar current={step} />
    <Card style={{ padding: "28px 32px", height: 600, position: "relative" }}>
      {children}
      <div
        style={{
          position: "absolute",
          left: 32,
          right: 32,
          bottom: 26,
          paddingTop: 18,
          borderTop: `1px solid ${C.border2}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <BtnSecondary style={{ visibility: step === 0 ? "hidden" : "visible" }}>
          <ChevronLeft size={15} /> Back
        </BtnSecondary>
        <BtnPrimary
          hover={primaryHover}
          style={
            primaryWide
              ? { background: "linear-gradient(135deg, #0071E3, #0056B0)" }
              : undefined
          }
        >
          {primary}
        </BtnPrimary>
      </div>
    </Card>
  </Page>
);

const Field: React.FC<{
  label: string;
  value: string;
  placeholder: string;
  focused?: boolean;
  caret?: boolean;
  style?: React.CSSProperties;
}> = ({ label, value, placeholder, focused, caret, style }) => (
  <div style={style}>
    <Label>{label}</Label>
    <Input value={value} placeholder={placeholder} focused={focused} caret={caret} />
  </div>
);

/* ══════════════ Step 1 — candidate ══════════════ */

const NAME = "Maria Chen";
const ROLE = "Senior Software Engineer";
const COMPANY = "Acme Corp";
const JD =
  "Owns the payments platform. Needs strong systems design, code review and cross-team communication.";

export const WizardCandidate: React.FC = () => {
  const frame = useCurrentFrame();
  const blink = Math.floor(frame / 8) % 2 === 0;

  const focus =
    frame < 46 ? -1 : frame < 132 ? 0 : frame < 216 ? 1 : frame < 288 ? 2 : frame < 400 ? 3 : -1;

  return (
    <Stage url="refcheck.ai/checks/new">
      <WizardShell
        step={0}
        primary={
          <>
            Continue <ChevronRight size={15} />
          </>
        }
        primaryHover={frame >= 420 && frame < 452}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 20px" }}>Candidate details</h2>

        <div style={{ display: "flex", gap: 16, marginBottom: 14 }}>
          <Field
            style={{ flex: 1 }}
            label="Full name *"
            placeholder="Maria Chen"
            value={typed(frame, NAME, 52, 104)}
            focused={focus === 0}
            caret={focus === 0 && blink}
          />
          <Field
            style={{ flex: 1 }}
            label="Email (optional)"
            placeholder="maria@example.com"
            value=""
          />
        </div>

        <Field
          style={{ marginBottom: 14 }}
          label="Role being hired for *"
          placeholder="Senior Software Engineer"
          value={typed(frame, ROLE, 136, 196)}
          focused={focus === 1}
          caret={focus === 1 && blink}
        />

        <Field
          style={{ marginBottom: 14 }}
          label="Your company name *"
          placeholder="Acme Corp"
          value={typed(frame, COMPANY, 220, 260)}
          focused={focus === 2}
          caret={focus === 2 && blink}
        />

        <div>
          <Label>Job description summary (optional)</Label>
          <div
            style={{
              padding: "11px 14px",
              background: C.fill4,
              border: `1.5px solid ${focus === 3 ? C.blue : C.border}`,
              boxShadow: focus === 3 ? "0 0 0 3px rgba(0,113,227,0.15)" : "none",
              borderRadius: 10,
              fontSize: 15,
              minHeight: 56,
              color: frame > 292 ? C.text : C.tertiary,
              lineHeight: 1.5,
            }}
          >
            {frame > 292
              ? typed(frame, JD, 294, 390)
              : "Brief summary of key responsibilities — helps CALL-E ask the right fit questions."}
            {focus === 3 && blink && (
              <span
                style={{
                  display: "inline-block",
                  width: 1.5,
                  height: 16,
                  background: C.blue,
                  marginLeft: 1,
                  verticalAlign: "-3px",
                }}
              />
            )}
          </div>
        </div>
      </WizardShell>

      <Cursor
        moves={[
          { at: 0, x: 1102, y: 52 },
          { at: 20, x: 521, y: 270 },
          { at: 108, x: 521, y: 356 },
          { at: 192, x: 521, y: 442 },
          { at: 262, x: 560, y: 530 },
          { at: 398, x: 1082, y: 694 },
        ]}
        clicks={[46, 132, 216, 288, 428]}
      />
    </Stage>
  );
};

/* ══════════════ Step 2 — references ══════════════ */

const REFS = [
  { n: "James Okafor", p: "+1 (415) 555-0142", r: "Former direct manager" },
  { n: "Priya Raman", p: "+1 (206) 555-0188", r: "Cross-functional peer" },
  { n: "Daniel Weiss", p: "+1 (312) 555-0107", r: "Skip-level manager" },
];

const RefCard: React.FC<{
  i: number;
  n: string;
  p: string;
  r: string;
  focusRel?: boolean;
  opacity?: number;
}> = ({ i, n, p, r, focusRel, opacity = 1 }) => (
  <div
    style={{
      border: `1.5px solid ${C.border2}`,
      borderRadius: 12,
      padding: "12px 16px",
      background: "#FAFAFB",
      marginBottom: 8,
      opacity,
      transform: `translateY(${(1 - opacity) * 10}px)`,
    }}
  >
    <div
      style={{
        fontSize: 12,
        fontWeight: 700,
        color: C.tertiary,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        marginBottom: 6,
      }}
    >
      Reference {i}
    </div>
    <div style={{ display: "flex", gap: 12 }}>
      <Field style={{ flex: 1 }} label="Full name *" placeholder="James Smith" value={n} />
      <Field
        style={{ flex: 1 }}
        label="Phone number *"
        placeholder="+15555550100"
        value={p}
      />
      <Field
        style={{ flex: 1 }}
        label="Relationship *"
        placeholder="Former manager"
        value={r}
        focused={focusRel}
      />
    </div>
  </div>
);

export const WizardReferences: React.FC = () => {
  const frame = useCurrentFrame();
  const third = ramp(frame, 312, 336, 0, 1);
  const spotNamePhone = ramp(frame, 62, 78, 0, 1) * ramp(frame, 150, 166, 1, 0);
  const spotRel = ramp(frame, 172, 188, 0, 1) * ramp(frame, 268, 284, 1, 0);

  return (
    <Stage url="refcheck.ai/checks/new">
      <WizardShell
        step={1}
        primary={
          <>
            Continue <ChevronRight size={15} />
          </>
        }
        primaryHover={frame >= 362 && frame < 394}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 16,
          }}
        >
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 4px" }}>Add references</h2>
            <p style={{ fontSize: 14, color: C.secondary, margin: 0 }}>
              Minimum 2, maximum 4. Each is called on its own line.
            </p>
          </div>
          <BtnSecondary hover={frame >= 296 && frame < 326} style={{ padding: "8px 18px" }}>
            <Plus size={14} /> Add reference
          </BtnSecondary>
        </div>

        <RefCard i={1} {...REFS[0]} focusRel={frame >= 172 && frame < 284} />
        <RefCard i={2} {...REFS[1]} />
        {third < 0.5 ? (
          <div
            style={{
              border: `1.5px dashed ${C.border}`,
              borderRadius: 12,
              padding: "12px 16px",
              height: 94,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              color: C.tertiary,
              fontSize: 14,
              fontWeight: 500,
              opacity: 1 - third * 2,
            }}
          >
            <Plus size={15} /> Room for one more reference — up to 4
          </div>
        ) : (
          <RefCard i={3} {...REFS[2]} opacity={third} />
        )}
      </WizardShell>

      {/* clicking "Add reference" at f312 adds a third reference row */}
      <ChangeBox frame={frame} at={336} x={310} y={498} w={848} h={128} tone="green"
                 label="Reference added" />

      <Spotlight x={324} y={296} w={542} h={60} opacity={spotNamePhone} radius={12} />
      <Spotlight x={876} y={296} w={268} h={60} opacity={spotRel} radius={12} />

      <Cursor
        moves={[
          { at: 0, x: 1082, y: 694 },
          { at: 40, x: 460, y: 325 },
          { at: 172, x: 1009, y: 325 },
          { at: 286, x: 1069, y: 191 },
          { at: 348, x: 1082, y: 694 },
        ]}
        clicks={[312, 372]}
      />
    </Stage>
  );
};

/* ══════════════ Step 3 — template (+ templates manager) ══════════════ */

const TemplateCard: React.FC<{
  t: (typeof TEMPLATES)[number];
  selected: boolean;
}> = ({ t, selected }) => (
  <div
    style={{
      padding: "13px 18px",
      border: `2px solid ${selected ? C.blue : C.border2}`,
      borderRadius: 12,
      background: selected ? C.blueLt : "#FAFAFA",
      marginBottom: 10,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{t.name}</div>
        <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>{t.desc}</div>
      </div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: selected ? C.blue : C.tertiary,
          whiteSpace: "nowrap",
          marginLeft: 16,
        }}
      >
        {t.count} questions
      </div>
    </div>
  </div>
);

const QUESTIONS = [
  "How did you work with {candidate_name}, and for how long?",
  "What were their core responsibilities day to day?",
  "What are their two greatest professional strengths?",
  "Where do they have the most room to grow?",
  "Describe a specific achievement you'd credit to them.",
  "How do they behave under real pressure or a deadline?",
  "How did they handle code review — giving and receiving?",
  "How quickly did they pick up unfamiliar systems?",
  "How did they work with product and design?",
  "Would you hire them again if you had the opportunity?",
  "Is {candidate_name} a fit for a {role} role? Why?",
];

export const WizardTemplate: React.FC = () => {
  const frame = useCurrentFrame();
  const showManager = frame >= 215;
  const selected = frame >= 152 ? 1 : 0;

  if (showManager) {
    const t = ramp(frame, 215, 235, 0, 1);
    return (
      <Stage url="refcheck.ai/templates">
        <Page active="/templates">
          <div style={{ opacity: t }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                marginBottom: 22,
              }}
            >
              <div>
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 700,
                    letterSpacing: "-0.3px",
                    margin: 0,
                  }}
                >
                  Templates
                </h1>
                <p style={{ fontSize: 15, color: C.secondary, margin: "4px 0 0" }}>
                  Question sets CALL-E uses on the call
                </p>
              </div>
              <BtnPrimary>
                <Plus size={16} /> New template
              </BtnPrimary>
            </div>

            <Card style={{ padding: "20px 28px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <ListChecks size={19} color={C.blue} />
                <span style={{ fontSize: 18, fontWeight: 700 }}>Engineering</span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.blue,
                    background: C.blueLt,
                    padding: "3px 9px",
                    borderRadius: 100,
                  }}
                >
                  SYSTEM
                </span>
              </div>
              <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 12px" }}>
                11 questions · adds technical depth, code quality and learning agility
              </p>

              {QUESTIONS.map((q, i) => (
                <div
                  key={q}
                  style={{
                    display: "flex",
                    gap: 12,
                    padding: "8.5px 0",
                    borderTop: i === 0 ? "none" : `1px solid ${C.border2}`,
                    opacity: ramp(frame, 232 + i * 4, 246 + i * 4, 0, 1),
                  }}
                >
                  <span
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: C.fill3,
                      color: C.secondary,
                      fontSize: 11,
                      fontWeight: 700,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {i + 1}
                  </span>
                  <span style={{ fontSize: 14.5, color: C.text }}>{q}</span>
                </div>
              ))}
            </Card>
          </div>
        </Page>
        <Cursor moves={[{ at: 215, x: 700, y: 420 }]} hide={frame < 226} />
      </Stage>
    );
  }

  return (
    <Stage url="refcheck.ai/checks/new">
      <WizardShell
        step={2}
        primary={
          <>
            Continue <ChevronRight size={15} />
          </>
        }
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>Question template</h2>
        <p style={{ fontSize: 14, color: C.secondary, margin: "0 0 18px" }}>
          Choose the question set CALL-E will use. Templates are role-optimised.
        </p>
        {TEMPLATES.map((t, i) => (
          <TemplateCard key={t.name} t={t} selected={i === selected} />
        ))}
      </WizardShell>

      {/* clicking Engineering at f152 moves the selected state */}
      <ChangeBox frame={frame} at={152} x={310} y={322} w={848} h={84} tone="blue"
                 label="Template selected" />

      <Cursor
        moves={[
          { at: 0, x: 1082, y: 694 },
          { at: 40, x: 620, y: 285 },
          { at: 120, x: 660, y: 367 },
        ]}
        clicks={[152]}
      />
    </Stage>
  );
};

/* ══════════════ Step 4 — review & launch ══════════════ */

export const WizardLaunch: React.FC = () => {
  const frame = useCurrentFrame();
  const launching = frame >= 92;

  const SummaryBlock: React.FC<{ label: string; children: React.ReactNode }> = ({
    label,
    children,
  }) => (
    <div
      style={{
        padding: "14px 16px",
        background: C.fill4,
        borderRadius: 12,
        marginBottom: 12,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: C.tertiary,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );

  return (
    <Stage url="refcheck.ai/checks/new">
      <WizardShell
        step={3}
        primaryWide
        primaryHover={frame >= 74 && frame < 92}
        primary={
          launching ? (
            <>
              <span
                style={{
                  width: 15,
                  height: 15,
                  border: "2px solid rgba(255,255,255,0.35)",
                  borderTopColor: "#fff",
                  borderRadius: "50%",
                  display: "inline-block",
                  transform: `rotate(${(frame - 92) * 16}deg)`,
                }}
              />
              Launching…
            </>
          ) : (
            <>
              <Rocket size={15} /> Launch Reference Checks
            </>
          )
        }
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, margin: "0 0 16px" }}>Review &amp; launch</h2>

        <SummaryBlock label="Candidate">
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Maria Chen</div>
          <div style={{ fontSize: 14, color: C.secondary }}>
            Senior Software Engineer · Acme Corp
          </div>
        </SummaryBlock>

        <SummaryBlock label="3 References">
          {REFS.map((r, i) => (
            <div
              key={r.n}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: i < 2 ? 8 : 0,
              }}
            >
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: C.border2,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: C.secondary,
                }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{r.n}</span>
              <span style={{ fontSize: 13, color: C.secondary }}>· {r.r}</span>
              <span style={{ marginLeft: "auto", fontSize: 13, color: C.tertiary }}>{r.p}</span>
            </div>
          ))}
        </SummaryBlock>

        <SummaryBlock label="Template">
          <div style={{ fontSize: 15, fontWeight: 600, color: C.text }}>
            Engineering · 11 questions
          </div>
        </SummaryBlock>
      </WizardShell>

      {/* clicking Launch at f90 flips the button into its launching state */}
      <ChangeBox frame={frame} at={92} x={990} y={672} w={176} h={52} tone="amber"
                 radius={999} label="Calls dispatching" />

      <Cursor
        moves={[
          { at: 0, x: 660, y: 367 },
          { at: 34, x: 1015, y: 694 },
        ]}
        clicks={[90]}
      />
    </Stage>
  );
};
