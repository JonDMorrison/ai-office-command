import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AGENT_SKILLS: Record<string, string[]> = {
  bloomsuite: ["joncoach-core", "bloomsuite-agent", "bloomsuite-copywriting", "brainstorming", "frontend-design"],
  clinicleader: ["joncoach-core", "clinicleader-agent", "internal-comms", "brainstorming"],
  projectpath: ["joncoach-core", "projectpath-agent", "supabase-best-practices", "nextjs-best-practices"],
  disc: ["joncoach-core", "disc-agent", "frontend-design", "supabase-best-practices"],
  inbox: ["joncoach-core", "inbox-agent", "internal-comms"],
};

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

async function getGmailAccessToken(refreshTokenOverride?: string): Promise<string> {
  const clientId = Deno.env.get("GMAIL_CLIENT_ID") || "";
  const clientSecret = Deno.env.get("GMAIL_CLIENT_SECRET") || "";
  const refreshToken = refreshTokenOverride || Deno.env.get("GMAIL_REFRESH_TOKEN") || "";
  
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

async function fetchInboxSummary(accessToken: string): Promise<string> {
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
    return `From: ${from}\nSubject: ${subject}\nSnippet: ${snippet}`;
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
    const responseData = await res.text();
    console.log(`Draft saved successfully: To=${to}, Subject=${subject}, Response: ${responseData}`);
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, agentId } = await req.json();

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

    const skillNames = AGENT_SKILLS[agentId] || [];
    if (skillNames.length === 0) {
      console.warn(`No skills mapped for agentId: ${agentId}`);
    }

    const skillContents = await Promise.all(
      skillNames.map(name => fetchSkillContent(name, GITHUB_TOKEN))
    );

    let systemPrompt = skillContents.join("\n\n---\n\n");

    // For bloomsuite agent, prepend BloomSuite inbox context
    if (agentId === "bloomsuite") {
      try {
        console.log("BloomSuite agent: fetching Gmail access token for jon@brandsinblooms.com...");
        const bloomsuiteRefreshToken = Deno.env.get("GMAIL_REFRESH_TOKEN_BLOOMSUITE") || "";
        const accessToken = await getGmailAccessToken(bloomsuiteRefreshToken);
        const inboxSummary = await fetchInboxSummary(accessToken);
        console.log("BloomSuite agent: fetched inbox summary, length:", inboxSummary.length);
        const inboxContext = inboxSummary.length > 0
          ? "## BloomSuite Inbox (unread)\n\n" + inboxSummary
          : "## BloomSuite Inbox\n\nNo unread emails for jon@brandsinblooms.com.";
        systemPrompt = inboxContext + "\n\n---\n\n" + systemPrompt;
      } catch (e) {
        console.error("Failed to fetch BloomSuite inbox:", e);
        systemPrompt = "## BloomSuite Inbox\n\n[Could not fetch inbox — Gmail API error: " + (e instanceof Error ? e.message : String(e)) + "]\n\n---\n\n" + systemPrompt;
      }
    }

    // For inbox agent, prepend live Gmail context
    if (agentId === "inbox") {
      try {
        console.log("Inbox agent: fetching Gmail access token...");
        const accessToken = await getGmailAccessToken();
        console.log("Inbox agent: access token obtained:", accessToken ? "yes" : "NO TOKEN");
        const inboxSummary = await fetchInboxSummary(accessToken);
        console.log("Inbox agent: fetched inbox summary, length:", inboxSummary.length);
        const draftInstructions = `\n\n## Drafting Emails\nWhen the user asks you to draft, reply to, or compose an email, format the draft using EXACTLY this structure so it gets automatically saved to Gmail Drafts:\n\n[DRAFT]\nTo: recipient@example.com\nSubject: Re: Subject line\nBody: The full email body text here\n[/DRAFT]\n\nYou can include multiple [DRAFT]...[/DRAFT] blocks if needed. The draft will be saved automatically — confirm to the user that the draft has been saved to Gmail.\n`;
        const inboxContext = inboxSummary.length > 0
          ? "## Current Inbox (unread)\nYou have LIVE access to Jon's inbox. The following are REAL unread emails fetched just now. Use this data to answer questions about the inbox. Do NOT tell the user you can't access their email — you already have it.\n\n" + inboxSummary
          : "## Current Inbox\nYou have live Gmail access but there are currently no unread emails. Tell the user their inbox is clear.";
        systemPrompt = inboxContext + draftInstructions + "\n\n---\n\n" + systemPrompt;
      } catch (e) {
        console.error("Failed to fetch Gmail inbox:", e);
        systemPrompt = "## Current Inbox\n\n[Could not fetch inbox — Gmail API error: " + (e instanceof Error ? e.message : String(e)) + "]\n\n---\n\n" + systemPrompt;
      }
    }

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
      console.error("Anthropic API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${response.status}` }),
        { status: response.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || "No response generated.";

    // For inbox agent, parse and save any draft blocks
    if (agentId === "inbox") {
      const drafts = parseDraftBlocks(text);
      if (drafts.length > 0) {
        try {
          const accessToken = await getGmailAccessToken();
          await Promise.all(drafts.map(d => saveGmailDraft(accessToken, d.to, d.subject, d.body)));
          console.log(`Saved ${drafts.length} Gmail draft(s)`);
        } catch (e) {
          console.error("Failed to save Gmail drafts:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({ text }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Edge function error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
