/** Fixtures for the walkthrough, shaped like frontend/lib/types.ts. */
import results from "./results.json";
import type { CandidateRow, RefData } from "./ui";

export const RECRUITER = { email: "sarah@northwind.io", company: "Northwind" };

export const CANDIDATE = {
  name: "Maria Chen",
  role: "Senior Software Engineer",
  company: "Northwind",
  jd: "Owns our payments platform: systems design, code review and incident response.",
  overall: results.overall_score as number,
  rec: results.recommendation as string,
};

/** What the recruiter types in step 2. */
export const REF_INPUTS = [
  { name: "James Okafor", phone: "+14155550142", rel: "Former direct manager", co: "Tidewater Payments" },
  { name: "Priya Raman", phone: "+12065550188", rel: "Product manager, peer", co: "Tidewater Payments" },
  { name: "Daniel Weiss", phone: "+13125550107", rel: "Skip-level manager", co: "Harbor Commerce" },
];

type ResultRef = (typeof results.references)[number];

/** Completed references exactly as the backend scored them (scripts/make_results_v2.py). */
export const REFS: RefData[] = results.references.map((r: ResultRef) => ({
  key: r.key,
  referee_name: r.referee_name,
  relationship: r.relationship,
  company_at_time: r.company_at_time,
  call_status: "completed",
  overall_reference_score: r.overall_reference_score,
  would_rehire: r.would_rehire as boolean | null,
  referee_enthusiasm: r.referee_enthusiasm,
  summary: r.summary,
  strengths: r.strengths,
  red_flags: r.red_flags,
  notable_quotes: r.notable_quotes,
  answers: r.answers as RefData["answers"],
  transcript: r.transcript,
}));

/** The same references before any call has come back. */
export const refPending = (status: RefData["call_status"]): RefData[] =>
  REFS.map((r) => ({
    key: r.key,
    referee_name: r.referee_name,
    relationship: r.relationship,
    company_at_time: r.company_at_time,
    call_status: status,
  }));

export const DASHBOARD: CandidateRow[] = [
  { id: "c1", name: "Liam Foster", role: "Product Designer", company: "Northwind", score: null, rec: null, status: "in_progress", when: "about 1 hour ago" },
  { id: "c2", name: "Aisha Bello", role: "Engineering Manager", company: "Northwind", score: 9.2, rec: "strong_yes", status: "complete", when: "2 days ago" },
  { id: "c3", name: "Tom Alvarez", role: "Account Executive", company: "Northwind", score: 6.2, rec: "neutral", status: "complete", when: "4 days ago" },
  { id: "c4", name: "Kevin Osei", role: "Data Analyst", company: "Northwind", score: 4.8, rec: "no", status: "complete", when: "8 days ago" },
];

/** System templates, as seeded by supabase/migrations/001_initial.sql. */
export const TEMPLATES = [
  {
    id: "standard",
    name: "Standard",
    description: "General-purpose reference check for most roles",
    is_default: true,
    questions: 9,
  },
  {
    id: "swe",
    name: "Software Engineer",
    description: "Technical reference check for engineering roles",
    is_default: false,
    questions: 9,
  },
  {
    id: "sales",
    name: "Sales",
    description: "Reference check optimized for sales and business development roles",
    is_default: false,
    questions: 9,
  },
  {
    id: "leadership",
    name: "Leadership",
    description: "Reference check for manager and director-level candidates",
    is_default: false,
    questions: 9,
  },
];

/** Software Engineer questions + follow-up probes, verbatim from the seed. */
export const SWE_QUESTIONS: { text: string; follow_up?: string }[] = [
  { text: "Can you describe your working relationship with {candidate_name} and how long you worked together?" },
  {
    text: "How would you describe {candidate_name}'s technical abilities? What technologies did they work with?",
    follow_up: "Can you give a specific example of their best technical work?",
  },
  { text: "Can you describe a difficult technical problem {candidate_name} solved? How did they approach it?" },
  { text: "How would you describe {candidate_name}'s code quality and engineering practices?" },
  { text: "How did {candidate_name} collaborate with non-technical teammates?" },
  { text: "How quickly did {candidate_name} pick up new technologies or frameworks?" },
  { text: "How did {candidate_name} handle tight deadlines or production incidents?" },
  {
    text: "Would you hire {candidate_name} again for an engineering role?",
    follow_up: "What would be the main reason?",
  },
  { text: "We are considering {candidate_name} for a {role} role involving {jd_summary}. How do you think they would perform?" },
];

export const SHARE_URL = "refcheck.ai/shared/7f3c9a2e-41d8-4b6e-9d0a-2c5e8b1f6a47";
