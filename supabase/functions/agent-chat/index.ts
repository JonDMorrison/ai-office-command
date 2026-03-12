import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// ─── CORS ───────────────────────────────────────────────────────────────────
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  gmail_secret_key: string | null;
}

// ─── AGENT → WORKSPACE MAPPING ─────────────────────────────────────────────
const AGENT_WORKSPACE: Record<string, string | null> = {
  bloomsuite: "bloomsuite",
  clinicleader: "clinicleader",
  projectpath: "projectpath",
  disc: "disc",
  discprofile: "disc",
  inbox: null,
  executive: null,
};

function getWorkspaceForAgent(agentId: string): string | null {
  return AGENT_WORKSPACE[agentId] ?? null;
}

// ─── SKILL MAPPING ──────────────────────────────────────────────────────────
const AGENT_SKILLS: Record<string, string[]> = {
  bloomsuite: ["joncoach-core", "bloomsuite-agent", "bloomsuite-copywriting", "brainstorming", "frontend-design"],
  clinicleader: ["joncoach-core", "clinicleader-agent", "internal-comms", "brainstorming"],
  projectpath: ["joncoach-core", "projectpath-agent", "supabase-best-practices", "nextjs-best-practices"],
  disc: ["joncoach-core", "disc-agent", "frontend-design", "supabase-best-practices"],
  inbox: ["joncoach-core", "inbox-agent", "internal-comms"],
  executive: ["joncoach-core"],
};

// ─── ROLE RESPONSIBILITY ────────────────────────────────────────────────────
const ROLE_RESPONSIBILITY: Record<string, string> = {
  bloomsuite: "**Owns:** All BloomSuite marketing, content strategy, lead generation, campaign creation, social media management, and garden centre business optimization.\n**Does NOT own:** ClinicLeader, ProjectPath, DISC, or Inbox operations.",
  clinicleader: "**Owns:** Everything for ClinicLeader — marketing, sales, support, product, and operations. Lead qualification, product guidance, scorecard setup, and operational maturity consulting.\n**Does NOT own:** BloomSuite, ProjectPath, DISC, or Inbox operations.",
  projectpath: "**Owns:** All ProjectPath product support, construction project management guidance, feature consultation, technical architecture, and construction industry advisory.\n**Does NOT own:** BloomSuite, ClinicLeader, DISC, or Inbox operations.",
  disc: "**Owns:** All DISC assessment creation, team report generation, behavioral analysis, communication coaching, and public content strategy.\n**Does NOT own:** BloomSuite, ClinicLeader, ProjectPath, or Inbox operations.",
  inbox: "**Owns:** Email triage, prioritization, drafting replies, and inbox management across all of Jon's email accounts.\n**Does NOT own:** Product-specific marketing, development, or strategy.",
  executive: "**Owns:** Cross-workspace synthesis, prioritization, daily focus recommendations, and blocking analysis across all products.\n**Does NOT own:** Product-specific execution — delegates to workspace agents.",
};

