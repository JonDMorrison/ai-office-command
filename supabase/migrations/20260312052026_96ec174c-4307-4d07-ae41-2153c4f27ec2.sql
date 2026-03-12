
-- 1. Create workspaces table
CREATE TABLE public.workspaces (
  id text PRIMARY KEY,
  name text NOT NULL,
  description text,
  color text,
  gmail_secret_key text,
  notion_page_id text,
  github_repo text,
  supabase_project_id text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Public read access (single-tenant system)
CREATE POLICY "Anyone can read workspaces" ON public.workspaces FOR SELECT TO public USING (true);

-- 2. Create agent_sessions table
CREATE TABLE public.agent_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id text REFERENCES public.workspaces(id),
  agent_role text NOT NULL,
  started_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  message_count int DEFAULT 0,
  summary text
);

ALTER TABLE public.agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read sessions" ON public.agent_sessions FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert sessions" ON public.agent_sessions FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update sessions" ON public.agent_sessions FOR UPDATE TO public USING (true) WITH CHECK (true);

-- 3. Rename company_id to workspace_id across all tables
ALTER TABLE public.tasks RENAME COLUMN company_id TO workspace_id;
ALTER TABLE public.approvals RENAME COLUMN company_id TO workspace_id;
ALTER TABLE public.agent_memories RENAME COLUMN company_id TO workspace_id;
ALTER TABLE public.agent_insights RENAME COLUMN company_id TO workspace_id;
ALTER TABLE public.agent_outputs RENAME COLUMN company_id TO workspace_id;

-- 4. Add new columns to agent_memories
ALTER TABLE public.agent_memories ADD COLUMN importance int DEFAULT 1;
ALTER TABLE public.agent_memories ADD COLUMN last_referenced_at timestamptz;
ALTER TABLE public.agent_memories ADD COLUMN reference_count int DEFAULT 0;

-- 5. Allow workspace_id to be null for executive layer tasks
ALTER TABLE public.tasks ALTER COLUMN workspace_id DROP NOT NULL;
