import { useState } from 'react';
import { agents } from '@/data/agents';
import { useAgentStates } from '@/hooks/useAgentStates';
import HeaderBar from '@/components/office/HeaderBar';
import PixelAgent from '@/components/office/PixelAgent';
import ChatPanel from '@/components/office/ChatPanel';
import StatusBar from '@/components/office/StatusBar';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const { states, activeCount, waitingCount } = useAgentStates();

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(prev => (prev === agentId ? null : agentId));
  };

  return (
    <div className="flex flex-col h-screen bg-background crt-flicker">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <HeaderBar activeCount={activeCount} waitingCount={waitingCount} />

      <div className="flex flex-1 overflow-hidden">
        {/* Office floor */}
        <div className="flex-1 pixel-grid relative flex items-center justify-center p-8">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

          {/* Room wall border */}
          <div className="absolute inset-4 border-2 border-border/30 rounded-lg pointer-events-none" />

          {/* Room decorations */}
          <div className="absolute top-8 left-8 text-xl opacity-60 drop-shadow-[0_0_6px_hsl(var(--agent-bloom)/0.4)]">🌱</div>
          <div className="absolute top-8 right-8 text-xl opacity-60 drop-shadow-[0_0_6px_hsl(var(--agent-bloom)/0.4)]">🌱</div>
          <div className="absolute bottom-12 left-8 text-base opacity-50">☕</div>
          <div className="absolute bottom-12 right-8 text-base opacity-50">📋</div>

          {/* Floor label */}
          <div className="absolute top-6 left-1/2 -translate-x-1/2 font-pixel text-[8px] text-muted-foreground/30 tracking-[0.3em] pointer-events-none">
            · · · JON'S OFFICE · · ·
          </div>

          {/* Agent grid */}
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

          {/* Floor labels */}
          <div className="absolute bottom-4 left-4 font-pixel text-[8px] text-muted-foreground/40 tracking-widest">
            FLOOR 01 — MAIN OPS
          </div>
          <div className="absolute bottom-4 right-4 font-pixel text-[8px] text-muted-foreground/40 tracking-widest">
            {agents.length} STATIONS ONLINE
          </div>
        </div>

        {/* Chat panel */}
        {selectedAgent && (
          <ChatPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgentId(null)}
          />
        )}
      </div>

      {/* Status bar */}
      <StatusBar
        states={states}
        selectedAgentId={selectedAgentId}
        onAgentClick={handleAgentClick}
      />
    </div>
  );
};

export default Index;