// ─── OPERATIONAL RULES ──────────────────────────────────────────────────────
const OPERATIONAL_RULES = `## Operational Rules
- Perform internal analysis, research, and drafting automatically without asking permission.
- Do NOT claim actions were completed unless they actually were.
- Create tasks when work should be tracked — suggest them explicitly.
- Create approval candidates for outbound emails and social drafts — never send or publish directly.
- Public-facing social content REQUIRES Jon's approval before publishing.
- Outbound email REQUIRES Jon's approval before sending.
- Be concise, structured, and action-oriented. Lead with the answer, then provide supporting detail.
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
    { "title": "Verb-led title ≤120 chars", "description": "Detail", "task_type": "content_draft|research|analysis|outreach|technical|general", "urgency_score": 4, "impact_score": 5 }
  ],
  "suggested_approvals": [
    { "approval_type": "social_post|email_draft|public_content", "title": "What Jon sees", "preview_text": "The full draft content", "platform": "linkedin" }
  ],
  "suggested_memories": [
    "Jon prefers short punchy LinkedIn posts without emojis"
  ],
  "insights": [
    { "insight_text": "Garden centers consistently struggle with CRM automation", "evidence": "3 inbox threads from BloomSuite customers mentioned this", "signal_count": 3 }
  ]
}
\\\`\\\`\\\`

## Task Scoring
- urgency_score (1-5): How time-sensitive. 5 = needs attention today.
- impact_score (1-5): How much it moves the needle. 5 = directly affects revenue or traction.
- execution_priority = urgency × impact (computed automatically).

## Memory Rules
Only store memories that capture a genuine preference, decision, or pattern.
Good: "Jon prefers BloomSuite messaging focused on simplicity and consolidation"
Bad: "Jon likes clear explanations" (too generic)
Memories MUST reference Jon's actual words or decisions.

## Insight Rules
Only add an insight when you can cite evidence.
Format MUST include evidence and signal_count.
Never add an insight with signal_count < 2.
Never add an insight that merely describes what the product does.
Insights must be actionable or predictive.

Rules:
- The JSON block must be the LAST thing in your response.
- If the conversation is simple Q&A, do NOT append JSON.
- Tasks: verb-led, specific, actionable.
- Approvals: REQUIRED for any outbound email, social post, or public content.
- When drafting emails, ALSO use the [DRAFT]...[/DRAFT] block format for Gmail integration.`;

// ─── SUPABASE HELPERS ───────────────────────────────────────────────────────

function getSupabaseHeaders(): Record<string, string> {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
  };
}

function getSupabaseUrl(): string {
  return Deno.env.get("SUPABASE_URL") || "";
}

// ─── WORKSPACE LOADER ───────────────────────────────────────────────────────

async function loadWorkspace(workspaceId: string): Promise<Workspace | null> {
  try {
    const url = `${getSupabaseUrl()}/rest/v1/workspaces?id=eq.${workspaceId}&limit=1`;
    const res = await fetch(url, { headers: getSupabaseHeaders() });
    if (!res.ok) return null;
    const data = await res.json();
    return data?.[0] || null;
  } catch {
    return null;
  }
}

