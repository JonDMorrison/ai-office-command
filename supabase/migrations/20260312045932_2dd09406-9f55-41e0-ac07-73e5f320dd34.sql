
-- Create approvals table
CREATE TABLE public.approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id text NOT NULL,
  agent_role text NOT NULL,
  task_id uuid NULL REFERENCES public.tasks(id) ON DELETE SET NULL,
  approval_type text NOT NULL,
  title text NOT NULL,
  preview_text text,
  full_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  approved_at timestamptz NULL,
  rejected_at timestamptz NULL
);

-- Indexes
CREATE INDEX idx_approvals_company_id ON public.approvals(company_id);
CREATE INDEX idx_approvals_agent_role ON public.approvals(agent_role);
CREATE INDEX idx_approvals_status ON public.approvals(status);
CREATE INDEX idx_approvals_created_at ON public.approvals(created_at DESC);

-- Auto-update updated_at (reuse existing function)
CREATE TRIGGER set_approvals_updated_at
  BEFORE UPDATE ON public.approvals
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Permissive RLS (no auth yet)
ALTER TABLE public.approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read approvals" ON public.approvals FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert approvals" ON public.approvals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update approvals" ON public.approvals FOR UPDATE TO public USING (true) WITH CHECK (true);
CREATE POLICY "Anyone can delete approvals" ON public.approvals FOR DELETE TO public USING (true);
