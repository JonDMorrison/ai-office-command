import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { runReasoningModel } from "../_shared/aiRouter.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getSupabaseHeaders(): Record<string, string> {
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  return {
    apikey: key,
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
}

function getSupabaseUrl(): string {
  return Deno.env.get("SUPABASE_URL") || "";
}

// ─── Gmail helpers (kept for inbox context) ─────────────────────────────────

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
  return data.access_token || "";
}

async function fetchInboxSummary(accessToken: string, label: string): Promise<string> {
  if (!accessToken) return `[${label}: Gmail unavailable]`;
  try {
    const listRes = await fetch(
      "https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10&q=is:unread",
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const listData = await listRes.json();
    const messages = listData.messages || [];
    const summaries = await Promise.all(messages.map(async (msg: any) => {
      const msgRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=From&metadataHeaders=Subject`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const msgData = await msgRes.json();
      const headers = msgData.payload?.headers || [];
      const subject = headers.find((h: any) => h.name === "Subject")?.value || "(no subject)";
      const from = headers.find((h: any) => h.name === "From")?.value || "unknown";
      return `[${label}] From: ${from} | Subject: ${subject}`;
    }));
    return summaries.join("\n");
  } catch (e) {
    console.error(`Gmail fetch failed for ${label}:`, e);
    return `[${label}: Gmail unavailable]`;
  }
}

// ─── Cross-workspace context from DB ────────────────────────────────────────

async function getExecutiveStandupContext(): Promise<Record<string, any>> {
  const baseUrl = getSupabaseUrl();
  const headers = getSupabaseHeaders();
  const workspaces = ["bloomsuite", "clinicleader", "projectpath", "disc"];
  const context: Record<string, any> = {};

  await Promise.all(workspaces.map(async (ws) => {
    const [tasksRes, approvalsRes, memoriesRes, insightsRes] = await Promise.all([
      fetch(
        `${baseUrl}/rest/v1/tasks?workspace_id=eq.${ws}&status=in.(pending,queued,blocked,waiting_for_input,in_progress)&order=urgency_score.desc&limit=8&select=title,status,urgency_score,impact_score,agent_role`,
        { headers }
      ),
      fetch(
        `${baseUrl}/rest/v1/approvals?workspace_id=eq.${ws}&status=eq.pending&limit=5&select=title,approval_type,agent_role`,
        { headers }
      ),
      fetch(
        `${baseUrl}/rest/v1/ranked_memories?workspace_id=eq.${ws}&order=effective_importance.desc&limit=5&select=memory_text,effective_importance`,
        { headers }
      ),
      fetch(
        `${baseUrl}/rest/v1/agent_insights?workspace_id=eq.${ws}&order=created_at.desc&limit=3&select=insight_text,signal_count,evidence`,
        { headers }
      ),
    ]);

    const [tasks, approvals, memories, insights] = await Promise.all([
      tasksRes.ok ? tasksRes.json() : [],
      approvalsRes.ok ? approvalsRes.json() : [],
      memoriesRes.ok ? memoriesRes.json() : [],
      insightsRes.ok ? insightsRes.json() : [],
    ]);

    context[ws] = {
      activeTasks: tasks,
      pendingApprovals: approvals,
      recentMemories: memories.map((m: any) => m.memory_text),
      recentInsights: insights,
    };
  }));

  return context;
}

// ─── Executive system prompt ────────────────────────────────────────────────

function buildExecutivePrompt(today: string, workspaceContext: string, inboxSummary: string): string {
  return `You are Jon Morrison's Chief of Staff — an executive agent with visibility across all four of his businesses.

Today is ${today}.

## Cross-Workspace State

${workspaceContext}

## Inbox Summary

${inboxSummary || "No unread emails."}

## Your Job During the Daily Standup

1. Read the state of all four workspaces (tasks, approvals, memories, recent insights)
2. Identify the single most important thing across all products
3. Surface the 3-5 highest priority actions Jon should take today
4. Flag anything urgent or blocked
5. Give Jon a clear recommendation on which product deserves his primary focus today

## Response Format

Respond in JSON:
{
  "message": "Your brief executive summary for Jon (2-3 sentences max)",
  "focus_recommendation": "bloomsuite | clinicleader | projectpath | disc",
  "focus_reason": "One sentence explanation of WHY this product needs Jon's focus today",
  "standup_suggestions": [
    {
      "agent_role": "bloomsuite",
      "workspace_id": "bloomsuite",
      "title": "Short specific action title",
      "description": "What to do and why it matters today",
      "urgency_score": 4,
      "impact_score": 5,
      "task_type": "content_draft | outreach | research | analysis | build"
    }
  ]
}

## Rules
- Maximum 5 suggestions total across all workspaces
- At least one suggestion per workspace that has real active work
- Never suggest vague tasks like "review strategy" — be specific and actionable
- Urgency × Impact = execution priority — high scores only for genuinely important items
- Reference actual tasks, approvals, or insights from the workspace state when possible
- If a workspace has blocked tasks, prioritize unblocking them
- Return raw JSON only — no markdown fences`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric",
    });

    console.log(`[daily-standup] Started: ${today} | Using REASONING model (Claude)`);

    // Fetch DB context and Gmail in parallel
    const bloomsuiteToken = Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || "";
    const getclearToken = Deno.env.get("GMAIL_REFRESH_TOKEN") || "";

    const [workspaceContext, bloomInbox, clearInbox] = await Promise.all([
      getExecutiveStandupContext(),
      (async () => {
        try {
          const at = await getGmailAccessToken(bloomsuiteToken);
          return await fetchInboxSummary(at, "brandsinblooms.com");
        } catch { return "[Gmail unavailable]"; }
      })(),
      (async () => {
        try {
          const at = await getGmailAccessToken(getclearToken);
          return await fetchInboxSummary(at, "getclear.ca");
        } catch { return "[Gmail unavailable]"; }
      })(),
    ]);

    const inboxSummary = `${clearInbox}\n${bloomInbox}`;

    // Format workspace context for the prompt
    const contextStr = Object.entries(workspaceContext).map(([ws, data]: [string, any]) => {
      const parts: string[] = [`### ${ws}`];
      if (data.activeTasks?.length) {
        parts.push("Active tasks:");
        data.activeTasks.forEach((t: any) => {
          parts.push(`  - [${t.status}] ${t.title} (urgency: ${t.urgency_score}, impact: ${t.impact_score})`);
        });
      } else {
        parts.push("No active tasks.");
      }
      if (data.pendingApprovals?.length) {
        parts.push("Pending approvals:");
        data.pendingApprovals.forEach((a: any) => parts.push(`  - ${a.title} (${a.approval_type})`));
      }
      if (data.recentMemories?.length) {
        parts.push("Recent context:");
        data.recentMemories.forEach((m: string) => parts.push(`  - ${m}`));
      }
      if (data.recentInsights?.length) {
        parts.push("Recent insights:");
        data.recentInsights.forEach((i: any) => parts.push(`  - ${i.insight_text} (signals: ${i.signal_count})`));
      }
      return parts.join("\n");
    }).join("\n\n");

    console.log(`[daily-standup] Context loaded. Calling reasoning model (Claude)...`);

    // Call Claude via AI Router (executive standup = reasoning task)
    const systemPrompt = buildExecutivePrompt(today, contextStr, inboxSummary);

    const aiResult = await runReasoningModel({
      systemPrompt,
      userMessage: "Run the daily standup. Give me your executive briefing and today's prioritized actions.",
      agentRole: "executive",
      workspaceId: null,
      callPurpose: "daily_standup_synthesis",
    });

    const rawText = aiResult.text;

    // Parse executive response
    let parsed: any = {};
    try {
      const cleaned = rawText.replace(/```json\s*\n?|```\s*$/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("[daily-standup] Failed to parse executive response, using raw text");
      parsed = {
        message: rawText.slice(0, 300),
        focus_recommendation: null,
        focus_reason: null,
        standup_suggestions: [],
      };
    }

    // Build per-agent suggestions map for backward compat with DailyStandup component
    const suggestions: Record<string, string> = {};
    const structuredSuggestions: Array<{
      agent_role: string;
      workspace_id: string;
      title: string;
      description: string;
      urgency_score: number;
      impact_score: number;
      task_type: string;
    }> = parsed.standup_suggestions || [];

    for (const s of structuredSuggestions) {
      suggestions[s.agent_role] = `${s.title} — ${s.description}`;
    }

    console.log(`[daily-standup] Executive briefing complete. Focus: ${parsed.focus_recommendation}. ${structuredSuggestions.length} suggestions.`);

    return new Response(
      JSON.stringify({
        suggestions,
        executive_summary: parsed.message || "",
        focus_recommendation: parsed.focus_recommendation || null,
        focus_reason: parsed.focus_reason || null,
        structured_suggestions: structuredSuggestions,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("[daily-standup] Error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
