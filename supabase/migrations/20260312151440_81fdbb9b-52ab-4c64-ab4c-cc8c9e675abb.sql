-- Add ownership columns to tasks table
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS assigned_agent text;
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS created_by_agent text;

-- Backfill: assigned_agent defaults to agent_role, created_by_agent defaults based on source
UPDATE public.tasks SET assigned_agent = agent_role WHERE assigned_agent IS NULL;
UPDATE public.tasks SET created_by_agent = CASE
  WHEN source = 'delegation' THEN COALESCE((input_payload->>'delegated_from')::text, 'system')
  WHEN source = 'scheduled_standup' THEN 'executive'
  WHEN source = 'executive_standup' THEN 'executive'
  WHEN created_by = 'agent' THEN agent_role
  ELSE 'system'
END WHERE created_by_agent IS NULL;