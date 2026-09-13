/** Fixture data for the demo, shaped exactly like frontend/lib/types.ts. */

export const CANDIDATE = {
  name: "Maria Chen",
  role: "Senior Software Engineer",
  company: "Acme Corp",
  jd: "Owns the payments platform. Needs strong systems design, code review, and cross-team communication.",
  overall_score: 8.7,
  recommendation: "strong_yes",
};

export const REFERENCES = [
  {
    referee_name: "James Okafor",
    referee_phone: "+1 (415) 555-0142",
    relationship: "Former direct manager",
    company_at_time: "Stripe",
    score: 9.1,
    enthusiasm: "very_enthusiastic",
    would_rehire: true,
    duration: "11:24",
    strengths: [
      "Owned the payments migration end-to-end",
      "Unusually strong code review culture",
      "Mentored two juniors to mid-level",
    ],
    red_flags: [],
    quote:
      "If I were starting a team tomorrow, Maria is the first call I make. No hesitation.",
    answers: [
      ["Working Relationship", 5],
      ["Responsibilities", 5],
      ["Key Strengths", 5],
      ["Areas for Growth", 4],
      ["Notable Achievement", 5],
      ["Under Pressure", 5],
      ["Collaboration", 4],
      ["Would Rehire", 5],
      ["Role Fit", 5],
    ] as [string, number][],
  },
  {
    referee_name: "Priya Raman",
    referee_phone: "+1 (206) 555-0188",
    relationship: "Cross-functional peer (Product)",
    company_at_time: "Stripe",
    score: 8.4,
    enthusiasm: "positive",
    would_rehire: true,
    duration: "9:47",
    strengths: [
      "Translates technical trade-offs for non-engineers",
      "Reliable on delivery dates",
    ],
    red_flags: ["Can over-invest in refactors when timelines are tight"],
    quote:
      "She'll tell you the honest estimate, not the one you want to hear. That's rarer than it sounds.",
    answers: [
      ["Working Relationship", 4],
      ["Responsibilities", 4],
      ["Key Strengths", 5],
      ["Areas for Growth", 3],
      ["Notable Achievement", 4],
      ["Under Pressure", 4],
      ["Collaboration", 5],
      ["Would Rehire", 5],
      ["Role Fit", 4],
    ] as [string, number][],
  },
  {
    referee_name: "Daniel Weiss",
    referee_phone: "+1 (312) 555-0107",
    relationship: "Skip-level manager",
    company_at_time: "Shopify",
    score: 8.6,
    enthusiasm: "positive",
    would_rehire: true,
    duration: "8:12",
    strengths: ["Calm in incidents", "Raises risks early"],
    red_flags: [],
    quote: "Two production incidents, both handled without drama. That's the whole review.",
    answers: [
      ["Working Relationship", 4],
      ["Responsibilities", 4],
      ["Key Strengths", 5],
      ["Areas for Growth", 4],
      ["Notable Achievement", 4],
      ["Under Pressure", 5],
      ["Collaboration", 4],
      ["Would Rehire", 5],
      ["Role Fit", 4],
    ] as [string, number][],
  },
];

export const DASHBOARD_ROWS = [
  {
    name: "Priya Sharma",
    role: "Product Designer",
    company: "Northwind",
    score: 8.9,
    rec: "strong_yes",
    status: "complete",
    refs: "3/3 refs complete",
    when: "2 days ago",
  },
  {
    name: "Tom Alvarez",
    role: "Account Executive",
    company: "Northwind",
    score: 6.2,
    rec: "neutral",
    status: "complete",
    refs: "2/2 refs complete",
    when: "4 days ago",
  },
  {
    name: "Aisha Bello",
    role: "Engineering Manager",
    company: "Northwind",
    score: 9.2,
    rec: "strong_yes",
    status: "complete",
    refs: "3/3 refs complete",
    when: "6 days ago",
  },
  {
    name: "Kevin Osei",
    role: "Data Analyst",
    company: "Northwind",
    score: 4.8,
    rec: "no",
    status: "complete",
    refs: "2/2 refs complete",
    when: "1 week ago",
  },
];

export const TEMPLATES = [
  {
    name: "Standard (9 questions)",
    desc: "Balanced reference check for any role. Relationship, strengths, growth, rehire, fit.",
    count: 9,
    system: true,
  },
  {
    name: "Engineering",
    desc: "Adds technical depth, code quality, problem solving and learning agility.",
    count: 11,
    system: true,
  },
  {
    name: "Sales",
    desc: "Quota attainment, customer relations, handling objections, coachability.",
    count: 10,
    system: true,
  },
  {
    name: "Leadership",
    desc: "Team building, decision making, strategic thinking, conflict management.",
    count: 11,
    system: true,
  },
];

/** Transcript beats shown while the CALL-E call runs. */
export const CALL_BEATS: { who: "bot" | "user"; text: string; at: number }[] = [
  {
    who: "bot",
    text: "Hi, this is Alex calling from Northwind's recruiting team. Is this James Okafor?",
    at: 0,
  },
  { who: "user", text: "Speaking — yes, this is about Maria?", at: 46 },
  {
    who: "bot",
    text: "It is. She listed you as a reference and has given us permission to call. Do you have about ten minutes?",
    at: 92,
  },
  { who: "user", text: "Sure, go ahead.", at: 152 },
  {
    who: "bot",
    text: "Great. Would you hire Maria again if you had the opportunity?",
    at: 190,
  },
  {
    who: "user",
    text: "Absolutely. If I were starting a team tomorrow, she's the first call I make.",
    at: 240,
  },
  {
    who: "bot",
    text: "That's a strong endorsement — can you tell me more about what earns it?",
    at: 300,
  },
];

export const RESULT_SCHEMA_LINES = [
  { t: "call = client.calls.create(", c: "code" },
  { t: '    task=build_reference_task(reference, candidate),', c: "code" },
  { t: '    recipients=[{"phones": [ref["referee_phone"]]}],', c: "code" },
  { t: "    result_schema=REFERENCE_SCHEMA,", c: "code" },
  { t: '    webhook_url=f"{API_URL}/api/calle/webhook",', c: "code" },
  { t: '    metadata={"reference_id": ref["id"]},', c: "code" },
  { t: "    idempotency_key=f\"ref_{ref['id']}\",", c: "code" },
  { t: ")", c: "code" },
];

export const STRUCTURED_RESULT = [
  '{',
  '  "spoke_with_referee": "yes",',
  '  "would_rehire": "yes",',
  '  "referee_enthusiasm": "very_enthusiastic",',
  '  "strengths": [',
  '    "Owned the payments migration end-to-end",',
  '    "Unusually strong code review culture"',
  '  ],',
  '  "red_flags": [],',
  '  "notable_quote": "If I were starting a team',
  '     tomorrow, Maria is the first call I make.",',
  '  "overall_reference_score": 9.1',
  '}',
];
