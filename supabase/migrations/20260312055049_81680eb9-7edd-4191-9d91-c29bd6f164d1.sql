
-- Function to bump reference count for memories when they're loaded into context
CREATE OR REPLACE FUNCTION public.bump_memory_references(memory_ids uuid[])
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.agent_memories
  SET
    reference_count = COALESCE(reference_count, 0) + 1,
    last_referenced_at = now()
  WHERE id = ANY(memory_ids);
$$;
