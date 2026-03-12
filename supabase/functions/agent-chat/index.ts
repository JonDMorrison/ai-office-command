import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── CORS ───────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── SKILL MAPPING ──────────────────────────────────────────────────────────
const AGENT_SKILLS: Record<string, string[]> = {
  bloomsuite: ["joncoach-core", "bloomsuite-agent", "bloomsuite-copywriting", "brainstorming", "frontend-design"],
  clinicleader: ["joncoach-core", "clinicleader-agent", "internal-comms", "brainstorming"],
  projectpath: ["joncoach-core", "projectpath-agent", "supabase-best-practices", "nextjs-best-practices"],
  disc: ["joncoach-core", "disc-agent", "frontend-design", "supabase-best-practices"],
  inbox: ["joncoach-core", "inbox-agent", "internal-comms"],
};

// ─── COMPANY CONTEXT ────────────────────────────────────────────────────────
const COMPANY_CONTEXT: Record<string, string> = {
  bloomsuite: "BloomSuite — a marketing platform and lead-generation audit tool for garden centres. The primary product is BloomSuite Marketing Snap (free 5-minute marketing audit) and the BloomSuite App (full marketing command center with content creation, newsletters, campaigns, social management, and CRM). Target audience: garden centre owners and marketing managers.",
  clinicleader: "ClinicLeader — a leadership operating system for clinics. The primary product is ClinicStructure Score (free operational maturity diagnostic) and the ClinicLeader App (weekly metrics, scorecard, rocks, L10 meetings, issues tracking, VTO, reports, AI copilot). Target audience: clinic owners, directors, and operations managers.",
  projectpath: "ProjectPath — a construction operating system. Core features include project/task management, time tracking, safety forms, financial intelligence (estimates, invoicing, receipts, job costing), lookahead planning, deficiency management, change orders, daily logs, playbooks, and AI-powered Smart Memory. Target audience: construction companies and trades.",
  disc: "DISC Profile App — a team assessment and communication tool built on the DISC personality framework. Helps teams understand behavioral styles, improve communication, and build stronger collaboration. Target audience: team leaders, HR professionals, and coaches.",
  inbox: "Inbox Agent — Jon Morrison's unified email management system. Manages two Gmail accounts (jon@getclear.ca and jon@brandsinblooms.com). Responsible for triaging, summarizing, and drafting email responses across both accounts.",
};

// ─── ROLE RESPONSIBILITY (owns + does NOT own) ─────────────────────────────
const ROLE_RESPONSIBILITY: Record<string, string> = {
  bloomsuite: "**Owns:** All BloomSuite marketing, content strategy, lead generation, campaign creation, social media management, and garden centre business optimization. You are the marketing brain for BloomSuite.\n**Does NOT own:** ClinicLeader, ProjectPath, DISC, or Inbox operations. Do not attempt work outside the BloomSuite workspace.",
  clinicleader: "**Owns:** Everything for ClinicLeader as the founding agent — marketing, sales, support, product, and operations. Lead qualification from ClinicStructure Score assessments, product guidance, scorecard setup, and operational maturity consulting.\n**Does NOT own:** BloomSuite, ProjectPath, DISC, or Inbox operations. Do not attempt work outside the ClinicLeader workspace.",
  projectpath: "**Owns:** All ProjectPath product support, construction project management guidance, feature consultation, technical architecture, and construction industry advisory.\n**Does NOT own:** BloomSuite, ClinicLeader, DISC, or Inbox operations. Do not attempt work outside the ProjectPath workspace.",
  disc: "**Owns:** All DISC assessment creation, team report generation, behavioral analysis, communication coaching, and public content strategy for the DISC app.\n**Does NOT own:** BloomSuite, ClinicLeader, ProjectPath, or Inbox operations. Do not attempt work outside the DISC workspace.",
  inbox: "**Owns:** Email triage, prioritization, drafting replies, and inbox management across all of Jon's email accounts. You are the gatekeeper of Jon's communication.\n**Does NOT own:** Product-specific marketing, development, or strategy for BloomSuite, ClinicLeader, ProjectPath, or DISC. Route product-specific requests to the appropriate agent.",
};

