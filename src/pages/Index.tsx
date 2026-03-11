import { useState } from 'react';
import { agents } from '@/data/agents';
import { useAgentStates } from '@/hooks/useAgentStates';
import HeaderBar from '@/components/office/HeaderBar';
import PixelAgent from '@/components/office/PixelAgent';
import ChatPanel from '@/components/office/ChatPanel';
import StatusBar from '@/components/office/StatusBar';
import SkillsEditor from '@/components/office/SkillsEditor';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const { states, activeCount, waitingCount } = useAgentStates();

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(prev => (prev === agentId ? null : agentId));
  };

  return (
    <div className="flex flex-col h-screen bg-background crt-flicker">
      <div className="scanline-overlay" />
      <HeaderBar activeCount={activeCount} waitingCount={waitingCount} />

      <div className="flex flex-1 overflow-hidden">
        {/* Office floor */}
        <div className="flex-1 pixel-grid relative flex items-center justify-center p-8">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />
          <div className="absolute inset-4 border-2 border-border/30 rounded-lg pointer-events-none" />
          <div className="absolute top-8 left-8 text-xl opacity-60 drop-shadow-[0_0_6px_hsl(var(--agent-bloom)/0.4)]">🌱</div>
          <div className="absolute top-8 right-8 text-xl opacity-60 drop-shadow-[0_0_6px_hsl(var(--agent-bloom)/0.4)]">🌱</div>
          <div className="absolute bottom-12 left-8 text-base opacity-50">☕</div>
          <div className="absolute bottom-12 right-8 text-base opacity-50">📋</div>
          <div className="absolute top-6 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-muted-foreground/30 tracking-[0.3em] pointer-events-none">
            · · · JON'S OFFICE · · ·
          </div>

          <div className="flex flex-wrap items-end justify-center gap-12 max-w-5xl">
            {agents.map(agent => (
              <PixelAgent
                key={agent.id}
                agent={agent}
                isSelected={agent.id === selectedAgentId}
                onClick={() => handleAgentClick(agent.id)}
                dynamicState={states[agent.id]}
              />
            ))}
          </div>

          <div className="absolute bottom-4 left-4 font-pixel text-[8px] text-muted-foreground/40 tracking-widest">
            FLOOR 01 — MAIN OPS
          </div>
          <div className="absolute bottom-4 right-4 font-pixel text-[8px] text-muted-foreground/40 tracking-widest">
            {agents.length} STATIONS ONLINE
          </div>
        </div>

        {selectedAgent && (
          <ChatPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgentId(null)}
            onOpenSkills={() => setShowSkills(true)}
          />
        )}
      </div>

      <StatusBar
        states={states}
        selectedAgentId={selectedAgentId}
        onAgentClick={handleAgentClick}
      />

      {showSkills && (
        <SkillsEditor
          initialAgentId={selectedAgentId || undefined}
          onClose={() => setShowSkills(false)}
        />
      )}
    </div>
  );
};

export default Index;
