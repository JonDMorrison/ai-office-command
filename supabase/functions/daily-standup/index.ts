import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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

async function askAgentForSuggestion(
  apiKey: string,
  agentName: string,
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    console.error(`Anthropic error for ${agentName}: ${res.status} - ${err}`);
    return `[Could not generate suggestion for ${agentName}]`;
  }

  const data = await res.json();
  return data.content?.[0]?.text || `[No suggestion from ${agentName}]`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      return new Response(
        JSON.stringify({ error: "ANTHROPIC_API_KEY is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const today = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    console.log(`Daily standup started: ${today}`);

    // Fetch Gmail data in parallel for BloomSuite and Inbox agents
    const bloomsuiteToken = Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || "";
    const getclearToken = Deno.env.get("GMAIL_REFRESH_TOKEN") || "";

    const [bloomsuiteInbox, getclearInbox, bloomsuiteInboxForInbox] = await Promise.all([
      (async () => {
        try {
          const at = await getGmailAccessToken(bloomsuiteToken);
          return await fetchInboxSummary(at, "brandsinblooms.com");
        } catch (e) {
          console.error("Failed to fetch BloomSuite inbox:", e);
          return "[Gmail unavailable]";
        }
      })(),
      (async () => {
        try {
          const at = await getGmailAccessToken(getclearToken);
          return await fetchInboxSummary(at, "getclear.ca");
        } catch (e) {
          console.error("Failed to fetch getclear inbox:", e);
          return "[Gmail unavailable]";
        }
      })(),
      (async () => {
        try {
          const at = await getGmailAccessToken(bloomsuiteToken);
          return await fetchInboxSummary(at, "brandsinblooms.com");
        } catch (e) {
          return "[Gmail unavailable]";
        }
      })(),
    ]);

    const combinedInbox = `### jon@getclear.ca\n\n${getclearInbox}\n\n### jon@brandsinblooms.com\n\n${bloomsuiteInboxForInbox}`;

    console.log(`Gmail data fetched. BloomSuite: ${bloomsuiteInbox.length}b, GetClear: ${getclearInbox.length}b`);

    // Build agent-specific prompts and call Anthropic in parallel
    const agentPrompts: Record<string, { system: string; user: string }> = {
      bloomsuite: {
        system: `You are BloomSuite, Jon Morrison's garden center marketing AI. Today is ${today}.\n\nHere are the current unread emails for jon@brandsinblooms.com:\n${bloomsuiteInbox}\n\nYou know BloomSuite inside and out — the Marketing Snap audit tool, the brandsinblooms app, content calendars, and garden center marketing strategy.`,
        user: "In one sentence, what is the single most valuable thing Jon could do for BloomSuite this week? Be specific and actionable. Reference real emails or tasks if relevant.",
      },
      clinicleader: {
        system: `You are ClinicLeader, Jon Morrison's clinic operations AI. Today is ${today}. ClinicLeader is a leadership operating system for clinics. The product is strong but distribution is the bottleneck.`,
        user: "Based on the fact that ClinicLeader is blocked by distribution not product, suggest one specific outreach or content action Jon could take today. One sentence, be specific.",
      },
      projectpath: {
        system: `You are ProjectPath, Jon Morrison's construction project management AI. Today is ${today}. ProjectPath is a construction OS with time tracking, estimates, invoicing, and playbooks. The product has been neglected and needs use-case clarity.`,
        user: "ProjectPath is neglected and needs use-case clarity. Suggest one specific thing Jon could do to move it forward today. One sentence, be specific.",
      },
      disc: {
        system: `You are DISC Profile, Jon Morrison's personality assessment AI. Today is ${today}. The DISC Profile app has serious potential for team dynamics consulting but is blocked by positioning.`,
        user: "DISC Profile app has serious potential but is blocked by positioning. Suggest one specific marketing or content action for today. One sentence, be specific.",
      },
      inbox: {
        system: `You are the Inbox agent, Jon Morrison's communication specialist. Today is ${today}.\n\nHere is the full inbox across both accounts:\n${combinedInbox}`,
        user: "What is the most important email or thread Jon needs to handle today? Name the sender and subject if possible. One sentence, be specific.",
      },
      executive: {
        system: `You are Jon Morrison's Chief of Staff. Today is ${today}. You see across all four products: BloomSuite (garden center marketing), ClinicLeader (clinic ops), ProjectPath (construction OS), and DISC Profile (personality assessments). Jon's priorities: traction over activity, distribution over building, one primary product per day.`,
        user: "Looking across all of Jon's products, what is the ONE thing he should focus on today and why? Be decisive — give one answer, not options. One sentence.",
      },
    };

    const agentIds = ["bloomsuite", "clinicleader", "projectpath", "disc", "inbox", "executive"];

    const results = await Promise.all(
      agentIds.map(id =>
        askAgentForSuggestion(
          ANTHROPIC_API_KEY,
          id,
          agentPrompts[id].system,
          agentPrompts[id].user
        )
      )
    );

    const suggestions: Record<string, string> = {};
    agentIds.forEach((id, i) => {
      suggestions[id] = results[i];
    });

    console.log("Daily standup suggestions generated successfully");

    return new Response(
      JSON.stringify({ suggestions }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Daily standup error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});