// ─── OPERATIONAL RULES ──────────────────────────────────────────────────────
const OPERATIONAL_RULES = `## Operational Rules
- Perform internal analysis, research, and drafting automatically without asking permission.
- Do NOT claim actions were completed unless they actually were. If you drafted something, say "drafted" not "sent." If you suggest a task, say "suggested" not "created."
- Create tasks when work should be tracked — suggest them explicitly with a clear title and description.
- Create approval candidates for outbound emails and social drafts — never send or publish directly.
- Public-facing social content REQUIRES Jon's approval before publishing.
- Outbound email REQUIRES Jon's approval before sending. You may save drafts but must flag them for review.
- Be concise, structured, and action-oriented. Lead with the answer, then provide supporting detail.
- When work is complex, break it into discrete tasks or draft artifacts rather than walls of text.
- Prefer turning work into trackable outputs (tasks, drafts, approval items) over conversational promises.`;

// ─── OUTPUT GUIDANCE ────────────────────────────────────────────────────────
const OUTPUT_GUIDANCE = `## Structured Output

Write your conversational response naturally. Then, if your response involves any of the following, append a fenced JSON block at the VERY END:

- Work that should be tracked → \`suggested_tasks\`
- Outbound email or social content → \`suggested_approvals\`
- A preference, fact, or decision worth remembering → \`suggested_memories\`
- A market, product, or audience observation → \`insights\`

Format (only include arrays that have items):

\\\`\\\`\\\`json
{
  "suggested_tasks": [
    { "title": "Verb-led title ≤120 chars", "description": "Detail", "task_type": "content_draft|research|analysis|outreach|technical|general", "priority": 2 }
  ],
  "suggested_approvals": [
    { "approval_type": "social_post|email_draft|public_content", "title": "What Jon sees", "preview_text": "The full draft content", "platform": "linkedin" }
  ],
  "suggested_memories": [
    "Short declarative statement about a preference, fact, pattern, or decision"
  ],
  "insights": [
    "Observation about market, product, audience, or operations"
  ]
}
\\\`\\\`\\\`

Rules:
- The JSON block must be the LAST thing in your response.
- If the conversation is simple Q&A, do NOT append JSON.
- Tasks: verb-led, specific, actionable.
- Approvals: REQUIRED for any outbound email, social post, or public content. Include the full draft in preview_text.
- Memories: only for genuinely useful facts/preferences, not trivial details.
- When drafting emails, ALSO use the [DRAFT]...[/DRAFT] block format for Gmail integration.`;

// ─── PROMPT SCAFFOLD BUILDER ────────────────────────────────────────────────

interface ScaffoldInput {
  agentId: string;
  skillContent: string;
  inboxContext?: string;
  activeTasks?: string;
  pendingApprovals?: string;
  memories?: string;
  insights?: string;
}

