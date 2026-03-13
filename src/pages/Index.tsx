import { useState, useCallback, useRef, useEffect } from 'react';
import { agents } from '@/data/agents';
import { useAgentStates } from '@/hooks/useAgentStates';
import { useTasks } from '@/hooks/useTasks';
import { useApprovals } from '@/hooks/useApprovals';
import { TASK_STATUS } from '@/lib/constants';
import { toast } from 'sonner';
import HeaderBar from '@/components/office/HeaderBar';
import PixelAgent from '@/components/office/PixelAgent';
import ChatPanel, { Message, buildInitialMessages } from '@/components/office/ChatPanel';
import StatusBar from '@/components/office/StatusBar';
import SkillsEditor from '@/components/office/SkillsEditor';
import DailyStandup from '@/components/office/DailyStandup';
import ApprovalQueue from '@/components/office/ApprovalQueue';
import ActivityFeed, { ActivityFeedPanel } from '@/components/office/ActivityFeed';
import OperationsRail from '@/components/office/OperationsRail';

const Index = () => {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const conversationsRef = useRef<Record<string, Message[]>>({});
  const [showSkills, setShowSkills] = useState(false);
  const [standupActive, setStandupActive] = useState(false);
  const [showApprovals, setShowApprovals] = useState(false);
  const [showActivity, setShowActivity] = useState(false);
  const selectedAgent = agents.find(a => a.id === selectedAgentId);
  const { states, activeCount, waitingCount, setStandupOverrides, refetch: refetchAgentStates } = useAgentStates();
  const { tasks, fetchTasks, createTask, updateTaskStatus } = useTasks();
  const { pendingCount, fetchApprovals } = useApprovals();
  const followUpNotes = useRef<Record<string, string>>({});

  useEffect(() => {
    fetchTasks({ status: TASK_STATUS.QUEUED });
    fetchApprovals({ status: 'pending' });
  }, [fetchTasks, fetchApprovals]);

  const handleAgentClick = (agentId: string) => {
    setSelectedAgentId(prev => (prev === agentId ? null : agentId));
    if (showApprovals) setShowApprovals(false);
    if (showActivity) setShowActivity(false);
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
    if (showActivity) setShowActivity(false);
  }, [selectedAgentId, showActivity]);

  const handleOpenActivity = useCallback(() => {
    setShowActivity(prev => !prev);
    if (selectedAgentId) setSelectedAgentId(null);
    if (showApprovals) setShowApprovals(false);
  }, [selectedAgentId, showApprovals]);

  /*
   * Layout: The control room has three visual rows
   *
   * Row 1 (top):     Three workspace agents spread across the top
   * Row 2 (middle):  Executive desk centered, flanked by DISC and Inbox
   * Row 3 (bottom):  Operations rail (left) + Activity feed (right) overlaid
   *
   * The executive is centered and slightly larger — the command position.
   * Workspace agents arc above. Utility agents (DISC, Inbox) flank the executive.
   */

  // Agent order: [bloomsuite, clinicleader, projectpath, disc, inbox, executive]
  const deskPositions: React.CSSProperties[] = [
    // Top row — workspace agents
    { top: '4%', left: '6%' },                                              // bloomsuite
    { top: '2%', left: '50%', transform: 'translateX(-50%)' },             // clinicleader (center-top)
    { top: '4%', right: '6%' },                                             // projectpath
    // Middle row — utility agents flanking executive
    { top: '50%', left: '6%' },                                             // disc
    { top: '50%', right: '6%' },                                            // inbox
    // Executive — centered command position
    { top: '46%', left: '50%', transform: 'translateX(-50%)' },             // executive
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
        {/* Control room floor */}
        <div className="flex-1 control-room-floor relative overflow-hidden">

          {/* Executive zone — subtle radial glow behind executive desk */}
          <div
            className="zone-executive"
            style={{ top: '38%', width: '320px', height: '240px' }}
          />

          {/* Zone labels */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 text-[8px] font-semibold text-muted-foreground/30 tracking-[0.2em] uppercase pointer-events-none select-none">
            Workspace Agents
          </div>
          <div className="absolute top-[42%] left-1/2 -translate-x-1/2 -translate-y-full text-[8px] font-semibold text-muted-foreground/20 tracking-[0.15em] uppercase pointer-events-none select-none">
            Command
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

          {/* Operations Rail — bottom left, inside the room */}
          <OperationsRail />

          {/* Activity Feed trigger — bottom right, inside the room */}
          {!showActivity && <ActivityFeed onOpen={handleOpenActivity} />}

          {/* Daily Standup overlay */}
          {standupActive && (
            <DailyStandup
              onApproved={handleStandupApproved}
              onDismiss={handleStandupDismiss}
              onCreateTask={createTask}
            />
          )}
        </div>

        {/* Side panels */}
        {selectedAgent && !showApprovals && (
          <ChatPanel
            agent={selectedAgent}
            onClose={() => setSelectedAgentId(null)}
            onOpenSkills={() => setShowSkills(true)}
            onOpenApprovals={handleOpenApprovals}
            initialNote={followUpNotes.current[selectedAgent.id]}
            messages={
              conversationsRef.current[selectedAgent.id] ||
              (() => {
                const msgs = buildInitialMessages(selectedAgent, followUpNotes.current[selectedAgent.id]);
                conversationsRef.current[selectedAgent.id] = msgs;
                return msgs;
              })()
            }
            onMessagesChange={(msgs) => {
              conversationsRef.current[selectedAgent.id] = msgs;
            }}
          />
        )}

        {showApprovals && (
          <ApprovalQueue onClose={() => setShowApprovals(false)} />
        )}

        {showActivity && (
          <ActivityFeedPanel onClose={() => setShowActivity(false)} />
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
