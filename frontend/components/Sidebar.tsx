"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Phone, LayoutDashboard, ListChecks, LogOut, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase";
import { useEffect, useState } from "react";
import { isAdmin } from "@/lib/polar";

const NAV = [
  { href: "/dashboard",  label: "Dashboard",  Icon: LayoutDashboard },
  { href: "/checks/new", label: "New Check",  Icon: Phone },
  { href: "/templates",  label: "Templates",  Icon: ListChecks },
];

export default function Sidebar() {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    const sb = createClient();
    sb.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? "";
      setEmail(e);
      setAdmin(isAdmin(e));
    });
  }, []);

  async function signOut() {
    const sb = createClient();
    await sb.auth.signOut();
    router.push("/login");
  }

  return (
    <aside
      style={{
        position: "fixed", top: 0, left: 0, bottom: 0,
        width: "240px",
        background: "rgba(255,255,255,0.85)",
        backdropFilter: "blur(20px) saturate(180%)",
        WebkitBackdropFilter: "blur(20px) saturate(180%)",
        borderRight: "1px solid #D2D2D7",
        display: "flex", flexDirection: "column",
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ padding: "24px 20px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "32px", height: "32px",
              background: "linear-gradient(135deg, #0071E3, #0056B0)",
              borderRadius: "8px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Phone size={16} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: "15px", fontWeight: 700, color: "#1D1D1F", lineHeight: 1.2 }}>
              RefCheck AI
            </div>
            {admin && (
              <div style={{
                fontSize: "10px", fontWeight: 700, color: "#0071E3",
                textTransform: "uppercase", letterSpacing: "0.06em",
              }}>
                Admin
              </div>
            )}
          </div>
        </div>
      </div>

      <div style={{ height: "1px", background: "#E5E5EA", margin: "0 20px" }} />

      {/* Nav */}
      <nav style={{ flex: 1, padding: "12px 12px 0" }}>
        {NAV.map(({ href, label, Icon }) => {
          const active = path === href || (href !== "/dashboard" && path.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "9px 12px",
                borderRadius: "10px",
                fontSize: "14px", fontWeight: active ? 600 : 400,
                color: active ? "#0071E3" : "#1D1D1F",
                background: active ? "rgba(0,113,227,0.08)" : "transparent",
                textDecoration: "none",
                marginBottom: "2px",
                transition: "background 0.15s",
              }}
            >
              <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: "12px", borderTop: "1px solid #E5E5EA" }}>
        {email && (
          <div style={{
            fontSize: "12px", color: "#6E6E73",
            padding: "8px 12px",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {email}
          </div>
        )}
        <button
          onClick={signOut}
          style={{
            display: "flex", alignItems: "center", gap: "10px",
            width: "100%", padding: "9px 12px",
            background: "transparent", border: "none", cursor: "pointer",
            borderRadius: "10px", color: "#6E6E73", fontSize: "14px",
            transition: "background 0.15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#F5F5F7")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
