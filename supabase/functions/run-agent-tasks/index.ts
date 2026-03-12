import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runReasoningModel, AI_MODELS } from "../_shared/aiRouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── SAFETY LIMITS ──────────────────────────────────────────────────────────
const MAX_TASKS_PER_RUN = 10;
const MAX_SUBTASKS_PER_PARENT = 5;

// ─── SKILL MAPPING ──────────────────────────────────────────────────────────
const AGENT_SKILLS: Record<string, string[]> = {
  bloomsuite: ["joncoach-core", "bloomsuite-agent", "bloomsuite-copywriting", "brainstorming", "frontend-design"],
  clinicleader: ["joncoach-core", "clinicleader-agent", "internal-comms", "brainstorming"],
  projectpath: ["joncoach-core", "projectpath-agent", "supabase-best-practices", "nextjs-best-practices"],
  disc: ["joncoach-core", "disc-agent", "frontend-design", "supabase-best-practices"],
  inbox: ["joncoach-core", "inbox-agent", "internal-comms"],
};

// ─── AGENT → WORKSPACE MAPPING ─────────────────────────────────────────────
const AGENT_WORKSPACE: Record<string, string | null> = {
  bloomsuite: "bloomsuite",
  clinicleader: "clinicleader",
  projectpath: "projectpath",
  disc: "disc",
  inbox: null,
  executive: null,
};

// ─── TYPES ──────────────────────────────────────────────────────────────────

interface Task {
  id: string;
  workspace_id: string | null;
  agent_role: string;
  title: string;
  description: string | null;
  task_type: string;
  status: string;
  priority: number;
  depth: number;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
}

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  gmail_secret_key: string | null;
}

