/**
 * ═══════════════════════════════════════════════════════════════════════════
 * AI Model Configuration — JonCoach Founder OS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Claude = Brain  → Reasoning, planning, writing, synthesis
 * Gemini = Hands  → Classification, parsing, routing, tagging
 *
 * This file documents the model architecture for frontend reference.
 * Actual routing happens server-side in supabase/functions/_shared/aiRouter.ts
 * ═══════════════════════════════════════════════════════════════════════════
 */

export const AI_MODEL_CONFIG = {
  reasoning: {
    id: "claude-sonnet-4-20250514",
    provider: "anthropic",
    label: "Claude Sonnet 4",
    role: "Reasoning, planning, writing, synthesis",
    useCases: [
      "Executive standup analysis",
      "Task prioritization and planning",
      "Strategy recommendations",
      "Writing emails and content",
      "Generating suggested tasks",
      "Creating approval drafts",
      "Producing insights and memories",
      "Cross-workspace synthesis",
      "Research summaries",
      "Agent chat conversations",
    ],
  },
  utility: {
    id: "google/gemini-2.5-flash",
    provider: "lovable-gateway",
    label: "Gemini 2.5 Flash",
    role: "Classification, parsing, routing, tagging",
    useCases: [
      "Text classification",
      "Parsing structured data",
      "Routing decisions",
      "Short email summaries",
      "Extracting structured fields",
      "Tagging tasks",
      "Spam detection",
      "Simple formatting",
      "Short deterministic responses",
    ],
  },
} as const;

/**
 * Model assignment by function:
 *
 * agent-chat           → Claude (all agents use reasoning for conversations)
 * run-agent-tasks      → Claude (task execution requires reasoning)
 * daily-standup        → Claude (executive synthesis)
 * scheduled standup    → Claude (cross-workspace prioritization)
 *
 * Future utility model uses:
 * - Email intent classification
 * - Task type auto-tagging
 * - Spam/priority routing
 * - Short field extraction
 */
