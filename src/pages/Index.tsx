import { useState, useCallback, useRef, useEffect } from 'react';
import { agents } from '@/data/agents';
import { useAgentStates } from '@/hooks/useAgentStates';
import { useTasks } from '@/hooks/useTasks';
import { useApprovals } from '@/hooks/useApprovals';
import { TASK_STATUS } from '@/lib/constants';
import HeaderBar from '@/components/office/HeaderBar';
import PixelAgent from '@/components/office/PixelAgent';
import ChatPanel from '@/components/office/ChatPanel';
import StatusBar from '@/components/office/StatusBar';
import SkillsEditor from '@/components/office/SkillsEditor';
import DailyStandup from '@/components/office/DailyStandup';
import ApprovalQueue from '@/components/office/ApprovalQueue';
import ActivityFeed from '@/components/office/ActivityFeed';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [showSkills, setShowSkills] = useState(false);
  const [standupActive, setStandupActive] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const { states, activeCount, waitingCount, setStandupOverrides, refetch: refetchAgentStates } = useAgentStates();
  const { tasks, fetchTasks, createTask } = useTasks();
  const { pendingCount, fetchApprovals } = useApprovals();
  const followUpNotes = useRef<Record<string, string>>({});

  // Load persisted data on mount
  useEffect(() => {
    fetchTasks({ status: TASK_STATUS.QUEUED });
    fetchApprovals({ status: 'pending' });
  }, [fetchTasks, fetchApprovals]);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(prev => (prev === agentId ? null : agentId));
    if (showApprovals) setShowApprovals(false);
  };

  const handleStandupApproved = useCallback((approvedIds: string[], followUps: Record<string, string>) => {
    setStandupOverrides(approvedIds);
    followUpNotes.current = followUps;
  }, [setStandupOverrides]);

  const handleStandupDismiss = useCallback(() => {
    setStandupActive(false);
  }, []);

  const handleOpenApprovals = useCallback(() => {
    setShowApprovals(prev => !prev);
    if (selectedAgentId) setSelectedAgentId(null);
  }, [selectedAgentId]);

  // Desk positions: U-shape layout
  // Desk positions: U-shape with executive centered and elevated
  const deskPositions = [
    { top: '6%', left: '8%' },       // bloomsuite
    { top: '6%', left: '50%', transform: 'translateX(-50%)' },  // clinicleader
    { top: '6%', right: '8%' },      // projectpath
    { top: '54%', left: '10%' },     // disc
    { top: '54%', right: '10%' },    // inbox
    { top: '48%', left: '50%', transform: 'translateX(-50%)' }, // executive — centered, slightly higher
  ];

  return (
    <div className="flex flex-col h-screen bg-background">
      <HeaderBar
        activeCount={activeCount}
        waitingCount={waitingCount}
        onStartStandup={() => setStandupActive(true)}
        pendingApprovals={pendingCount}
        onOpenApprovals={handleOpenApprovals}
        onTasksRan={refetchAgentStates}
      />

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
              onCreateTask={createTask}
            />
          )}

        </div>

        {selectedAgent && !showApprovals && (
          <ChatPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgentId(null)}
            onOpenSkills={() => setShowSkills(true)}
            initialNote={followUpNotes.current[selectedAgent.id]}
          />
        )}

        {showApprovals && (
          <ApprovalQueue onClose={() => setShowApprovals(false)} />
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
