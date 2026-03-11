import { useState } from 'react';
import { agents } from '@/data/agents';
import HeaderBar from '@/components/office/HeaderBar';
import PixelAgent from '@/components/office/PixelAgent';
import ChatPanel from '@/components/office/ChatPanel';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);

  return (
    <div className="flex flex-col h-screen bg-background crt-flicker">
      {/* Scanline overlay */}
      <div className="scanline-overlay" />

      <HeaderBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Office floor */}
        <div className="flex-1 pixel-grid relative flex items-center justify-center p-8">
          {/* Ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent pointer-events-none" />

          {/* Agent grid */}
          <div className="flex flex-wrap items-end justify-center gap-12 max-w-5xl">
            {agents.map(agent => (
              <PixelAgent
                key={agent.id}
                agent={agent}
                isSelected={agent.id === selectedAgentId}
                onClick={() =>
                  setSelectedAgentId(prev => (prev === agent.id ? null : agent.id))
                }
              />
            ))}
          </div>

          {/* Floor label */}
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
    </div>
  );
};

export default Index;
