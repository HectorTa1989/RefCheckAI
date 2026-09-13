const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function apiFetch<T>(
  path: string,
  userId: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-User-Id": userId,
      ...(options.headers ?? {}),
    },
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => res.statusText);
    throw new Error(msg || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Candidates ───────────────────────────────────────────────────────────────

export const api = {
  candidates: {
    list: (uid: string) =>
      apiFetch<import("./types").Candidate[]>("/api/candidates", uid),
    get: (uid: string, id: string) =>
      apiFetch<import("./types").CandidateWithRefs>(`/api/candidates/${id}`, uid),
    create: (uid: string, body: object) =>
      apiFetch<import("./types").Candidate>("/api/candidates", uid, {
        method: "POST", body: JSON.stringify(body),
      }),
    update: (uid: string, id: string, body: object) =>
      apiFetch<import("./types").Candidate>(`/api/candidates/${id}`, uid, {
        method: "PATCH", body: JSON.stringify(body),
      }),
    delete: (uid: string, id: string) =>
      apiFetch<void>(`/api/candidates/${id}`, uid, { method: "DELETE" }),
    start: (uid: string, id: string) =>
      apiFetch<{ status: string }>(`/api/candidates/${id}/start`, uid, { method: "POST" }),
    /** Pull finished calls from CALL-E — how results land when no webhook can reach the API. */
    sync: (uid: string, id: string) =>
      apiFetch<{ updated: string[]; pending: string[]; errors: string[]; finalized: boolean }>(
        `/api/candidates/${id}/sync`, uid, { method: "POST" }
      ),
    toggleShare: (uid: string, id: string) =>
      apiFetch<{ share_enabled: boolean; share_url: string }>(`/api/candidates/${id}/share`, uid, { method: "POST" }),
  },
  references: {
    add: (uid: string, candidateId: string, body: object) =>
      apiFetch<import("./types").Reference>(`/api/references/${candidateId}`, uid, {
        method: "POST", body: JSON.stringify(body),
      }),
    delete: (uid: string, refId: string) =>
      apiFetch<void>(`/api/references/${refId}`, uid, { method: "DELETE" }),
  },
  templates: {
    list: (uid: string) =>
      apiFetch<import("./types").QuestionTemplate[]>("/api/templates", uid),
    create: (uid: string, body: object) =>
      apiFetch<import("./types").QuestionTemplate>("/api/templates", uid, {
        method: "POST", body: JSON.stringify(body),
      }),
    delete: (uid: string, id: string) =>
      apiFetch<void>(`/api/templates/${id}`, uid, { method: "DELETE" }),
  },
  shared: {
    get: async (token: string) => {
      const res = await fetch(`${API}/api/shared/${token}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return res.json() as Promise<import("./types").SharedReport>;
    },
    pdfUrl: (token: string) => `${API}/api/shared/${token}/pdf`,
  },
  reports: {
    pdfUrl: (candidateId: string, userId?: string) =>
      `${API}/api/reports/${candidateId}/pdf${userId ? `?user_id=${userId}` : ""}`,
  },
};