function buildPromptScaffold(input: ScaffoldInput): string {
  const sections: string[] = [];
  const agentLabel = agentId_toLabel(input.agentId);
  const sectionNames: string[] = [];

  // A. Agent Identity
  sections.push(`## Agent Identity\nYou are the **${agentLabel}** agent working for **Jon Morrison**.`);
  sectionNames.push("A:Identity");

  // B. Workspace Context
  const companyCtx = COMPANY_CONTEXT[input.agentId];
  if (companyCtx) {
    sections.push(`## Workspace Context\n${companyCtx}`);
    sectionNames.push("B:Workspace");
  }

  // C. Responsibility Scope
  const roleResp = ROLE_RESPONSIBILITY[input.agentId];
  if (roleResp) {
    sections.push(`## Responsibility Scope\n${roleResp}`);
    sectionNames.push("C:Responsibility");
  }

  // D. Operational Rules
  sections.push(OPERATIONAL_RULES);
  sectionNames.push("D:Rules");

  // E. Current Date and Time
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Toronto",
  });
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "2-digit", minute: "2-digit", timeZone: "America/Toronto", hour12: true,
  });
  sections.push(`## Current Date & Time\n${dateStr} at ${timeStr} (Eastern)`);
  sectionNames.push("E:DateTime");

  // F. Active Tasks
  if (input.activeTasks && input.activeTasks.length > 0) {
    sections.push(`## Active Tasks\nThe following tasks are currently open for your role:\n\n${input.activeTasks}`);
    sectionNames.push("F:Tasks(populated)");
  } else {
    sections.push(`## Active Tasks\nNo active tasks currently assigned.`);
    sectionNames.push("F:Tasks(empty)");
  }

  // G. Pending Approvals
  if (input.pendingApprovals && input.pendingApprovals.length > 0) {
    sections.push(`## Pending Approvals\nThe following items are awaiting Jon's approval for your workspace:\n\n${input.pendingApprovals}`);
    sectionNames.push("G:Approvals(populated)");
  } else {
    sections.push(`## Pending Approvals\nNo items currently awaiting approval.`);
    sectionNames.push("G:Approvals(empty)");
  }

  // H. Relevant Memory
  if (input.memories && input.memories.length > 0) {
    sections.push(`## Relevant Memory\nThese are things you've learned from past conversations. Use them to personalize your responses and avoid asking Jon things he's already told you.\n\n${input.memories}`);
    sectionNames.push("H:Memory(populated)");
  } else {
    sections.push(`## Relevant Memory\nNo memories stored yet. As you learn Jon's preferences and decisions, they will appear here.`);
    sectionNames.push("H:Memory(empty)");
  }

  // H2. Relevant Insights
  if (input.insights && input.insights.length > 0) {
    sections.push(`## Relevant Insights\nObservations from past work that may inform your current response:\n\n${input.insights}`);
    sectionNames.push("H2:Insights(populated)");
  }

  // Inbox / Live Context (agent-specific, injected before skills)
  if (input.inboxContext) {
    sections.push(input.inboxContext);
    sectionNames.push("LiveContext:Inbox");
  }

  // I. Skill Modules
  if (input.skillContent) {
    sections.push(`## Skill Modules\n${input.skillContent}`);
    sectionNames.push("I:Skills");
  }

  // J. Output Guidance
  sections.push(OUTPUT_GUIDANCE);
  sectionNames.push("J:Output");

  const assembled = sections.join("\n\n---\n\n");

  // Debug logging
  console.log(`[prompt-scaffold] Agent: ${input.agentId}`);
  console.log(`[prompt-scaffold] Sections (${sectionNames.length}): ${sectionNames.join(" → ")}`);
  console.log(`[prompt-scaffold] Total length: ${assembled.length} chars`);

  return assembled;
}

function agentId_toLabel(agentId: string): string {
  const labels: Record<string, string> = {
    bloomsuite: "BloomSuite",
    clinicleader: "ClinicLeader",
    projectpath: "ProjectPath",
    disc: "DISC Profile",
    inbox: "Inbox",
  };
  return labels[agentId] || agentId;
}

// ─── GITHUB SKILL LOADER ───────────────────────────────────────────────────

async function fetchSkillContent(skillName: string, githubToken: string): Promise<string> {
  const url = `https://api.github.com/repos/JonDMorrison/JonCoach/contents/.claude/skills/${skillName}/SKILL.md`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  if (!res.ok) {
    console.error(`Failed to fetch skill ${skillName}: ${res.status}`);
    return `[Skill "${skillName}" could not be loaded]`;
  }
  return await res.text();
}

async function loadSkillModules(agentId: string, githubToken: string): Promise<string> {
  const skillNames = AGENT_SKILLS[agentId] || [];
  if (skillNames.length === 0) {
    console.warn(`[skills] No skills mapped for agentId: ${agentId}`);
    return "";
  }
  console.log(`[skills] Loading ${skillNames.length} skills for ${agentId}: ${skillNames.join(", ")}`);
  const contents = await Promise.all(skillNames.map(name => fetchSkillContent(name, githubToken)));
  return contents.join("\n\n---\n\n");
}

