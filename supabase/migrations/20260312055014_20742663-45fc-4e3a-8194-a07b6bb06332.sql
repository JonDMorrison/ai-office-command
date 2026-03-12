
-- Create a function to compute effective_importance with decay weighting
CREATE OR REPLACE FUNCTION public.memory_effective_importance(
  p_importance integer,
  p_reference_count integer,
  p_last_referenced_at timestamptz,
  p_created_at timestamptz
)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    COALESCE(p_importance, 1)::numeric
    + ln(GREATEST(COALESCE(p_reference_count, 0), 1) + 1)
    - (EXTRACT(EPOCH FROM (now() - COALESCE(p_last_referenced_at, p_created_at))) / 86400.0) * 0.05
$$;

-- Create a view that exposes effective_importance for easy querying
CREATE OR REPLACE VIEW public.ranked_memories AS
SELECT
  *,
  public.memory_effective_importance(importance, reference_count, last_referenced_at, created_at) AS effective_importance
FROM public.agent_memories
ORDER BY public.memory_effective_importance(importance, reference_count, last_referenced_at, created_at) DESC;