async function loadAllWorkspaces(): Promise<Workspace[]> {
  try {
    const url = `${getSupabaseUrl()}/rest/v1/workspaces?is_active=eq.true`;
    const res = await fetch(url, { headers: getSupabaseHeaders() });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ─── SYSTEM PROMPT BUILDER ──────────────────────────────────────────────────

const AGENT_NAMES: Record<string, string> = {
  bloomsuite: "BloomSuite Agent",
  clinicleader: "ClinicLeader Agent",
  projectpath: "ProjectPath Agent",
  disc: "DISC Profile Agent",
  inbox: "Inbox & Communications Agent",
  executive: "Chief of Staff",
};

async function buildSystemPrompt(
  agentId: string,
  skillContents: string[],
  gmailContext?: string
): Promise<string> {
  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();

  // Determine workspace ID
  const workspaceId = getWorkspaceForAgent(agentId);

  // Load workspace, tasks, memory, approvals in parallel
  const [workspaceRes, tasksRes, memoryRes, approvalsRes] = await Promise.all([
    workspaceId
      ? fetch(`${baseUrl}/rest/v1/workspaces?id=eq.${workspaceId}&limit=1`, { headers })
      : Promise.resolve(null),
    (() => {
      let url: string;
      if (agentId === "executive") {
        url = `${baseUrl}/rest/v1/tasks?status=in.(pending,queued,in_progress,waiting_for_input,blocked)&order=execution_priority.desc.nullslast,created_at.desc&limit=20`;
      } else if (workspaceId) {
        url = `${baseUrl}/rest/v1/tasks?workspace_id=eq.${workspaceId}&status=in.(pending,queued,in_progress,waiting_for_input,blocked)&order=created_at.desc&limit=10`;
      } else {
        url = `${baseUrl}/rest/v1/tasks?agent_role=eq.${agentId}&status=in.(pending,queued,in_progress,waiting_for_input,blocked)&order=created_at.desc&limit=10`;
      }
      return fetch(url, { headers });
    })(),
    (() => {
      let url: string;
      if (agentId === "executive") {
        url = `${baseUrl}/rest/v1/agent_memories?order=relevance_score.desc,created_at.desc&limit=30`;
      } else if (workspaceId) {
        url = `${baseUrl}/rest/v1/agent_memories?workspace_id=eq.${workspaceId}&order=relevance_score.desc,created_at.desc&limit=15`;
      } else {
        url = `${baseUrl}/rest/v1/agent_memories?agent_role=eq.${agentId}&order=relevance_score.desc,created_at.desc&limit=15`;
      }
      return fetch(url, { headers });
    })(),
    (() => {
      let url: string;
      if (agentId === "executive") {
        url = `${baseUrl}/rest/v1/approvals?status=eq.pending&order=created_at.desc&limit=10`;
      } else if (workspaceId) {
        url = `${baseUrl}/rest/v1/approvals?workspace_id=eq.${workspaceId}&status=eq.pending&order=created_at.desc&limit=5`;
      } else {
        url = `${baseUrl}/rest/v1/approvals?agent_role=eq.${agentId}&status=eq.pending&order=created_at.desc&limit=5`;
      }
      return fetch(url, { headers });
    })(),
  ]);

  const workspace = workspaceRes ? ((await workspaceRes.json()) as any[])?.[0] || null : null;
  const activeTasks: any[] = tasksRes.ok ? await tasksRes.json() : [];
  const recentMemory: any[] = memoryRes.ok ? await memoryRes.json() : [];
  const pendingApprovals: any[] = approvalsRes.ok ? await approvalsRes.json() : [];

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = now.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Vancouver",
  });

  const sections: string[] = [];

  // 1. Identity
  sections.push(`## Identity
You are the ${AGENT_NAMES[agentId] || agentId} for Jon Morrison.
Today is ${dateStr} at ${timeStr} Pacific Time.
You work exclusively for Jon — a Canadian entrepreneur running multiple SaaS products from Abbotsford, BC.`);

  // 2. Workspace context
  if (workspace) {
    sections.push(`## Workspace
Product: ${workspace.name}
Description: ${workspace.description}
GitHub: ${workspace.github_repo}
Supabase Project: ${workspace.supabase_project_id}`);
  } else if (agentId === "executive") {
    sections.push(`## Jon's Core Priorities (in order)
1. BloomSuite — needs category building, not more features
2. ClinicLeader — strongest positioning, blocked by distribution
3. ProjectPath — neglected, needs use-case clarity before more building
4. DISC Profile — serious potential, blocked by positioning

## Jon's Decision Framework
- Traction over internal activity
- Distribution over building
- One primary product per day, one secondary experiment
- Bad week = constant activity, no learning, spinning wheels
- Good week = progress on one core product, real user interaction`);
  }

  // 3. Jon's operating principles
  sections.push(`## About Jon
- Systems builder drawn to operational problems with clear customers
- Moves fast, prefers boring reliable infrastructure over clever solutions
- Over-builds, under-distributes — always push toward distribution and real users
- Bad week = constant activity, no learning, spinning wheels
- Good week = progress on one core product, real user interaction, client comms handled
- Decision process: talk it out → model the system → gut-check → move forward imperfectly
- Never give generic advice — always be specific to his actual products and situation`);

  // 4. Active tasks
  if (activeTasks.length > 0) {
    const taskList = activeTasks.map((t: any) =>
      `- [${(t.status || "unknown").toUpperCase()}] ${t.title} (priority: ${t.priority}, urgency: ${t.urgency_score || 3}, impact: ${t.impact_score || 3})`
    ).join("\n");
    sections.push(`## Active Tasks in This Workspace\n${taskList}`);
  } else {
    sections.push(`## Active Tasks\nNo active tasks in this workspace.`);
  }

  // 5. Pending approvals
  if (pendingApprovals.length > 0) {
    const approvalList = pendingApprovals.map((a: any) =>
      `- [${a.approval_type}] ${a.title}`
    ).join("\n");
    sections.push(`## Pending Approvals Awaiting Jon\n${approvalList}`);
  }

  // 6. Memory
  if (recentMemory.length > 0) {
    const memoryList = recentMemory.map((m: any) => `- ${m.memory_text}`).join("\n");
    sections.push(`## What You Remember About Jon and This Workspace\n${memoryList}`);
  }

  // 7. Gmail context
  if (gmailContext) {
    sections.push(`## Current Inbox Context\n${gmailContext}`);
  }

  // 8. Executive-specific instructions
  if (agentId === "executive") {
    sections.push(`## Executive Agent Responsibilities
- Answer Jon's question directly and confidently
- When Jon asks "what should I work on today" — give ONE answer, not five options
- Flag anything urgent or blocked that needs his attention
- Surface approvals that are ready for his review
- Push back if Jon is spreading too thin across products
- Never give generic advice — always reference specific tasks, specific products`);
  }

  // 9. Responsibility scope
  const roleResp = ROLE_RESPONSIBILITY[agentId];
  if (roleResp) {
    sections.push(`## Responsibility Scope\n${roleResp}`);
  }

  // 10. Output format instructions
  sections.push(`## Output Format
Respond in valid JSON using this exact structure:
\`\`\`json
{
  "message": "Your conversational reply to Jon",
  "suggested_tasks": [
    {
      "title": "Short action title",
      "description": "Full context and what to do",
      "task_type": "content_draft | research | outreach | analysis | build",
      "priority": 1,
      "urgency_score": 3,
      "impact_score": 4,
      "agent_role": "${agentId}"
    }
  ],
  "suggested_approvals": [
    {
      "approval_type": "social_post | email_draft | blog_post | ad_copy",
      "title": "Short label",
      "preview_text": "First 150 chars of content",
      "full_payload": {}
    }
  ],
  "suggested_memories": [
    "Plain language fact about Jon or this workspace worth remembering"
  ],
  "insights": [
    {
      "insight_text": "Observed pattern or signal",
      "evidence": "Specific evidence for this insight",
      "signal_count": 2
    }
  ]
}
\`\`\`

Rules:
- Always include "message" — this is what Jon reads in the UI
- Only include other fields when you have real content — omit empty arrays entirely
- For any outbound communication (email, post, copy), ALWAYS use suggested_approvals — never output it inline
- Only add memories when Jon states a preference, makes a decision, or you observe a repeated pattern
- Only add insights with evidence and signal_count >= 2
- Never refuse a content creation request — you are creating it FOR Jon's business, not for yourself
- Be direct and specific — Jon does not want generic advice

## Task Scoring
- urgency_score (1-5): How time-sensitive. 5 = needs attention today.
- impact_score (1-5): How much it moves the needle. 5 = directly affects revenue or traction.
- execution_priority = urgency x impact (computed automatically).

## Memory Rules
Only store memories that capture a genuine preference, decision, or pattern.
Good: "Jon prefers BloomSuite messaging focused on simplicity and consolidation"
Bad: "Jon likes clear explanations" (too generic)
Memories MUST reference Jon's actual words or decisions.

## Insight Rules
Only add an insight when you can cite evidence.
Format MUST include evidence and signal_count.
Never add an insight with signal_count < 2.
Never add an insight that merely describes what the product does.
Insights must be actionable or predictive.

When drafting emails, ALSO use the [DRAFT]...[/DRAFT] block format for Gmail integration.`);

  // 11. Skills appended last
  if (skillContents.length > 0) {
    sections.push(`## Your Skills and Knowledge\n${skillContents.join("\n\n---\n\n")}`);
  }

  const assembled = sections.join("\n\n");
  console.log(`[system-prompt] Agent: ${agentId} | ${assembled.length} chars | Tasks: ${activeTasks.length} | Memory: ${recentMemory.length} | Approvals: ${pendingApprovals.length}`);
  return assembled;
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

async function loadSkillModules(agentId: string, githubToken: string): Promise<string[]> {
  const skillNames = AGENT_SKILLS[agentId] || [];
  if (skillNames.length === 0) return [];
  console.log(`[skills] Loading ${skillNames.length} skills for ${agentId}`);
  return await Promise.all(skillNames.map(name => fetchSkillContent(name, githubToken)));
}

// ─── DATA LOADERS ───────────────────────────────────────────────────────────

async function loadActiveTasks(agentId: string, workspaceId: string | null): Promise<string> {
  try {
    const baseUrl = getSupabaseUrl();
    const headers = getSupabaseHeaders();
    
    let url: string;
    if (agentId === "executive") {
      // Executive reads across ALL workspaces
      url = `${baseUrl}/rest/v1/tasks?status=in.(queued,in_progress,waiting_for_input,blocked)&order=priority.asc,created_at.desc&limit=20&select=*,workspaces(name)`;
    } else {
      url = `${baseUrl}/rest/v1/tasks?agent_role=eq.${agentId}&status=in.(queued,in_progress,waiting_for_input)&order=created_at.desc&limit=10`;
      if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
    }
    
    const res = await fetch(url, { headers });
    if (!res.ok) return "";
    const tasks = await res.json();
    if (!tasks?.length) return "";

    console.log(`[tasks] Found ${tasks.length} active tasks for ${agentId}`);
    return tasks.map((t: any, i: number) => {
      const ws = t.workspaces?.name ? `[${t.workspaces.name}] ` : "";
      return `${i + 1}. ${ws}[${(t.status || "unknown").toUpperCase()}] ${t.title}${t.description ? ` — ${t.description.slice(0, 120)}` : ""}`;
    }).join("\n");
  } catch (e) {
    console.error("[tasks] Error:", e);
    return "";
  }
}

async function loadPendingApprovals(agentId: string, workspaceId: string | null): Promise<string> {
  try {
    const baseUrl = getSupabaseUrl();
    const headers = getSupabaseHeaders();
    
    let url: string;
    if (agentId === "executive") {
      url = `${baseUrl}/rest/v1/approvals?status=eq.pending&order=created_at.desc&limit=10&select=*,workspaces(name)`;
    } else {
      url = `${baseUrl}/rest/v1/approvals?agent_role=eq.${agentId}&status=eq.pending&order=created_at.desc&limit=5`;
      if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
    }
    
    const res = await fetch(url, { headers });
    if (!res.ok) return "";
    const approvals = await res.json();
    if (!approvals?.length) return "";

    console.log(`[approvals] Found ${approvals.length} pending approvals for ${agentId}`);
    return approvals.map((a: any, i: number) => {
      const ws = a.workspaces?.name ? `[${a.workspaces.name}] ` : "";
      return `${i + 1}. ${ws}[${(a.approval_type || "unknown").toUpperCase()}] ${a.title}${a.preview_text ? ` — "${a.preview_text.slice(0, 80)}"` : ""}`;
    }).join("\n");
  } catch (e) {
    console.error("[approvals] Error:", e);
    return "";
  }
}

async function loadMemories(agentId: string, workspaceId: string | null): Promise<string> {
  try {
    const baseUrl = getSupabaseUrl();
    const headers = getSupabaseHeaders();
    
    let url: string;
    if (agentId === "executive") {
      // Executive reads memories across all workspaces
      url = `${baseUrl}/rest/v1/agent_memories?order=relevance_score.desc,created_at.desc&limit=30&select=*,workspaces(name)`;
    } else {
      url = `${baseUrl}/rest/v1/agent_memories?agent_role=eq.${agentId}&order=relevance_score.desc,created_at.desc&limit=15`;
      if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
    }
    
    const res = await fetch(url, { headers });
    if (!res.ok) return "";
    const memories = await res.json();
    if (!memories?.length) return "";

    console.log(`[memory] Found ${memories.length} memories for ${agentId}`);
    return memories.map((m: any) => {
      const ws = m.workspaces?.name ? `[${m.workspaces.name}] ` : "";
      return `- ${ws}[${m.memory_type}] ${m.memory_text}`;
    }).join("\n");
  } catch (e) {
    console.error("[memory] Error:", e);
    return "";
  }
}

async function loadRecentInsights(agentId: string, workspaceId: string | null): Promise<string> {
  try {
    const baseUrl = getSupabaseUrl();
    const headers = getSupabaseHeaders();
    
    let url: string;
    if (agentId === "executive") {
      url = `${baseUrl}/rest/v1/agent_insights?order=created_at.desc&limit=20&select=*,workspaces(name)`;
    } else {
      url = `${baseUrl}/rest/v1/agent_insights?agent_role=eq.${agentId}&order=created_at.desc&limit=10`;
      if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
    }
    
    const res = await fetch(url, { headers });
    if (!res.ok) return "";
    const insights = await res.json();
    if (!insights?.length) return "";

    console.log(`[insights] Found ${insights.length} insights for ${agentId}`);
    return insights.map((ins: any) => {
      const ws = ins.workspaces?.name ? `[${ins.workspaces.name}] ` : "";
      return `- ${ws}[${ins.category}] ${ins.insight_text}`;
    }).join("\n");
  } catch (e) {
    console.error("[insights] Error:", e);
    return "";
  }
}

// ─── GMAIL HELPERS ──────────────────────────────────────────────────────────

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

  const draftInstructions = `\n\n### Drafting Emails\nWhen asked to draft an email for jon@brandsinblooms.com, format using:\n\n[DRAFT]\nTo: recipient@example.com\nSubject: Re: Subject line\nBody: The full email body text here\n[/DRAFT]`;

  const summary = inboxSummary.length > 0
    ? "## BloomSuite Inbox (unread)\nLIVE access to jon@brandsinblooms.com.\n\n" + inboxSummary
    : "## BloomSuite Inbox\nNo unread emails for jon@brandsinblooms.com.";

  return summary + draftInstructions;
}