// ─── ACTIVE TASKS LOADER ───────────────────────────────────────────────────

async function loadActiveTasks(agentId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseKey) return "";

    const url = `${supabaseUrl}/rest/v1/tasks?agent_role=eq.${agentId}&status=in.(queued,in_progress,waiting_for_input)&order=created_at.desc&limit=10`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.error(`[tasks] Failed to fetch tasks: ${res.status}`);
      return "";
    }
    const tasks = await res.json();
    if (!tasks || tasks.length === 0) return "";

    console.log(`[tasks] Found ${tasks.length} active tasks for ${agentId}`);
    return tasks.map((t: any, i: number) => {
      const status = t.status || "unknown";
      const title = t.title || "Untitled";
      const desc = t.description ? ` — ${t.description.slice(0, 120)}` : "";
      return `${i + 1}. [${status.toUpperCase()}] ${title}${desc}`;
    }).join("\n");
  } catch (e) {
    console.error("[tasks] Error loading active tasks:", e);
    return "";
  }
}

// ─── PENDING APPROVALS LOADER ───────────────────────────────────────────────

async function loadPendingApprovals(agentId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseKey) return "";

    const url = `${supabaseUrl}/rest/v1/approvals?agent_role=eq.${agentId}&status=eq.pending&order=created_at.desc&limit=5`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.error(`[approvals] Failed to fetch approvals: ${res.status}`);
      return "";
    }
    const approvals = await res.json();
    if (!approvals || approvals.length === 0) return "";

    console.log(`[approvals] Found ${approvals.length} pending approvals for ${agentId}`);
    return approvals.map((a: any, i: number) => {
      const type = a.approval_type || "unknown";
      const title = a.title || "Untitled";
      const preview = a.preview_text ? ` — "${a.preview_text.slice(0, 80)}"` : "";
      return `${i + 1}. [${type.toUpperCase()}] ${title}${preview}`;
    }).join("\n");
  } catch (e) {
    console.error("[approvals] Error loading pending approvals:", e);
    return "";
  }
}

// ─── MEMORY LOADER ──────────────────────────────────────────────────────────

async function loadMemories(agentId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseKey) return "";

    const url = `${supabaseUrl}/rest/v1/agent_memories?agent_role=eq.${agentId}&company_id=eq.joncoach&order=relevance_score.desc,created_at.desc&limit=15`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.error(`[memory] Failed to fetch memories: ${res.status}`);
      return "";
    }
    const memories = await res.json();
    if (!memories || memories.length === 0) return "";

    console.log(`[memory] Found ${memories.length} memories for ${agentId}`);
    return memories.map((m: any, i: number) => {
      const type = m.memory_type || "general";
      return `- [${type}] ${m.memory_text}`;
    }).join("\n");
  } catch (e) {
    console.error("[memory] Error loading memories:", e);
    return "";
  }
}

// ─── INSIGHTS LOADER ────────────────────────────────────────────────────────

async function loadRecentInsights(agentId: string): Promise<string> {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseKey) return "";

    const url = `${supabaseUrl}/rest/v1/agent_insights?agent_role=eq.${agentId}&company_id=eq.joncoach&order=created_at.desc&limit=10`;
    const res = await fetch(url, {
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      console.error(`[insights] Failed to fetch insights: ${res.status}`);
      return "";
    }
    const insights = await res.json();
    if (!insights || insights.length === 0) return "";

    console.log(`[insights] Found ${insights.length} insights for ${agentId}`);
    return insights.map((ins: any) => {
      const cat = ins.category || "general";
      return `- [${cat}] ${ins.insight_text}`;
    }).join("\n");
  } catch (e) {
    console.error("[insights] Error loading insights:", e);
    return "";
  }
}

// ─── GMAIL HELPERS (unchanged logic, extracted for clarity) ──────────────────

