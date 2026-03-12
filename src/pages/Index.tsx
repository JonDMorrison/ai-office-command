import { useState, useCallback, useRef, useEffect } from 'react';
import { agents } from '@/data/agents';
import { useAgentStates } from '@/hooks/useAgentStates';
import { useTasks } from '@/hooks/useTasks';
import HeaderBar from '@/components/office/HeaderBar';
import PixelAgent from '@/components/office/PixelAgent';
import ChatPanel from '@/components/office/ChatPanel';
import StatusBar from '@/components/office/StatusBar';
import SkillsEditor from '@/components/office/SkillsEditor';
import DailyStandup from '@/components/office/DailyStandup';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [standupActive, setStandupActive] = useState(false);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const { states, activeCount, waitingCount, setStandupOverrides } = useAgentStates();
  const { tasks, fetchTasks, createTask } = useTasks();
  const followUpNotes = useRef<Record<string, string>>({});

  // Load persisted tasks on mount
  useEffect(() => {
    fetchTasks({ status: 'approved' });
  }, [fetchTasks]);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(prev => (prev === agentId ? null : agentId));
  };

  const handleStandupApproved = useCallback((approvedIds: string[], followUps: Record<string, string>) => {
    setStandupOverrides(approvedIds);
    followUpNotes.current = followUps;
  }, [setStandupOverrides]);

  const handleStandupDismiss = useCallback(() => {
    setStandupActive(false);
  }, []);

  // Desk positions: U-shape layout
  const deskPositions = [
    { top: '8%', left: '12%' },
    { top: '8%', left: '50%', transform: 'translateX(-50%)' },
    { top: '8%', right: '12%' },
    { top: '52%', left: '20%' },
    { top: '52%', right: '20%' },
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <HeaderBar activeCount={activeCount} waitingCount={waitingCount} onStartStandup={() => setStandupActive(true)} />

      <div className="flex flex-1 overflow-hidden">
        {/* Isometric office floor */}
        <div className="flex-1 iso-floor relative overflow-hidden">

          {/* Office props */}
          <div className="iso-prop" style={{ top: '4%', right: '4%' }}>
            <div className="iso-whiteboard" />
          </div>
          <div className="iso-prop" style={{ bottom: '18%', left: '5%' }}>
            <div className="iso-watercooler" />
          </div>
          <div className="iso-prop" style={{ bottom: '12%', left: '8%' }}>
            <div className="iso-plant" />
          </div>
          <div className="iso-prop" style={{ bottom: '8%', right: '6%' }}>
            <div className="iso-plant" />
          </div>
          <div className="iso-prop" style={{ top: '45%', right: '5%' }}>
            <div className="iso-plant" style={{ width: '22px', height: '16px' }} />
          </div>

          {/* Room label */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground/40 tracking-widest uppercase pointer-events-none select-none">
            Main Office
          </div>

          {/* Agent desk pods */}
          {agents.map((agent, i) => (
            <div
              key={agent.id}
              className="absolute"
              style={deskPositions[i]}
            >
              <PixelAgent
                agent={agent}
                isSelected={agent.id === selectedAgentId}
                onClick={() => handleAgentClick(agent.id)}
                dynamicState={states[agent.id]}
              />
            </div>
          ))}

          {/* Daily Standup overlay */}
          {standupActive && (
            <DailyStandup
              onApproved={handleStandupApproved}
              onDismiss={handleStandupDismiss}
            />
          )}

        </div>

        {selectedAgent && (
          <ChatPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgentId(null)}
            onOpenSkills={() => setShowSkills(true)}
            initialNote={followUpNotes.current[selectedAgent.id]}
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