async function buildInboxAgentContext(): Promise<string> {
  const [getclearInbox, bloomsuiteInbox] = await Promise.all([
    fetchInboxSummary(await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN") || ""), "getclear.ca"),
    fetchInboxSummary(await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || ""), "brandsinblooms.com"),
  ]);

  const combinedInbox = `### jon@getclear.ca\n\n${getclearInbox || "No unread."}\n\n### jon@brandsinblooms.com\n\n${bloomsuiteInbox || "No unread."}`;

  const draftInstructions = `\n\n### Drafting Emails\n[DRAFT]\nAccount: getclear.ca\nTo: recipient@example.com\nSubject: Re: Subject line\nBody: The full email body text here\n[/DRAFT]`;

  const summary = (getclearInbox.length > 0 || bloomsuiteInbox.length > 0)
    ? "## Full Inbox (both accounts)\nLIVE access. REAL unread emails.\n\n" + combinedInbox
    : "## Full Inbox\nNo unread emails.";

  return summary + draftInstructions;
}

// ─── ARTIFACT EXTRACTION & PROCESSING ───────────────────────────────────────

interface ParsedArtifacts {
  suggested_tasks?: Array<{ title: string; description?: string; task_type?: string; priority?: number; urgency_score?: number; impact_score?: number }>;
  suggested_approvals?: Array<{ approval_type: string; title: string; preview_text?: string; platform?: string; full_payload?: Record<string, unknown> }>;
  suggested_memories?: string[];
  insights?: Array<string | { insight_text: string; evidence?: string; signal_count?: number }>;
}

