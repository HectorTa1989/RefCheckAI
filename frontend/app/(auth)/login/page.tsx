"use client";
import { useState } from "react";
import { createClient } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Phone } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/dashboard` },
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F5F5F7",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "400px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "60px", height: "60px",
              background: "linear-gradient(135deg, #0071E3 0%, #0056B0 100%)",
              borderRadius: "16px",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
              boxShadow: "0 4px 16px rgba(0,113,227,0.3)",
            }}
          >
            <Phone size={28} color="#fff" />
          </div>
          <h1
            style={{
              fontSize: "28px", fontWeight: 700, color: "#1D1D1F",
              letterSpacing: "-0.3px", margin: "0 0 6px",
            }}
          >
            RefCheck AI
          </h1>
          <p style={{ fontSize: "15px", color: "#6E6E73", margin: 0 }}>
            Automated reference verification
          </p>
        </div>

        {/* Card */}
        <div
          style={{
            background: "#fff",
            borderRadius: "18px",
            padding: "32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08), 0 0 1px rgba(0,0,0,0.04)",
          }}
        >
          {sent ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>✉️</div>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 8px" }}>
                Check your email
              </h2>
              <p style={{ fontSize: "15px", color: "#6E6E73", margin: "0 0 20px" }}>
                We sent a sign-in link to <strong>{email}</strong>
              </p>
              <button
                className="btn-ghost"
                onClick={() => { setSent(false); setEmail(""); }}
                style={{ margin: "0 auto" }}
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleMagicLink}>
              <h2 style={{ fontSize: "20px", fontWeight: 700, margin: "0 0 6px" }}>
                Sign in
              </h2>
              <p style={{ fontSize: "14px", color: "#6E6E73", margin: "0 0 24px" }}>
                We'll send a magic link to your email.
              </p>

              <label className="label" htmlFor="email">Work email</label>
              <input
                id="email"
                className="apple-input"
                type="email"
                required
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginBottom: "20px" }}
              />

              <button
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ width: "100%", justifyContent: "center" }}
              >
                {loading ? (
                  <>
                    <span className="spinner" style={{ width: 16, height: 16 }} />
                    Sending…
                  </>
                ) : "Continue with email"}
              </button>
            </form>
          )}
        </div>

        <p style={{ textAlign: "center", fontSize: "13px", color: "#AEAEB2", marginTop: "20px" }}>
          By signing in you agree to our Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