interface ParsedArtifacts {
  message?: string;
  output?: string;
  suggested_tasks?: Array<{ title: string; description?: string; task_type?: string; priority?: number; urgency_score?: number; impact_score?: number }>;
  suggested_approvals?: Array<{ approval_type: string; title: string; preview_text?: string; platform?: string }>;
  delegate_to?: Array<{ agent_role: string; title: string; description?: string; priority?: number; urgency_score?: number; impact_score?: number }>;
  suggested_memories?: string[];
  insights?: Array<string | { insight_text: string; evidence?: string; signal_count?: number }>;
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function getSupabaseHeaders(): Record<string, string> {
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function getSupabaseUrl(): string {
  return Deno.env.get("SUPABASE_URL") || "";
}

async function fetchSkillContent(skillName: string, githubToken: string): Promise<string> {
  const url = `https://api.github.com/repos/JonDMorrison/JonCoach/contents/.claude/skills/${skillName}/SKILL.md`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${githubToken}`,
      Accept: "application/vnd.github.v3.raw",
    },
  });
  if (!res.ok) return `[Skill "${skillName}" could not be loaded]`;
  return await res.text();
}

async function loadSkillModules(agentId: string, githubToken: string): Promise<string> {
  const skillNames = AGENT_SKILLS[agentId] || [];
  if (skillNames.length === 0) return "";
  const contents = await Promise.all(skillNames.map(name => fetchSkillContent(name, githubToken)));
  return contents.join("\n\n---\n\n");
}

async function loadRecentMemory(agentId: string, workspaceId: string | null): Promise<string> {
  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();
  
  let url = `${baseUrl}/rest/v1/ranked_memories?agent_role=eq.${agentId}&order=effective_importance.desc&limit=10&select=id,memory_text,memory_type,effective_importance`;
  if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
  
  const res = await fetch(url, { headers });
  if (!res.ok) return "";
  const memories = await res.json();
  if (!memories?.length) return "";

  // Bump reference counts
  const memoryIds = memories.map((m: any) => m.id).filter(Boolean);
  if (memoryIds.length > 0) {
    fetch(`${baseUrl}/rest/v1/rpc/bump_memory_references`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ memory_ids: memoryIds }),
    }).catch(e => console.error("[memory-ref] bump failed:", e));
  }
  
  return memories.map((m: any) => `- [${m.memory_type}] ${m.memory_text}`).join("\n");
}

async function updateTaskStatus(taskId: string, status: string, note?: string): Promise<void> {
  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();
  
  const updates: Record<string, unknown> = { status };
  if (status === "completed") updates.completed_at = new Date().toISOString();
  
  await fetch(`${baseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
    method: "PATCH",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify(updates),
  });
  
  // Log event
  await fetch(`${baseUrl}/rest/v1/task_events`, {
    method: "POST",
    headers: { ...headers, Prefer: "return=minimal" },
    body: JSON.stringify({
      task_id: taskId,
      event_type: "status_changed",
      event_payload: { new_status: status, note: note || null },
    }),
  });
}

async function insertBatch(table: string, rows: Record<string, unknown>[]): Promise<number> {
  if (rows.length === 0) return 0;
  const baseUrl = getSupabaseUrl();
  const headers = { ...getSupabaseHeaders(), Prefer: "return=minimal" };
  
  const res = await fetch(`${baseUrl}/rest/v1/${table}`, {
    method: "POST",
    headers,
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`[run-tasks] Failed to insert into ${table}: ${res.status} ${err}`);
    return 0;
  }
  return rows.length;
}

// ─── GUARDRAILS ─────────────────────────────────────────────────────────────

const MEMORY_TRIGGER_PHRASES = [
  "jon prefers", "jon wants", "jon decided", "jon always",
  "jon never", "we agreed", "going forward", "jon said",
  "jon likes", "jon dislikes", "jon chose", "the strategy is",
];

function shouldStoreMemory(memoryText: string): boolean {
  const text = memoryText.toLowerCase();
  const hasSignal = MEMORY_TRIGGER_PHRASES.some(p => text.includes(p));
  const isGeneric = text.includes("likes clear") || text.includes("prefers good") || text.length < 20;
  if (!hasSignal || isGeneric) console.log(`[memory-gate] REJECTED: "${memoryText.slice(0, 80)}"`);
  return hasSignal && !isGeneric;
}

function parseInsight(raw: string | { insight_text: string; evidence?: string; signal_count?: number }): {
  insight_text: string; evidence: string | null; signal_count: number;
} {
  if (typeof raw === "string") return { insight_text: raw, evidence: null, signal_count: 1 };
  return { insight_text: raw.insight_text, evidence: raw.evidence || null, signal_count: raw.signal_count || 1 };
}

function shouldStoreInsight(parsed: { evidence: string | null; signal_count: number }): boolean {
  if (!parsed.evidence || parsed.evidence.length < 5 || parsed.signal_count < 2) {
    console.log(`[insight-gate] REJECTED (evidence=${!!parsed.evidence}, signal=${parsed.signal_count})`);
    return false;
  }
  return true;
}

async function findSimilarActiveTask(workspaceId: string | null, title: string, assignedAgent?: string): Promise<any | null> {
  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();
  let url = `${baseUrl}/rest/v1/tasks?status=in.(pending,queued,in_progress)&limit=20`;
  if (assignedAgent) url += `&assigned_agent=eq.${assignedAgent}`;
  else if (workspaceId) url += `&workspace_id=eq.${workspaceId}`;
  const res = await fetch(url, { headers });
  if (!res.ok) return null;
  const tasks = await res.json();
  const words = title.toLowerCase().split(" ").filter((w: string) => w.length > 4);
  return tasks?.find((t: any) => words.filter((word: string) => t.title.toLowerCase().includes(word)).length >= 2) || null;
}

// ─── EXECUTION PROMPT ───────────────────────────────────────────────────────

function buildExecutionPrompt(
  task: Task,
  workspace: Workspace | null,
  skills: string,
  recentMemory: string
): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString("en-CA", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
    timeZone: "America/Toronto",
  });

  const identity = workspace
    ? `You are the ${task.agent_role} agent for Jon Morrison's ${workspace.name} business.`
    : `You are the ${task.agent_role} agent for Jon Morrison.`;

  return `
## Identity
${identity}
Today is ${dateStr}.

## Workspace
${workspace?.description || 'Executive layer — cross-workspace operations.'}

## Your Memory
${recentMemory || 'No previous memory for this workspace.'}

## Skills
${skills}

## Task
You have been assigned the following task to execute autonomously:

Title: ${task.title}
Description: ${task.description || 'No additional description.'}
Priority: ${task.priority}
Input: ${JSON.stringify(task.input_payload || {})}

Execute this task fully. Produce real output — not a plan to do the work, but the actual work.
If the output is something outbound (email, social post), put it in suggested_approvals.
If you cannot complete this task, explain exactly what is blocking you.
If part of this task belongs to a different agent's domain, use delegate_to.

## Response Format
Respond with a JSON block:

\`\`\`json
{
  "message": "Summary of what you did",
  "output": "The actual deliverable content if applicable",
  "suggested_tasks": [{ "title": "...", "urgency_score": 4, "impact_score": 5 }],
  "suggested_approvals": [],
  "delegate_to": [{ "agent_role": "bloomsuite", "title": "...", "description": "...", "urgency_score": 3, "impact_score": 4 }],
  "suggested_memories": ["Jon prefers..."],
  "insights": [{ "insight_text": "...", "evidence": "...", "signal_count": 3 }]
}
\`\`\`

## Delegation Rules
- Use delegate_to when work belongs to a DIFFERENT agent (bloomsuite, clinicleader, projectpath, disc, inbox, executive)
- Do NOT delegate to yourself — use suggested_tasks instead
- Include enough context in description for the receiving agent to work independently

## Memory Rules
Only store memories that reference Jon's actual words or decisions.
Must contain signal phrases like "Jon prefers", "Jon decided", "we agreed".

## Insight Rules
Only add insights with evidence and signal_count >= 2.
Never add an insight that describes what the product does.

## Task Scoring
- urgency_score (1-5): Time sensitivity. 5 = today.
- impact_score (1-5): Business impact. 5 = revenue/traction.
  `.trim();
}

