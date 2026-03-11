import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { agents, Agent } from '@/data/agents';
import { supabase } from '@/integrations/supabase/client';

interface Skill {
  id: string;
  agent_id: string;
  skill_name: string;
  skill_description: string;
}

interface SkillsEditorProps {
  initialAgentId?: string;
  onClose: () => void;
}

const SkillsEditor = ({ initialAgentId, onClose }: SkillsEditorProps) => {
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId || agents[0].id);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [loading, setLoading] = useState(false);

  const selectedAgent = agents.find(a => a.id === selectedAgentId)!;

  const fetchSkills = async () => {
    const { data } = await supabase
      .from('agent_skills')
      .select('*')
      .eq('agent_id', selectedAgentId)
      .order('created_at', { ascending: true });
    setSkills(data || []);
  };

  useEffect(() => {
    fetchSkills();
  }, [selectedAgentId]);

  const addSkill = async () => {
    if (!newName.trim() || !newDesc.trim()) return;
    setLoading(true);
    await supabase.from('agent_skills').insert({
      agent_id: selectedAgentId,
      skill_name: newName.trim(),
      skill_description: newDesc.trim(),
    });
    setNewName('');
    setNewDesc('');
    await fetchSkills();
    setLoading(false);
  };

  const deleteSkill = async (id: string) => {
    await supabase.from('agent_skills').delete().eq('id', id);
    await fetchSkills();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div
        className="w-[520px] max-h-[80vh] rounded-lg border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'hsl(220 50% 6%)',
          borderColor: `${selectedAgent.colorHex}40`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="font-pixel text-[10px] text-foreground tracking-wider">SKILLS EDITOR</div>
          <button onClick={onClose} className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground">
            <X size={14} />
          </button>
        </div>

        {/* Agent selector */}
        <div className="flex gap-1.5 px-4 py-3 border-b border-border flex-wrap">
          {agents.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAgentId(a.id)}
              className="px-2.5 py-1 rounded-full border text-[10px] transition-all"
              style={{
                backgroundColor: selectedAgentId === a.id ? `${a.colorHex}20` : 'transparent',
                borderColor: selectedAgentId === a.id ? a.colorHex : 'hsl(var(--border))',
                color: selectedAgentId === a.id ? a.colorHex : 'hsl(var(--muted-foreground))',
              }}
            >
              {a.name}
            </button>
          ))}
        </div>

        {/* Skills list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {skills.length === 0 && (
            <div className="text-[10px] text-muted-foreground text-center py-6">
              No skills added yet. Add one below.
            </div>
          )}
          {skills.map(skill => (
            <div
              key={skill.id}
              className="flex items-start gap-2 px-3 py-2 rounded border"
              style={{
                backgroundColor: `${selectedAgent.colorHex}08`,
                borderColor: `${selectedAgent.colorHex}20`,
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold" style={{ color: selectedAgent.colorHex }}>
                  {skill.skill_name}
                </div>
                <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">
                  {skill.skill_description}
                </div>
              </div>
              <button
                onClick={() => deleteSkill(skill.id)}
                className="p-1 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>

        {/* Add skill form */}
        <div className="p-4 border-t border-border space-y-2">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Skill name..."
            className="w-full bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground px-3 py-2 rounded border border-border outline-none focus:border-primary"
          />
          <textarea
            value={newDesc}
            onChange={e => setNewDesc(e.target.value)}
            placeholder="Skill description (this gets appended to the agent's system prompt)..."
            rows={3}
            className="w-full bg-secondary/50 text-xs text-foreground placeholder:text-muted-foreground px-3 py-2 rounded border border-border outline-none focus:border-primary resize-none"
          />
          <button
            onClick={addSkill}
            disabled={!newName.trim() || !newDesc.trim() || loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold transition-all disabled:opacity-40"
            style={{
              backgroundColor: selectedAgent.colorHex,
              color: 'hsl(220 50% 5%)',
            }}
          >
            <Plus size={12} />
            Add Skill
          </button>
        </div>
      </div>
    </div>
  );
};

export default SkillsEditor;