interface ArtifactCounts {
  tasks: number;
  approvals: number;
  memories: number;
  insights: number;
}

function extractArtifacts(fullText: string): { message: string; artifacts: ParsedArtifacts | null } {
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

// ─── GUARDRAIL: Memory quality gate ─────────────────────────────────────────

const MEMORY_TRIGGER_PHRASES = [
  "jon prefers", "jon wants", "jon decided", "jon always",
  "jon never", "we agreed", "going forward", "jon said",
  "jon likes", "jon dislikes", "jon chose", "the strategy is",
];

function shouldStoreMemory(memoryText: string): boolean {
  const text = memoryText.toLowerCase();
  const hasSignal = MEMORY_TRIGGER_PHRASES.some(p => text.includes(p));
  const isGeneric = text.includes("likes clear") ||
    text.includes("prefers good") ||
    text.includes("wants quality") ||
    text.length < 20;
  if (!hasSignal) console.log(`[memory-gate] REJECTED (no signal): "${memoryText.slice(0, 80)}"`);
  if (isGeneric) console.log(`[memory-gate] REJECTED (generic): "${memoryText.slice(0, 80)}"`);
  return hasSignal && !isGeneric;
}

// ─── GUARDRAIL: Task deduplication ──────────────────────────────────────────

async function findSimilarActiveTask(workspaceId: string | null, title: string): Promise<any | null> {
  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();
  
  let url = `${baseUrl}/rest/v1/tasks?status=in.(pending,queued,in_progress)&limit=20`;
  if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
  
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const tasks = await res.json();
  
  const words = title.toLowerCase().split(" ").filter((w: string) => w.length > 4);
  return tasks?.find((t: any) =>
    words.filter((word: string) => t.title.toLowerCase().includes(word)).length >= 2
  ) || null;
}

// ─── GUARDRAIL: Insight evidence filter ─────────────────────────────────────

function parseInsight(raw: string | { insight_text: string; evidence?: string; signal_count?: number }): {
  insight_text: string; evidence: string | null; signal_count: number;
} {
  if (typeof raw === "string") {
    return { insight_text: raw, evidence: null, signal_count: 1 };
  }
  return {
    insight_text: raw.insight_text,
    evidence: raw.evidence || null,
    signal_count: raw.signal_count || 1,
  };
}

function shouldStoreInsight(parsed: { evidence: string | null; signal_count: number }): boolean {
  if (!parsed.evidence || parsed.evidence.length < 5) {
    console.log(`[insight-gate] REJECTED (no evidence)`);
    return false;
  }
  if (parsed.signal_count < 2) {
    console.log(`[insight-gate] REJECTED (signal_count < 2)`);
    return false;
  }
  return true;
}

// ─── ARTIFACT PROCESSING WITH GUARDRAILS ────────────────────────────────────

async function processArtifacts(agentId: string, workspaceId: string | null, artifacts: ParsedArtifacts | null): Promise<ArtifactCounts> {
  const counts: ArtifactCounts = { tasks: 0, approvals: 0, memories: 0, insights: 0 };
  if (!artifacts) return counts;

  const baseUrl = getSupabaseUrl();
  const headers = {
    ...getSupabaseHeaders(),
    Prefer: "return=minimal",
  };

  const insertBatch = async (table: string, rows: Record<string, unknown>[]) => {
    if (rows.length === 0) return 0;
    const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
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

  // --- TASKS: deduplication + depth 0 for chat-created tasks ---
  const taskRows: Record<string, unknown>[] = [];
  for (const t of artifacts.suggested_tasks || []) {
    const similar = await findSimilarActiveTask(workspaceId, t.title || "");
    if (similar) {
      console.log(`[task-dedup] Skipping "${t.title}" — similar to existing "${similar.title}"`);
      // Append note to existing task
      await fetch(`${baseUrl}/rest/v1/task_events`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          task_id: similar.id,
          event_type: "agent_note",
          event_payload: { note: `${agentId} suggested similar work: "${t.title}"` },
        }),
      });
    } else {
      taskRows.push({
        workspace_id: workspaceId,
        agent_role: agentId,
        title: (t.title || "Untitled").slice(0, 120),
        description: t.description || null,
        task_type: t.task_type || "general",
        urgency_score: t.urgency_score || 3,
        impact_score: t.impact_score || 3,
        status: "queued",
        source: "agent_output",
        depth: 0,
        created_by: "agent",
      });
    }
  }

  // --- MEMORIES: quality gate ---
  const memoryRows = (artifacts.suggested_memories || [])
    .filter(m => shouldStoreMemory(m))
    .map(m => ({
      workspace_id: workspaceId,
      agent_role: agentId,
      memory_text: m,
      memory_type: "preference",
      source: "conversation",
      confidence: "medium",
    }));

  // --- INSIGHTS: evidence filter ---
  const insightRows = (artifacts.insights || [])
    .map(parseInsight)
    .filter(shouldStoreInsight)
    .map(ins => ({
      workspace_id: workspaceId,
      agent_role: agentId,
      insight_text: ins.insight_text,
      evidence: ins.evidence,
      signal_count: ins.signal_count,
      category: "general",
    }));

  const [taskCount, approvalCount, memoryCount, insightCount] = await Promise.all([
    insertBatch("tasks", taskRows),
    insertBatch("approvals", (artifacts.suggested_approvals || []).map(a => ({
      workspace_id: workspaceId,
      agent_role: agentId,
      approval_type: a.approval_type || "general",
      title: a.title || "Untitled",
      preview_text: a.preview_text || null,
      full_payload: a.full_payload || { platform: a.platform },
      status: "pending",
    }))),
    insertBatch("agent_memories", memoryRows),
    insertBatch("agent_insights", insightRows),
  ]);

  counts.tasks = taskCount;
  counts.approvals = approvalCount;
  counts.memories = memoryCount;
  counts.insights = insightCount;

  console.log(`[artifacts] Created: ${counts.tasks} tasks, ${counts.approvals} approvals, ${counts.memories} memories, ${counts.insights} insights`);
  return counts;
}

