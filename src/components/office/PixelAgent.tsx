import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

import bloomsuiteImg from '@/assets/agent-bloomsuite-v2.png';
import clinicleaderImg from '@/assets/agent-clinicleader-v2.png';
import projectpathImg from '@/assets/agent-projectpath-v2.png';
import discImg from '@/assets/agent-disc-v2.png';
import inboxImg from '@/assets/agent-inbox-v2.png';
import executiveImg from '@/assets/agent-executive-v2.png';

const AGENT_IMAGES: Record<string, string> = {
  bloomsuite: bloomsuiteImg,
  clinicleader: clinicleaderImg,
  projectpath: projectpathImg,
  discprofile: discImg,
  inbox: inboxImg,
  executive: executiveImg,
};

const getBubbleStyle = (state: string) => {
  switch (state) {
    case 'working':
      return { bg: 'hsl(142 76% 96%)', border: 'hsl(142 71% 45%)', label: '✦ Working' };
    case 'waiting':
      return { bg: 'hsl(48 96% 96%)', border: 'hsl(38 92% 50%)', label: '✋ Awaiting Approval' };
    case 'needs_input':
      return { bg: 'hsl(0 86% 97%)', border: 'hsl(0 84% 60%)', label: '💬 Needs Your Input' };
    case 'blocked':
      return { bg: 'hsl(0 86% 97%)', border: 'hsl(0 72% 51%)', label: '🚫 Blocked' };
    case 'idle':
      return { bg: 'hsl(220 14% 96%)', border: 'hsl(220 9% 64%)', label: '• Idle' };
    default:
      return { bg: 'hsl(220 14% 96%)', border: 'hsl(220 9% 64%)', label: state };
  }
};

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
  dynamicState: AgentDynamicState;
  isWalking?: boolean;
}

const PixelAgent = ({ agent, onClick, isSelected, dynamicState, isWalking = false }: PixelAgentProps) => {
  const { state, taskIndex, standupOverride, activeTaskTitle } = dynamicState;
  const isActive = state === 'working' || state === 'needs_input' || state === 'blocked';

  const bubble = standupOverride
    ? { bg: 'hsl(142 76% 96%)', border: 'hsl(142 71% 45%)', label: '✦ Working on it...' }
    : getBubbleStyle(state);
  const showTaskText = !standupOverride && isActive && activeTaskTitle;

  const agentImage = AGENT_IMAGES[agent.id] || AGENT_IMAGES.bloomsuite;

  return (
    <div
      className={`desk-pod ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {/* Glow ring */}
      <div
        className="desk-glow"
        style={{ boxShadow: `0 0 28px 6px ${agent.colorHex}25, inset 0 0 0 2px ${agent.colorHex}30` }}
      />

      {/* Status bubble */}
      <div
        className="absolute -top-14 left-1/2 z-20 animate-bubble-appear"
        style={{
          transform: 'translateX(-50%)',
          minWidth: '140px',
          maxWidth: '200px',
          padding: '6px 12px',
          borderRadius: '10px',
          backgroundColor: bubble.bg,
          border: `2px solid ${bubble.border}`,
          color: 'hsl(0 0% 10%)',
          boxShadow: '0 4px 12px hsla(0, 0%, 0%, 0.1)',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>
          {bubble.label}
        </div>
        {showTaskText && (
          <div className="mt-0.5 truncate" style={{ fontSize: '10px', fontWeight: 400, color: 'hsl(0 0% 40%)', textAlign: 'center' }}>
            {activeTaskTitle || agent.tasks[taskIndex]}
          </div>
        )}
        <div
          className="absolute bottom-0 left-1/2"
          style={{
            transform: 'translateX(-50%) translateY(100%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${bubble.border}`,
          }}
        />
      </div>

      {/* Character — sits behind desk */}
      <div
        className="relative z-10 flex items-end justify-center"
        style={{
          width: '160px',
          height: '120px',
          marginBottom: '-28px', /* overlap with desk to feel anchored */
          animation: isWalking
            ? 'walk-sway 0.4s ease-in-out infinite'
            : 'idle-float 2.5s ease-in-out infinite',
        }}
      >
        <img
          src={agentImage}
          alt={agent.name}
          className="agent-avatar-img"
          style={{
            width: '120px',
            height: '120px',
            objectFit: 'contain',
            objectPosition: 'bottom',
            filter: isActive
              ? `drop-shadow(0 4px 12px ${agent.colorHex}40)`
              : 'drop-shadow(0 2px 6px hsla(0, 0%, 0%, 0.1))',
            transition: 'filter 0.3s ease',
          }}
          draggable={false}
        />
      </div>

      {/* Desk */}
      <div className="iso-desk" style={{ zIndex: 15 }}>
        <div className="iso-desk-surface" />
        <div className="iso-monitor">
          <div
            className="iso-monitor-glow"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${agent.colorHex}50, ${agent.colorHex}25)`
                : 'hsl(210 20% 30%)',
            }}
          />
        </div>
      </div>

      {/* Nameplate */}
      <div className="iso-nameplate mt-2">
        <div className="text-xs font-semibold leading-tight" style={{ color: agent.colorHex }}>
          {agent.name}
        </div>
        <div className="text-[9px] text-muted-foreground leading-tight mt-0.5">
          {agent.role}
        </div>
      </div>
    </div>
  );
};

export default PixelAgent;
