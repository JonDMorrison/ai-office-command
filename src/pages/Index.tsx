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
    <div className="flex flex-col h-screen bg-background">
      <HeaderBar activeCount={activeCount} waitingCount={waitingCount} />

      <div className="flex flex-1 overflow-hidden">
        {/* Office floor */}
        <div className="flex-1 office-floor relative flex items-center justify-center p-8 overflow-hidden">
          {/* Window on back wall */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[60%] max-w-lg h-40 bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 rounded-b-2xl border-b-4 border-x-4 border-amber-800/30 shadow-lg overflow-hidden">
            {/* Sun */}
            <div className="absolute top-4 right-12 w-14 h-14 rounded-full bg-amber-200 shadow-[0_0_40px_15px_hsla(45,90%,70%,0.5)]" />
            {/* Clouds */}
            <div className="absolute top-8 left-8 w-20 h-6 bg-white/80 rounded-full blur-[1px]" />
            <div className="absolute top-5 left-16 w-14 h-5 bg-white/70 rounded-full blur-[1px]" />
            <div className="absolute top-12 left-[40%] w-24 h-7 bg-white/75 rounded-full blur-[1px]" />
            {/* Window frame */}
            <div className="absolute inset-0 border-4 border-amber-900/15 rounded-b-2xl pointer-events-none" />
            <div className="absolute top-0 bottom-0 left-1/2 w-1 bg-amber-900/15" />
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-amber-900/15" />
          </div>

          {/* Warm light wash from window */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-64 bg-gradient-to-b from-amber-100/40 via-amber-50/20 to-transparent pointer-events-none" />

          {/* Large plant left corner */}
          <div className="absolute bottom-8 left-8 text-4xl opacity-80 select-none">🪴</div>
          {/* Small succulent right */}
          <div className="absolute bottom-8 right-10 text-2xl opacity-70 select-none">🌵</div>
          {/* Coffee station */}
          <div className="absolute top-44 right-8 text-xl opacity-60 select-none">☕</div>

          {/* Room label */}
          <div className="absolute top-44 left-8 text-xs font-medium text-foreground/30 tracking-wide pointer-events-none select-none">
            Main Office
          </div>

          <div className="flex flex-wrap items-end justify-center gap-12 max-w-5xl mt-16">
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
