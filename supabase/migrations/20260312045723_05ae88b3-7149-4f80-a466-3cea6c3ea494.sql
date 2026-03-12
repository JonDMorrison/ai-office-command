
-- Create tasks table
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  agent_role text NOT NULL,
  title text NOT NULL,
  description text,
  task_type text NOT NULL DEFAULT 'general',
  status text NOT NULL DEFAULT 'pending',
  priority integer NOT NULL DEFAULT 3,
  requires_approval boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'standup',
  input_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  output_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Create task_events table
CREATE TABLE public.task_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  event_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes on tasks
CREATE INDEX idx_tasks_company_id ON public.tasks(company_id);
CREATE INDEX idx_tasks_agent_role ON public.tasks(agent_role);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_tasks_created_at ON public.tasks(created_at DESC);

-- Indexes on task_events
CREATE INDEX idx_task_events_task_id ON public.task_events(task_id);
CREATE INDEX idx_task_events_created_at ON public.task_events(created_at DESC);

-- Auto-update updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS but with permissive policies (no auth yet)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read tasks" ON public.tasks FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert tasks" ON public.tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update tasks" ON public.tasks FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete tasks" ON public.tasks FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read task_events" ON public.task_events FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert task_events" ON public.task_events FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can delete task_events" ON public.task_events FOR DELETE TO public USING (true);