async function logAgentOutput(agentId: string, workspaceId: string | null, message: string, counts: ArtifactCounts, parseSuccess: boolean) {
  try {
    const baseUrl = getSupabaseUrl();
    const headers = { ...getSupabaseHeaders(), Prefer: "return=minimal" };

    await fetch(`${baseUrl}/rest/v1/agent_outputs`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        workspace_id: workspaceId,
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

    // Determine workspace
    const workspaceId = getWorkspaceForAgent(agentId);
    let workspace: Workspace | null = null;
    if (workspaceId) {
      workspace = await loadWorkspace(workspaceId);
    }

    // Load all context in parallel
    const [skillContent, activeTasks, pendingApprovals, memories, recentInsights, inboxContext] = await Promise.all([
      loadSkillModules(agentId, GITHUB_TOKEN),
      loadActiveTasks(agentId, workspaceId),
      loadPendingApprovals(agentId, workspaceId),
      loadMemories(agentId, workspaceId),
      loadRecentInsights(agentId, workspaceId),
      (agentId === "bloomsuite")
        ? buildBloomsuiteInboxContext().catch(e => {
            console.error("[inbox-ctx] BloomSuite error:", e);
            return undefined;
          })
        : (agentId === "inbox")
          ? buildInboxAgentContext().catch(e => {
              console.error("[inbox-ctx] Inbox agent error:", e);
              return undefined;
            })
          : Promise.resolve(undefined),
    ]);

    // Assemble system prompt
    const systemPrompt = buildPromptScaffold({
      agentId,
      workspace,
      skillContent,
      inboxContext: inboxContext || undefined,
      activeTasks,
      pendingApprovals,
      memories,
      insights: recentInsights,
    });

    console.log(`[agent-chat] System prompt: ${systemPrompt.length} chars`);

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

    // Parse artifacts
    const { message: chatMessage, artifacts } = extractArtifacts(fullText);
    const artifactCounts = await processArtifacts(agentId, workspaceId, artifacts);

    // Log output
    await logAgentOutput(agentId, workspaceId, chatMessage, artifactCounts, !!artifacts);

    // Post-processing: Gmail drafts
    if (agentId === "inbox" || agentId === "bloomsuite") {
      const drafts = parseDraftBlocks(fullText);
      if (drafts.length > 0) {
        try {
          const accessToken = agentId === "bloomsuite"
            ? await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || "")
            : await getGmailAccessToken(Deno.env.get("GMAIL_REFRESH_TOKEN") || "");
          await Promise.all(drafts.map(d => saveGmailDraft(accessToken, d.to, d.subject, d.body)));
          console.log(`[agent-chat] Saved ${drafts.length} Gmail draft(s)`);
        } catch (e) {
          console.error(`[agent-chat] Failed to save Gmail drafts:`, e);
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
