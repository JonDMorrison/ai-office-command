
-- Problem 1: Task explosion prevention
ALTER TABLE public.tasks ADD COLUMN parent_task_id uuid REFERENCES public.tasks(id);
ALTER TABLE public.tasks ADD COLUMN depth int DEFAULT 0;
ALTER TABLE public.tasks ADD COLUMN created_by text DEFAULT 'jon';

-- Problem 3: Memory quality gate
ALTER TABLE public.agent_memories ADD COLUMN confidence text DEFAULT 'low';

-- Problem 4: Insight evidence requirement
ALTER TABLE public.agent_insights ADD COLUMN evidence text;
ALTER TABLE public.agent_insights ADD COLUMN signal_count int DEFAULT 1;

-- Problem 5: Priority scoring
ALTER TABLE public.tasks ADD COLUMN urgency_score int DEFAULT 3;
ALTER TABLE public.tasks ADD COLUMN impact_score int DEFAULT 3;
ALTER TABLE public.tasks ADD COLUMN execution_priority int GENERATED ALWAYS AS (urgency_score * impact_score) STORED;
