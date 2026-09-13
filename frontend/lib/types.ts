export type CandidateStatus = "draft" | "pending" | "in_progress" | "complete" | "cancelled";
export type RecommendationType = "strong_yes" | "yes" | "neutral" | "no" | "strong_no";
export type CallStatus = "queued" | "calling" | "completed" | "failed" | "no_answer" | "declined";
export type EnthusiasmLevel = "very_enthusiastic" | "positive" | "neutral" | "hesitant" | "negative";

export interface Candidate {
  id: string;
  recruiter_id: string;
  name: string;
  email?: string;
  role_applied_for: string;
  company_name: string;
  job_description_summary?: string;
  template_id?: string;
  status: CandidateStatus;
  overall_score?: number;
  recommendation?: RecommendationType;
  share_token?: string;
  share_enabled: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Reference {
  id: string;
  candidate_id: string;
  referee_name: string;
  referee_phone: string;
  referee_email?: string;
  relationship: string;
  company_at_time?: string;
  call_status: CallStatus;
  calle_call_sid?: string;
  transcript?: string;
  /** `score` is 1-5, or null when the referee did not answer that question. */
  answers?: Record<string, { text: string; score: number | null }>;
  red_flags?: string[];
  strengths?: string[];
  notable_quotes?: string[];
  referee_enthusiasm?: EnthusiasmLevel;
  overall_reference_score?: number;
  would_rehire?: boolean;
  call_duration_seconds?: number;
  call_outcome?: string;
  spoke_with_referee?: boolean;
  summary?: string;
  completed_at?: string;
  created_at: string;
}

/** Public share view. Referee phone/email and the recruiter id are never sent. */
export interface SharedReport {
  id: string;
  name: string;
  role_applied_for: string;
  company_name: string;
  status: CandidateStatus;
  overall_score?: number;
  recommendation?: RecommendationType;
  completed_at?: string;
  created_at: string;
  references: Reference[];
}

export interface QuestionTemplate {
  id: string;
  recruiter_id?: string;
  name: string;
  description?: string;
  questions: Question[];
  is_default: boolean;
  is_system: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  text: string;
  type: "open" | "boolean";
  follow_up?: string;
}

export interface CandidateWithRefs extends Candidate {
  references: Reference[];
  template?: QuestionTemplate;
}

export const RECOMMENDATION_CONFIG: Record<RecommendationType, { label: string; color: string; bg: string }> = {
  strong_yes: { label: "Strong Yes",  color: "#34C759", bg: "#E8F9EE" },
  yes:        { label: "Yes",         color: "#34C759", bg: "#E8F9EE" },
  neutral:    { label: "Neutral",     color: "#FF9F0A", bg: "#FFF4E5" },
  no:         { label: "No",          color: "#FF3B30", bg: "#FEE8E8" },
  strong_no:  { label: "Strong No",   color: "#FF3B30", bg: "#FEE8E8" },
};

export const CALL_STATUS_CONFIG: Record<CallStatus, { label: string; color: string; dot: string }> = {
  queued:    { label: "Queued",     color: "#6E6E73", dot: "bg-apple-secondary" },
  calling:   { label: "In Progress", color: "#0071E3", dot: "bg-apple-blue" },
  completed: { label: "Completed",  color: "#34C759", dot: "bg-apple-green" },
  failed:    { label: "Failed",     color: "#FF3B30", dot: "bg-apple-red" },
  no_answer: { label: "No Answer",  color: "#FF9F0A", dot: "bg-apple-orange" },
  declined:  { label: "Declined",   color: "#AEAEB2", dot: "bg-apple-tertiary" },
};

export const ENTHUSIASM_CONFIG: Record<EnthusiasmLevel, { label: string; stars: number }> = {
  very_enthusiastic: { label: "Very Enthusiastic", stars: 5 },
  positive:          { label: "Positive",           stars: 4 },
  neutral:           { label: "Neutral",            stars: 3 },
  hesitant:          { label: "Hesitant",           stars: 2 },
  negative:          { label: "Negative",           stars: 1 },
};

export const QUESTION_LABELS: Record<string, string> = {
  q_relationship:    "Working Relationship",
  q_role:            "Responsibilities",
  q_strengths:       "Key Strengths",
  q_areas_for_growth: "Areas for Growth",
  q_achievement:     "Notable Achievement",
  q_under_pressure:  "Under Pressure",
  q_collaboration:   "Collaboration",
  q_rehire:          "Would Rehire",
  q_fit:             "Role Fit",
  q_technical:       "Technical Ability",
  q_problem_solving: "Problem Solving",
  q_code_quality:    "Code Quality",
  q_learning:        "Learning Agility",
  q_quota:           "Quota Attainment",
  q_customer:        "Customer Relations",
  q_objections:      "Handling Objections",
  q_coachability:    "Coachability",
  q_team_building:   "Team Building",
  q_decision_making: "Decision Making",
  q_strategic:       "Strategic Thinking",
  q_conflict:        "Conflict Management",
};
