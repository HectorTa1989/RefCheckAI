/**
 * Polar.sh access control — with admin bypass.
 *
 * Any account whose email matches NEXT_PUBLIC_ADMIN_EMAIL gets full access
 * to all paid features regardless of Polar subscription status.
 * This lets the repo owner (HectorTa1989) use every feature for free.
 */

const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL ?? "";
const POLAR_ORG   = process.env.NEXT_PUBLIC_POLAR_ORG  ?? "";

export type Plan = "free" | "pro" | "team";

export interface AccessResult {
  isAdmin:    boolean;
  plan:       Plan;
  canCheck:   boolean;   // Can run reference checks
  maxChecks:  number;    // -1 = unlimited
  canCustomTemplates: boolean;
  canShareReport:     boolean;
  canBulkExport:      boolean;
}

/** True if the signed-in user is the admin account. */
export function isAdmin(email: string | null | undefined): boolean {
  return !!email && !!ADMIN_EMAIL && email === ADMIN_EMAIL;
}

/** Full access object — admin overrides everything. */
export function resolveAccess(email: string | null | undefined, dbPlan: Plan = "free"): AccessResult {
  if (isAdmin(email)) {
    return {
      isAdmin: true,
      plan: "team",
      canCheck: true,
      maxChecks: -1,
      canCustomTemplates: true,
      canShareReport: true,
      canBulkExport: true,
    };
  }

  const planMap: Record<Plan, Omit<AccessResult, "isAdmin">> = {
    free: {
      plan: "free",
      canCheck: true,
      maxChecks: 3,
      canCustomTemplates: false,
      canShareReport: false,
      canBulkExport: false,
    },
    pro: {
      plan: "pro",
      canCheck: true,
      maxChecks: 50,
      canCustomTemplates: true,
      canShareReport: true,
      canBulkExport: false,
    },
    team: {
      plan: "team",
      canCheck: true,
      maxChecks: -1,
      canCustomTemplates: true,
      canShareReport: true,
      canBulkExport: true,
    },
  };

  return { isAdmin: false, ...planMap[dbPlan] };
}

/** Build the Polar.sh checkout URL for a given product slug. */
export function polarCheckoutUrl(productSlug: string, email?: string): string {
  const base = `https://polar.sh/${POLAR_ORG}/${productSlug}`;
  return email ? `${base}?email=${encodeURIComponent(email)}` : base;
}

export const POLAR_PLANS = {
  pro: {
    slug: "refcheck-pro",
    name: "Pro",
    price: "$29 / mo",
    features: ["50 checks / month", "Custom templates", "Shareable PDF reports", "Priority support"],
  },
  team: {
    slug: "refcheck-team",
    name: "Team",
    price: "$99 / mo",
    features: ["Unlimited checks", "All Pro features", "Bulk CSV export", "Team members (5 seats)", "Dedicated support"],
  },
} as const;
