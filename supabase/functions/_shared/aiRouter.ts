/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Router — Dual-Model Architecture for JonCoach Founder OS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Claude = Brain  → Reasoning, planning, writing, synthesis
 * Gemini = Hands  → Classification, parsing, routing, tagging
 *
 * Claude decides what to do.
 * Gemini performs small mechanical tasks.
 *
 * NEVER use Gemini for executive reasoning or task planning.
 * NEVER use Claude for trivial classification or tagging.
 * ═══════════════════════════════════════════════════════════════════════════
 */

// ─── Model Config ───────────────────────────────────────────────────────────

export const AI_MODELS = {
  reasoning: {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic" as const,
    label: "Claude Sonnet 4",
    role: "Reasoning, planning, writing, synthesis",
    maxTokens: 4096,
  },
  utility: {
    id: "google/gemini-2.5-flash",
    provider: "lovable-gateway" as const,
    label: "Gemini 2.5 Flash",
    role: "Classification, parsing, routing, tagging",
    maxTokens: 2048,
  },
} as const;

// ─── Prompt length guardrail ────────────────────────────────────────────────

const PROMPT_LENGTH_THRESHOLD = 3000; // chars (~750 tokens) — auto-route to Claude

// ─── Task types that REQUIRE reasoning ──────────────────────────────────────

const REASONING_REQUIRED_TASK_TYPES = new Set([
  "content_draft",
  "research",
  "analysis",
  "outreach",
  "strategy",
  "build",
  "general", // default type — safer to use Claude
]);

// ─── Types ──────────────────────────────────────────────────────────────────

export interface AICallOptions {
  systemPrompt: string;
  userMessage: string;
  maxTokens?: number;
  // Logging metadata
  agentRole?: string;
  workspaceId?: string | null;
  taskId?: string | null;
  callPurpose?: string; // e.g. "task_execution", "standup_synthesis", "email_classification"
}

export interface AICallResult {
  text: string;
  model: string;
  provider: string;
  tokensUsed?: number;
}

// ─── Guardrail check ────────────────────────────────────────────────────────

function shouldForceReasoning(prompt: string, taskType?: string): { force: boolean; reason: string } {
  // Long prompts → Claude
  if (prompt.length > PROMPT_LENGTH_THRESHOLD) {
    return { force: true, reason: `prompt_length_${prompt.length}_chars` };
  }
  // Reasoning-required task types → Claude
  if (taskType && REASONING_REQUIRED_TASK_TYPES.has(taskType)) {
    return { force: true, reason: `task_type_${taskType}` };
  }
  return { force: false, reason: "" };
}

// ─── Call Anthropic Claude ──────────────────────────────────────────────────

async function callClaude(opts: AICallOptions): Promise<AICallResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODELS.reasoning.id,
      max_tokens: opts.maxTokens || AI_MODELS.reasoning.maxTokens,
      system: opts.systemPrompt,
      messages: [{ role: "user", content: opts.userMessage }],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[aiRouter] Claude error: ${response.status} ${errText}`);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.content?.[0]?.text || "",
    model: AI_MODELS.reasoning.id,
    provider: "anthropic",
    tokensUsed: data.usage?.output_tokens,
  };
}

// ─── Call Anthropic Claude with conversation messages ────────────────────────

async function callClaudeConversation(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  maxTokens?: number,
): Promise<AICallResult> {
  const apiKey = Deno.env.get("ANTHROPIC_API_KEY");
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODELS.reasoning.id,
      max_tokens: maxTokens || AI_MODELS.reasoning.maxTokens,
      system: systemPrompt,
      messages,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[aiRouter] Claude conversation error: ${response.status} ${errText}`);
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.content?.[0]?.text || "",
    model: AI_MODELS.reasoning.id,
    provider: "anthropic",
    tokensUsed: data.usage?.output_tokens,
  };
}

// ─── Call Gemini via Lovable AI Gateway ──────────────────────────────────────

async function callGemini(opts: AICallOptions): Promise<AICallResult> {
  const apiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: AI_MODELS.utility.id,
      messages: [
        { role: "system", content: opts.systemPrompt },
        { role: "user", content: opts.userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error(`[aiRouter] Gemini error: ${response.status} ${errText}`);

    if (response.status === 429) throw new Error("RATE_LIMITED");
    if (response.status === 402) throw new Error("CREDITS_EXHAUSTED");
    throw new Error(`Gemini gateway error: ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.choices?.[0]?.message?.content || "",
    model: AI_MODELS.utility.id,
    provider: "lovable-gateway",
    tokensUsed: data.usage?.completion_tokens,
  };
}

// ─── Logging helper ─────────────────────────────────────────────────────────

function logAICall(tier: string, opts: AICallOptions, result: AICallResult) {
  console.log(
    `[aiRouter] ${tier.toUpperCase()} | model=${result.model} | agent=${opts.agentRole || "?"} | ws=${opts.workspaceId || "?"} | task=${opts.taskId || "none"} | purpose=${opts.callPurpose || "?"} | tokens=${result.tokensUsed || "?"}`
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════

/**
 * runReasoningModel — Claude (Brain)
 *
 * Use for: executive analysis, task planning, content writing,
 * strategy, research, cross-workspace synthesis, generating tasks,
 * creating approvals, producing insights/memories.
 *
 * NEVER use for trivial classification or tagging.
 */
export async function runReasoningModel(opts: AICallOptions): Promise<AICallResult> {
  const result = await callClaude(opts);
  logAICall("reasoning", opts, result);
  return result;
}

/**
 * runReasoningModelConversation — Claude with multi-turn messages
 *
 * Use for: agent chat conversations that need full message history.
 */
export async function runReasoningModelConversation(
  systemPrompt: string,
  messages: Array<{ role: string; content: string }>,
  opts?: { agentRole?: string; workspaceId?: string | null; maxTokens?: number },
): Promise<AICallResult> {
  const result = await callClaudeConversation(systemPrompt, messages, opts?.maxTokens);
  console.log(
    `[aiRouter] REASONING (conversation) | model=${result.model} | agent=${opts?.agentRole || "?"} | ws=${opts?.workspaceId || "?"}`
  );
  return result;
}

/**
 * runUtilityModel — Gemini Flash (Hands)
 *
 * Use for: text classification, parsing, routing decisions,
 * short email summaries, extracting structured fields, tagging tasks,
 * spam detection, simple formatting, short responses.
 *
 * NEVER use for executive reasoning or task planning.
 *
 * Guardrails:
 * - If prompt > 3000 chars, auto-routes to Claude with a warning.
 * - If task_type is reasoning-required, rejects the call.
 */
export async function runUtilityModel(opts: AICallOptions & { taskType?: string }): Promise<AICallResult> {
  // Guardrail: check if this should be forced to reasoning
  const guard = shouldForceReasoning(
    opts.systemPrompt + opts.userMessage,
    opts.taskType,
  );

  if (guard.force) {
    console.warn(
      `[aiRouter] GUARDRAIL: Utility model rejected → routing to Claude. Reason: ${guard.reason} | agent=${opts.agentRole} | purpose=${opts.callPurpose}`
    );
    const result = await callClaude(opts);
    logAICall("reasoning (auto-upgraded)", opts, result);
    return result;
  }

  const result = await callGemini(opts);
  logAICall("utility", opts, result);
  return result;
}