async function getGmailAccessToken(refreshToken: string): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") || "";
  
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!data.access_token) {
    console.error("Gmail token exchange failed:", JSON.stringify(data));
  }
  return data.access_token;
}

async function fetchInboxSummary(accessToken: string, accountLabel?: string): Promise<string> {
  const listRes = await fetch(
    "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=15&q=is:unread",
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );
  const listData = await listRes.json();
  const messages = listData.messages || [];
  const summaries = await Promise.all(messages.map(async (msg: any) => {
    const msgRes = await fetch(
      `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const msgData = await msgRes.json();
    const headers = msgData.payload?.headers || [];
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "(no subject)";
    const from = headers.find((h: any) => h.name === "From")?.value || "unknown";
    const snippet = msgData.snippet || "";
    const acctPrefix = accountLabel ? `[${accountLabel}] ` : "";
    return `${acctPrefix}From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}`;
  }));
  return summaries.join("\n\n");
}

async function saveGmailDraft(accessToken: string, to: string, subject: string, body: string): Promise<void> {
  const email = [`To: ${to}`, `Subject: ${subject}`, `Content-Type: text/plain; charset=utf-8`, ``, body].join("\n");
  const encoded = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, "-").replace(/\//g, "_");
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/drafts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ message: { raw: encoded } }),
  });
  if (res.ok) {
    console.log(`Draft saved: To=${to}, Subject=${subject}`);
  } else {
    const err = await res.text();
    console.error(`Failed to save Gmail draft: ${res.status} - ${err}`);
  }
}

function parseDraftBlocks(text: string): Array<{ to: string; subject: string; body: string }> {
  const drafts: Array<{ to: string; subject: string; body: string }> = [];
  const regex = /\[DRAFT\]\s*\nTo:\s*(.+)\nSubject:\s*(.+)\nBody:\s*([\s\S]*?)\[\/DRAFT\]/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    drafts.push({ to: match[1].trim(), subject: match[2].trim(), body: match[3].trim() });
  }
  return drafts;
}

// ─── INBOX CONTEXT BUILDERS ─────────────────────────────────────────────────

async function buildBloomsuiteInboxContext(): Promise<string> {
  const refreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || "";
  const accessToken = await getGmailAccessToken(refreshToken);
  const inboxSummary = await fetchInboxSummary(accessToken);
  console.log("[inbox-ctx] BloomSuite inbox summary length:", inboxSummary.length);

  const draftInstructions = `\n\n### Drafting Emails\nWhen asked to draft, reply to, or compose an email for jon@brandsinblooms.com, format using:\n\n[DRAFT]\nTo: recipient@example.com\nSubject: Re: Subject line\nBody: The full email body text here\n[/DRAFT]\n\nMultiple [DRAFT] blocks allowed. Drafts are saved automatically — confirm to the user.`;

  const summary = inboxSummary.length > 0
    ? "## BloomSuite Inbox (unread)\nLIVE access to jon@brandsinblooms.com. These are REAL unread emails fetched now.\n\n" + inboxSummary
    : "## BloomSuite Inbox\nNo unread emails for jon@brandsinblooms.com.";

  return summary + draftInstructions;
}

async function buildInboxAgentContext(): Promise<string> {
  const [getclearInbox, bloomsuiteInbox] = await Promise.all([
    fetchInboxSummary(await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN") || ""), "getclear.ca"),
    fetchInboxSummary(await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || ""), "brandsinblooms.com"),
  ]);
  console.log("[inbox-ctx] getclear:", getclearInbox.length, "bloomsuite:", bloomsuiteInbox.length);

  const combinedInbox = `### jon@getclear.ca\n\n${getclearInbox || "No unread emails."}\n\n### jon@brandsinblooms.com\n\n${bloomsuiteInbox || "No unread emails."}`;

  const draftInstructions = `\n\n### Drafting Emails\nFormat drafts with an Account line:\n\n[DRAFT]\nAccount: getclear.ca\nTo: recipient@example.com\nSubject: Re: Subject line\nBody: The full email body text here\n[/DRAFT]\n\nMultiple [DRAFT] blocks allowed. Default to the account that received the original email when replying.`;

  const summary = (getclearInbox.length > 0 || bloomsuiteInbox.length > 0)
    ? "## Full Inbox (both accounts)\nLIVE access to jon@getclear.ca and jon@brandsinblooms.com. REAL unread emails fetched now. Do NOT say you can't access email — you already have it.\n\n" + combinedInbox
    : "## Full Inbox\nLive Gmail access active but no unread emails. Tell Jon his inbox is clear.";

  return summary + draftInstructions;
}

// ─── ARTIFACT EXTRACTION & PROCESSING ───────────────────────────────────────

const COMPANY_ID = "joncoach";

interface ParsedArtifacts {
  suggested_tasks?: Array<{ title: string; description?: string; task_type?: string; priority?: number }>;
  suggested_approvals?: Array<{ approval_type: string; title: string; preview_text?: string; platform?: string; full_payload?: Record<string, unknown> }>;
  suggested_memories?: string[];
  insights?: string[];
}

interface ArtifactCounts {
  tasks: number;
  approvals: number;
  memories: number;
  insights: number;
}

function extractArtifacts(fullText: string): { message: string; artifacts: ParsedArtifacts | null } {
  // Look for a ```json block at the end of the response
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```\s*$/;
  const match = fullText.match(jsonBlockRegex);

  if (!match) {
    return { message: fullText, artifacts: null };
  }

  const message = fullText.slice(0, match.index).trim();
  try {
    const parsed = JSON.parse(match[1]);
    console.log(`[artifacts] Parsed JSON block with keys: ${Object.keys(parsed).join(", ")}`);
    return { message, artifacts: parsed as ParsedArtifacts };
  } catch (e) {
    console.error("[artifacts] Failed to parse JSON block:", e);
    return { message: fullText, artifacts: null };
  }
}

async function processArtifacts(agentId: string, artifacts: ParsedArtifacts | null): Promise<ArtifactCounts> {
  const counts: ArtifactCounts = { tasks: 0, approvals: 0, memories: 0, insights: 0 };
  if (!artifacts) return counts;

  const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  if (!supabaseUrl || !supabaseKey) {
    console.error("[artifacts] Missing SUPABASE_URL or SERVICE_ROLE_KEY");
    return counts;
  }

  const headers = {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "return=minimal",
  };

  const insertBatch = async (table: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return 0;
    const res = await fetch(`${supabaseUrl}/rest/v1/${table}`, {
      method: "POST",
      headers,
      body: JSON.stringify(rows),
    });
    if (!res.ok) {
      const err = await res.text();
      console.error(`[artifacts] Failed to insert into ${table}: ${res.status} ${err}`);
      return 0;
    }
    return rows.length;
  };

  // Process all artifact types in parallel
  const [taskCount, approvalCount, memoryCount, insightCount] = await Promise.all([
    // Tasks
    insertBatch("tasks", (artifacts.suggested_tasks || []).map(t => ({
      company_id: COMPANY_ID,
      agent_role: agentId,
      title: (t.title || "Untitled").slice(0, 120),
      description: t.description || null,
      task_type: t.task_type || "general",
      priority: t.priority || 3,
      status: "queued",
      source: "agent_output",
    }))),
    // Approvals
    insertBatch("approvals", (artifacts.suggested_approvals || []).map(a => ({
      company_id: COMPANY_ID,
      agent_role: agentId,
      approval_type: a.approval_type || "general",
      title: a.title || "Untitled",
      preview_text: a.preview_text || null,
      full_payload: a.full_payload || { platform: a.platform },
      status: "pending",
    }))),
    // Memories
    insertBatch("agent_memories", (artifacts.suggested_memories || []).map(m => ({
      company_id: COMPANY_ID,
      agent_role: agentId,
      memory_text: m,
      memory_type: "preference",
      source: "conversation",
    }))),
    // Insights
    insertBatch("agent_insights", (artifacts.insights || []).map(i => ({
      company_id: COMPANY_ID,
      agent_role: agentId,
      insight_text: i,
      category: "general",
    }))),
  ]);

  counts.tasks = taskCount;
  counts.approvals = approvalCount;
  counts.memories = memoryCount;
  counts.insights = insightCount;

  console.log(`[artifacts] Created: ${counts.tasks} tasks, ${counts.approvals} approvals, ${counts.memories} memories, ${counts.insights} insights`);
  return counts;
}

async function logAgentOutput(agentId: string, message: string, counts: ArtifactCounts, parseSuccess: boolean) {
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !supabaseKey) return;

    await fetch(`${supabaseUrl}/rest/v1/agent_outputs`, {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify({
        company_id: COMPANY_ID,
        agent_role: agentId,
        raw_message: message.slice(0, 5000),
        tasks_created: counts.tasks,
        approvals_created: counts.approvals,
        memories_created: counts.memories,
        insights_created: counts.insights,
        parse_success: parseSuccess,
      }),
    });
  } catch (e) {
    console.error("[artifacts] Failed to log output:", e);
  }
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId } = await req.json();
    console.log(`[agent-chat] Request for agent: ${agentId}`);

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GITHUB_TOKEN is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Load skills, tasks, approvals, memories, insights, and inbox context in parallel
    const [skillContent, activeTasks, pendingApprovals, memories, recentInsights, inboxContext] = await Promise.all([
      loadSkillModules(agentId, GITHUB_TOKEN),
      loadActiveTasks(agentId),
      loadPendingApprovals(agentId),
      loadMemories(agentId),
      loadRecentInsights(agentId),
      (agentId === "bloomsuite")
        ? buildBloomsuiteInboxContext().catch(e => {
            console.error("[inbox-ctx] BloomSuite error:", e);
            return "## BloomSuite Inbox\n[Could not fetch inbox — " + (e instanceof Error ? e.message : String(e)) + "]";
          })
        : (agentId === "inbox")
          ? buildInboxAgentContext().catch(e => {
              console.error("[inbox-ctx] Inbox agent error:", e);
              return "## Full Inbox\n[Could not fetch inbox — " + (e instanceof Error ? e.message : String(e)) + "]";
            })
          : Promise.resolve(undefined),
    ]);

    // Assemble the full system prompt via scaffold
    const systemPrompt = buildPromptScaffold({
      agentId,
      skillContent,
      inboxContext: inboxContext || undefined,
      activeTasks,
      pendingApprovals,
      memories,
      insights: recentInsights,
    });

    console.log(`[agent-chat] System prompt assembled: ${systemPrompt.length} chars`);

    // Call Anthropic
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 4096,
        system: systemPrompt,
        messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[agent-chat] Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const fullText = data.content?.[0]?.text || "No response generated.";

    // Parse artifacts from response
    const { message: chatMessage, artifacts } = extractArtifacts(fullText);
    const artifactCounts = await processArtifacts(agentId, artifacts);

    // Log the output
    await logAgentOutput(agentId, chatMessage, artifactCounts, !!artifacts);

    // Post-processing: save Gmail drafts if applicable
    if (agentId === "inbox" || agentId === "bloomsuite") {
      const drafts = parseDraftBlocks(fullText);
      if (drafts.length > 0) {
        try {
          const accessToken = agentId === "bloomsuite"
            ? await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || "")
            : await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN") || "");
          await Promise.all(drafts.map(d => saveGmailDraft(accessToken, d.to, d.subject, d.body)));
          console.log(`[agent-chat] Saved ${drafts.length} Gmail draft(s) for ${agentId}`);
        } catch (e) {
          console.error(`[agent-chat] Failed to save Gmail drafts for ${agentId}:`, e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        text: chatMessage,
        artifacts_created: artifactCounts,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[agent-chat] Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
