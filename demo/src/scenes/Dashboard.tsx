import React from "react";
import { useCurrentFrame } from "remotion";
import { Plus, Phone, CheckCircle, Clock, TrendingUp, ChevronRight } from "lucide-react";
import { Stage } from "../ui/Stage";
import { Page, Card, ScoreRing, RecBadge, BtnPrimary, Spotlight } from "../ui/App";
import { Cursor } from "../ui/Cursor";
import { C } from "../theme";
import { ramp } from "../anim";
import { DASHBOARD_ROWS } from "../data";

const STATUS = { label: "Complete", color: C.green };

const StatCard: React.FC<{
  label: string;
  value: string | number;
  Icon: React.ElementType;
  color: string;
}> = ({ label, value, Icon, color }) => (
  <Card sm style={{ padding: "18px 20px", flex: 1 }}>
    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, letterSpacing: "-0.5px" }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: C.secondary, marginTop: 2 }}>{label}</div>
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 10,
          background: `${color}18`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={18} color={color} />
      </div>
    </div>
  </Card>
);

const Row: React.FC<{ r: (typeof DASHBOARD_ROWS)[number] }> = ({ r }) => (
  <Card style={{ padding: "20px 24px", display: "flex", alignItems: "center", gap: 20 }}>
    <div style={{ flexShrink: 0 }}>
      <ScoreRing score={r.score} size={72} strokeWidth={6} sublabel="/10" />
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 3 }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{r.name}</span>
        <RecBadge rec={r.rec} size="sm" />
      </div>
      <div style={{ fontSize: 14, color: C.secondary, marginBottom: 8 }}>
        {r.role} · {r.company}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: STATUS.color,
              display: "inline-block",
            }}
          />
          <span style={{ fontSize: 12, color: STATUS.color, fontWeight: 600 }}>
            {STATUS.label}
          </span>
        </span>
        <span style={{ fontSize: 12, color: C.tertiary }}>{r.refs}</span>
        <span style={{ fontSize: 12, color: C.tertiary }}>{r.when}</span>
      </div>
    </div>
    <ChevronRight size={18} color={C.tertiary} />
  </Card>
);

export const Dashboard: React.FC = () => {
  const frame = useCurrentFrame();

  const spot = ramp(frame, 168, 186, 0, 1) * ramp(frame, 224, 240, 1, 0);
  const btnHover = frame >= 262 && frame < 300;

  return (
    <Stage url="refcheck.ai/dashboard">
      <Page active="/dashboard">
        {/* header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            marginBottom: 28,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: C.text,
                letterSpacing: "-0.3px",
                margin: 0,
              }}
            >
              Dashboard
            </h1>
            <p style={{ fontSize: 15, color: C.secondary, margin: "4px 0 0" }}>
              4 candidates tracked
            </p>
          </div>
          <BtnPrimary hover={btnHover}>
            <Plus size={16} />
            New Check
          </BtnPrimary>
        </div>

        {/* stats */}
        <div style={{ display: "flex", gap: 12, marginBottom: 26 }}>
          <StatCard label="Total candidates" value={4} Icon={Phone} color={C.blue} />
          <StatCard label="In progress" value={0} Icon={Clock} color={C.orange} />
          <StatCard label="Completed" value={4} Icon={CheckCircle} color={C.green} />
          <StatCard label="Avg score" value="7.3" Icon={TrendingUp} color={C.purple} />
        </div>

        {/* filter tabs */}
        <div
          style={{
            display: "flex",
            gap: 2,
            background: C.fill3,
            borderRadius: 10,
            padding: 3,
            width: "fit-content",
            marginBottom: 18,
          }}
        >
          {["All", "In Progress", "Complete"].map((t, i) => (
            <div
              key={t}
              style={{
                padding: "7px 16px",
                borderRadius: 8,
                fontSize: 14,
                fontWeight: i === 0 ? 600 : 500,
                color: i === 0 ? C.text : C.secondary,
                background: i === 0 ? C.surface : "transparent",
                boxShadow: i === 0 ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
              }}
            >
              {t}
            </div>
          ))}
        </div>

        {/* list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {DASHBOARD_ROWS.map((r) => (
            <Row key={r.name} r={r} />
          ))}
        </div>
      </Page>

      {/* spotlight the amber ring */}
      <Spotlight x={304} y={404} w={80} h={80} opacity={spot} />

      <Cursor
        moves={[
          { at: 0, x: 720, y: 610 },
          { at: 84, x: 470, y: 470 },
          { at: 168, x: 356, y: 452 },
          { at: 244, x: 1102, y: 52 },
        ]}
        clicks={[272]}
      />
    </Stage>
  );
};
