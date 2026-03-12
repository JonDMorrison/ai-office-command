
-- Agent memories table
CREATE TABLE public.agent_memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  agent_role text NOT NULL,
  memory_text text NOT NULL,
  memory_type text NOT NULL DEFAULT 'preference',
  source text NOT NULL DEFAULT 'conversation',
  relevance_score integer NOT NULL DEFAULT 5,
  expires_at timestamptz NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_memories_lookup ON public.agent_memories(company_id, agent_role, memory_type);
CREATE INDEX idx_memories_relevance ON public.agent_memories(relevance_score DESC);
CREATE INDEX idx_memories_created_at ON public.agent_memories(created_at DESC);

ALTER TABLE public.agent_memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read memories" ON public.agent_memories FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert memories" ON public.agent_memories FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update memories" ON public.agent_memories FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete memories" ON public.agent_memories FOR DELETE TO public USING (true);

-- Agent insights table
CREATE TABLE public.agent_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  agent_role text NOT NULL,
  insight_text text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  source_task_id uuid NULL REFERENCES public.tasks(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_insights_lookup ON public.agent_insights(company_id, agent_role, category);
CREATE INDEX idx_insights_created_at ON public.agent_insights(created_at DESC);

ALTER TABLE public.agent_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read insights" ON public.agent_insights FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert insights" ON public.agent_insights FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete insights" ON public.agent_insights FOR DELETE TO public USING (true);

-- Agent outputs audit log
CREATE TABLE public.agent_outputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  agent_role text NOT NULL,
  conversation_id text NULL,
  raw_message text NOT NULL,
  tasks_created integer NOT NULL DEFAULT 0,
  approvals_created integer NOT NULL DEFAULT 0,
  memories_created integer NOT NULL DEFAULT 0,
  insights_created integer NOT NULL DEFAULT 0,
  parse_success boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_outputs_agent ON public.agent_outputs(company_id, agent_role, created_at DESC);

ALTER TABLE public.agent_outputs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read outputs" ON public.agent_outputs FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert outputs" ON public.agent_outputs FOR INSERT TO public WITH CHECK (true);