// ─── PARSE RESPONSE ─────────────────────────────────────────────────────────

function parseAgentResponse(fullText: string): ParsedArtifacts {
  // Try fenced JSON block first
  const jsonBlockRegex = /```json\s*\n([\s\S]*?)\n```\s*$/;
  const match = fullText.match(jsonBlockRegex);

  if (match) {
    try {
      return JSON.parse(match[1]) as ParsedArtifacts;
    } catch {
      return { message: fullText, output: fullText };
    }
  }

  // Try parsing entire response as raw JSON
  const trimmed = fullText.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.message) return parsed as ParsedArtifacts;
    } catch {
      // fall through
    }
  }

  return { message: fullText, output: fullText };
}

// ─── EXECUTE SINGLE TASK ────────────────────────────────────────────────────

async function executeTask(task: Task, workspace: Workspace | null, githubToken: string, tasksCreatedSoFar: number = 0): Promise<{
  taskId: string;
  status: string;
  message: string;
  artifactCounts: { tasks: number; approvals: number; memories: number; insights: number; delegations: number };
}> {
  const result = {
    taskId: task.id,
    status: "completed" as string,
    message: "",
    artifactCounts: { tasks: 0, approvals: 0, memories: 0, insights: 0, delegations: 0 },
  };

  try {
    // Set to in_progress
    await updateTaskStatus(task.id, "in_progress", "Picked up by run-agent-tasks");

    // Load context in parallel
    const [skills, recentMemory] = await Promise.all([
      loadSkillModules(task.agent_role, githubToken),
      loadRecentMemory(task.agent_role, task.workspace_id),
    ]);

    // Build prompt and call Claude via AI Router (reasoning model)
    const systemPrompt = buildExecutionPrompt(task, workspace, skills, recentMemory);

    console.log(`[run-tasks] Using REASONING model (Claude) for task execution: ${task.title}`);

    const aiResult = await runReasoningModel({
      systemPrompt,
      userMessage: `Execute this task: ${task.title}\n\n${task.description || ''}`,
      agentRole: task.agent_role,
      workspaceId: task.workspace_id,
      taskId: task.id,
      callPurpose: "task_execution",
    });

    const fullText = aiResult.text;
    const parsed = parseAgentResponse(fullText);
    
    result.message = parsed.message || fullText.slice(0, 200);

    // Process artifacts with guardrails
    const workspaceId = task.workspace_id;
    const parentDepth = task.depth || 0;

    // --- TASKS: depth limit + deduplication + run/parent caps ---
    const taskRows: Record<string, unknown>[] = [];
    let subtasksForThisParent = 0;
    for (const t of parsed.suggested_tasks || []) {
      // Cap: max tasks created across entire run
      if (tasksCreatedSoFar + taskRows.length >= MAX_TASKS_PER_RUN) {
        console.log(`[run-cap] MAX_TASKS_PER_RUN (${MAX_TASKS_PER_RUN}) reached, skipping: "${t.title}"`);
        break;
      }
      // Cap: max subtasks per parent task
      if (subtasksForThisParent >= MAX_SUBTASKS_PER_PARENT) {
        console.log(`[parent-cap] MAX_SUBTASKS_PER_PARENT (${MAX_SUBTASKS_PER_PARENT}) reached for "${task.title}", skipping: "${t.title}"`);
        break;
      }
      if (parentDepth >= 3) {
        console.log(`[depth-limit] Skipping child task at depth ${parentDepth + 1}: "${t.title}"`);
        await insertBatch("agent_insights", [{
          workspace_id: workspaceId,
          agent_role: task.agent_role,
          insight_text: `Task depth limit reached — skipped: ${t.title}`,
          evidence: `Parent task "${task.title}" is at depth ${parentDepth}`,
          signal_count: 1,
          category: "operational",
        }]);
        continue;
      }
      const similar = await findSimilarActiveTask(workspaceId, t.title || "", task.agent_role);
      if (similar) {
        console.log(`[task-dedup] Skipping "${t.title}" — similar to "${similar.title}"`);
        await insertBatch("task_events", [{
          task_id: similar.id,
          event_type: "agent_note",
          event_payload: { note: `${task.agent_role} suggested similar work: "${t.title}"` },
        }]);
      } else {
        taskRows.push({
          workspace_id: workspaceId,
          agent_role: task.agent_role,
          assigned_agent: task.agent_role,
          created_by_agent: task.agent_role,
          title: (t.title || "Untitled").slice(0, 120),
          description: t.description || null,
          task_type: t.task_type || "general",
          urgency_score: t.urgency_score || 3,
          impact_score: t.impact_score || 3,
          status: "queued",
          source: "agent_task",
          parent_task_id: task.id,
          depth: parentDepth + 1,
          created_by: "agent",
        });
        subtasksForThisParent++;
      }
    }

    // --- MEMORIES: quality gate ---
    const memoryRows = (parsed.suggested_memories || [])
      .filter(m => shouldStoreMemory(m))
      .map(m => ({
        workspace_id: workspaceId,
        agent_role: task.agent_role,
        memory_text: m,
        memory_type: "preference",
        source: "task_execution",
        confidence: "medium",
      }));

    // --- INSIGHTS: evidence filter ---
    const insightRows = (parsed.insights || [])
      .map(parseInsight)
      .filter(shouldStoreInsight)
      .map(ins => ({
        workspace_id: workspaceId,
        agent_role: task.agent_role,
        insight_text: ins.insight_text,
        evidence: ins.evidence,
        signal_count: ins.signal_count,
        category: "general",
      }));

    // --- DELEGATIONS: cross-agent task creation ---
    const delegationRows: Record<string, unknown>[] = [];
    const validAgents = ["bloomsuite", "clinicleader", "projectpath", "disc", "inbox", "executive"];
    for (const d of parsed.delegate_to || []) {
      const targetAgent = d.agent_role;
      if (!targetAgent || targetAgent === task.agent_role || !validAgents.includes(targetAgent)) {
        console.log(`[delegation] Rejected: "${d.title}" → ${targetAgent || "none"}`);
        continue;
      }
      const targetWorkspace = AGENT_WORKSPACE[targetAgent] || null;
      const similar = await findSimilarActiveTask(targetWorkspace, d.title || "", targetAgent);
      if (similar) {
        console.log(`[delegation-dedup] Skipping "${d.title}" → ${targetAgent}`);
        continue;
      }
      delegationRows.push({
        workspace_id: targetWorkspace,
        agent_role: targetAgent,
        assigned_agent: targetAgent,
        created_by_agent: task.agent_role,
        title: (d.title || "Delegated task").slice(0, 120),
        description: d.description || `Delegated from ${task.agent_role}`,
        status: "pending",
        priority: d.priority || 2,
        urgency_score: d.urgency_score || 3,
        impact_score: d.impact_score || 3,
        depth: 0,
        created_by: "agent",
        source: "delegation",
        input_payload: { delegated_from: task.agent_role, parent_task_id: task.id },
      });
    }

    const [taskCount, approvalCount, memoryCount, insightCount, delegationCount] = await Promise.all([
      insertBatch("tasks", taskRows),
      insertBatch("approvals", (parsed.suggested_approvals || []).map(a => ({
        workspace_id: workspaceId,
        agent_role: task.agent_role,
        approval_type: a.approval_type || "general",
        title: a.title || "Untitled",
        preview_text: a.preview_text || null,
        full_payload: { platform: a.platform },
        status: "pending",
      }))),
      insertBatch("agent_memories", memoryRows),
      insertBatch("agent_insights", insightRows),
      insertBatch("tasks", delegationRows),
    ]);

    result.artifactCounts = { tasks: taskCount, approvals: approvalCount, memories: memoryCount, insights: insightCount, delegations: delegationCount };

    // Determine final status
    if (approvalCount > 0) {
      await updateTaskStatus(task.id, "waiting_for_input", `Created ${approvalCount} approval items`);
      result.status = "waiting_for_input";
    } else {
      // Save output to task
      const baseUrl = getSupabaseUrl();
      const headers = { ...getSupabaseHeaders(), Prefer: "return=minimal" };
      await fetch(`${baseUrl}/rest/v1/tasks?id=eq.${task.id}`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          status: "completed",
          completed_at: new Date().toISOString(),
          output_payload: { message: parsed.message, output: parsed.output },
        }),
      });
      
      await fetch(`${baseUrl}/rest/v1/task_events`, {
        method: "POST",
        headers: { ...headers, Prefer: "return=minimal" },
        body: JSON.stringify({
          task_id: task.id,
          event_type: "completed",
          event_payload: { artifact_counts: result.artifactCounts },
        }),
      });
      
      result.status = "completed";
    }

    // Log to agent_outputs
    await insertBatch("agent_outputs", [{
      workspace_id: workspaceId,
      agent_role: task.agent_role,
      raw_message: (parsed.message || fullText).slice(0, 5000),
      tasks_created: taskCount,
      approvals_created: approvalCount,
      memories_created: memoryCount,
      insights_created: insightCount,
      parse_success: true,
    }]);

  } catch (e) {
    console.error(`[run-tasks] Error executing task ${task.id}:`, e);
    await updateTaskStatus(task.id, "failed", e instanceof Error ? e.message : "Unknown error");
    result.status = "failed";
    result.message = e instanceof Error ? e.message : "Unknown error";
  }

  return result;
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────

