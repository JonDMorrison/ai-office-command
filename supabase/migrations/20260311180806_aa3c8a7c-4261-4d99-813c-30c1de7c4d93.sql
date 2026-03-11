CREATE TABLE public.agent_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id TEXT NOT NULL,
  skill_name TEXT NOT NULL,
  skill_description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.agent_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read skills" ON public.agent_skills FOR SELECT USING (true);
CREATE POLICY "Anyone can insert skills" ON public.agent_skills FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete skills" ON public.agent_skills FOR DELETE USING (true);