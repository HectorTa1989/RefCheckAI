import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

const WEBHOOK_SECRET  = process.env.POLAR_WEBHOOK_SECRET ?? "";
const SUPABASE_URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const ADMIN_EMAIL     = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";

// Supabase service role client (server-only)
function adminDb() {
  return createServerClient(SUPABASE_URL, SUPABASE_SA_KEY);
}

function planFromProduct(productName: string): string {
  const n = productName.toLowerCase();
  if (n.includes("team"))  return "team";
  if (n.includes("pro"))   return "pro";
  return "free";
}

export async function POST(req: NextRequest) {
  // Verify Polar.sh HMAC signature (simplified — use @polar-sh/sdk Webhooks in prod)
  const sig    = req.headers.get("webhook-signature") ?? "";
  const rawBody = await req.text();

  // Skip signature check in development
  const isDev = process.env.NODE_ENV === "development";
  if (!isDev && WEBHOOK_SECRET && !sig.includes(WEBHOOK_SECRET.slice(0, 8))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let event: Record<string, any>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const type = event.type ?? event.event ?? "";
  const db   = adminDb();

  if (type === "subscription.created" || type === "subscription.updated") {
    const sub       = event.data ?? event;
    const email     = sub.customer?.email ?? sub.email ?? "";
    const product   = sub.product?.name ?? "";
    const status    = sub.status ?? "active";

    // Admin email always gets "team" regardless of what Polar sends
    const plan = email === ADMIN_EMAIL
      ? "team"
      : status === "active" ? planFromProduct(product) : "free";

    await db
      .from("profiles")
      .update({ plan, polar_customer_id: sub.customer?.id ?? "" })
      .eq("email", email);

    return NextResponse.json({ ok: true, plan });
  }

  if (type === "subscription.canceled" || type === "subscription.revoked") {
    const sub   = event.data ?? event;
    const email = sub.customer?.email ?? "";
    if (email && email !== ADMIN_EMAIL) {
      await db.from("profiles").update({ plan: "free" }).eq("email", email);
    }
    return NextResponse.json({ ok: true });
  }

  // Ignore all other events
  return NextResponse.json({ ok: true, ignored: type });
}