// ─── SCHEDULED STANDUP: Pre-populate tasks via executive agent ──────────────

async function runScheduledStandup(): Promise<{ message: string; tasksCreated: number }> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();
  const workspaces = ["bloomsuite", "clinicleader", "projectpath", "disc"];

  // Gather cross-workspace context
  const contextParts: string[] = [];
  await Promise.all(workspaces.map(async (ws) => {
    const [tasksRes, approvalsRes, memoriesRes] = await Promise.all([
      fetch(`${baseUrl}/rest/v1/tasks?workspace_id=eq.${ws}&status=in.(pending,queued,blocked,waiting_for_input,in_progress)&order=urgency_score.desc&limit=8&select=title,status,urgency_score,impact_score,agent_role`, { headers }),
      fetch(`${baseUrl}/rest/v1/approvals?workspace_id=eq.${ws}&status=eq.pending&limit=5&select=title,approval_type`, { headers }),
      fetch(`${baseUrl}/rest/v1/ranked_memories?workspace_id=eq.${ws}&order=effective_importance.desc&limit=5&select=memory_text`, { headers }),
    ]);
    const [tasks, approvals, memories] = await Promise.all([
      tasksRes.ok ? tasksRes.json() : [],
      approvalsRes.ok ? approvalsRes.json() : [],
      memoriesRes.ok ? memoriesRes.json() : [],
    ]);

    const parts = [`### ${ws}`];
    if (tasks.length) {
      parts.push("Active tasks:");
      tasks.forEach((t: any) => parts.push(`  - [${t.status}] ${t.title} (U${t.urgency_score}×I${t.impact_score})`));
    } else {
      parts.push("No active tasks.");
    }
    if (approvals.length) {
      parts.push("Pending approvals:");
      approvals.forEach((a: any) => parts.push(`  - ${a.title} (${a.approval_type})`));
    }
    if (memories.length) {
      parts.push("Recent context:");
      memories.forEach((m: any) => parts.push(`  - ${m.memory_text}`));
    }
    contextParts.push(parts.join("\n"));
  }));

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  const systemPrompt = `You are Jon Morrison's Chief of Staff. Today is ${today}.

## Cross-Workspace State

${contextParts.join("\n\n")}

## Your Job

Pre-populate Jon's daily standup with 3-5 queued tasks across his workspaces so they're ready when he opens the app.

Respond in JSON:
{
  "tasks": [
    {
      "workspace_id": "bloomsuite",
      "agent_role": "bloomsuite",
      "title": "Short specific action title",
      "description": "What to do and why",
      "task_type": "content_draft | outreach | research | analysis | build",
      "urgency_score": 4,
      "impact_score": 5
    }
  ]
}

Rules:
- Maximum 5 tasks total
- At least one per workspace with real active work
- Be specific and actionable
- Return raw JSON only`;

  const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: "Generate today's prioritized tasks for Jon's standup." },
      ],
    }),
  });

  if (!aiResponse.ok) {
    const errText = await aiResponse.text();
    throw new Error(`AI error: ${aiResponse.status} ${errText}`);
  }

  const aiData = await aiResponse.json();
  const rawText = aiData.choices?.[0]?.message?.content || "";

  let parsed: any = { tasks: [] };
  try {
    const cleaned = rawText.replace(/```json\s*\n?|```\s*$/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch {
    console.error("[scheduled-standup] Failed to parse executive response");
    return { message: "Failed to parse executive response", tasksCreated: 0 };
  }

  const taskRows = (parsed.tasks || []).slice(0, 5).map((t: any) => ({
    workspace_id: t.workspace_id,
    agent_role: t.agent_role || t.workspace_id,
    assigned_agent: t.agent_role || t.workspace_id,
    created_by_agent: "executive",
    title: (t.title || "Untitled").slice(0, 120),
    description: t.description || null,
    task_type: t.task_type || "general",
    urgency_score: t.urgency_score || 3,
    impact_score: t.impact_score || 3,
    status: "queued",
    source: "scheduled_standup",
    created_by: "executive",
    depth: 0,
  }));

  const count = await insertBatch("tasks", taskRows);
  console.log(`[scheduled-standup] Created ${count} tasks for today's standup`);
  return { message: `Pre-populated ${count} tasks for standup`, tasksCreated: count };
}

// ─── MAIN HANDLER ───────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const isScheduledStandup = body.trigger === "scheduled_standup";

    // Handle scheduled standup separately
    if (isScheduledStandup) {
      console.log("[run-tasks] Triggered by scheduled standup cron");
      const result = await runScheduledStandup();
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GITHUB_TOKEN = Deno.env.get("GITHUB_TOKEN");
    if (!GITHUB_TOKEN) {
      return new Response(
        JSON.stringify({ error: "GITHUB_TOKEN is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = getSupabaseUrl();
    const headers = getSupabaseHeaders();

    // 1. Fetch queued tasks (up to 5, ordered by execution_priority DESC then created_at ASC)
    const tasksRes = await fetch(
      `${baseUrl}/rest/v1/tasks?status=eq.queued&order=execution_priority.desc,created_at.asc&limit=5`,
      { headers }
    );
    if (!tasksRes.ok) {
      const err = await tasksRes.text();
      throw new Error(`Failed to fetch queued tasks: ${tasksRes.status} ${err}`);
    }
    const queuedTasks: Task[] = await tasksRes.json();

    if (queuedTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: "No queued tasks to run.", results: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`[run-tasks] Found ${queuedTasks.length} queued tasks`);

    // 2. Load workspaces for context
    const workspacesRes = await fetch(`${baseUrl}/rest/v1/workspaces?is_active=eq.true`, { headers });
    const workspaces: Workspace[] = workspacesRes.ok ? await workspacesRes.json() : [];
    const workspaceMap = new Map(workspaces.map(w => [w.id, w]));

    // 3. Execute tasks sequentially (to stay within edge function time limits)
    const results = [];
    let totalTasksCreatedThisRun = 0;
    for (const task of queuedTasks) {
      const workspace = task.workspace_id ? workspaceMap.get(task.workspace_id) || null : null;
      const result = await executeTask(task, workspace, GITHUB_TOKEN, totalTasksCreatedThisRun);
      totalTasksCreatedThisRun += result.artifactCounts.tasks;
      results.push(result);
      console.log(`[run-tasks] Task ${task.id} (${task.title}): ${result.status} | Total tasks created this run: ${totalTasksCreatedThisRun}`);
    }

    return new Response(
      JSON.stringify({
        message: `Processed ${results.length} tasks.`,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[run-tasks] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
