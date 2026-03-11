import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

const AGENT_COLORS: Record<string, { jacket: string; skin: string; hair: string; pants: string }> = {
  bloomsuite:   { jacket: '#22c55e', skin: '#f0c8a0', hair: '#4a3728', pants: '#374151' },
  clinicleader:  { jacket: '#3b82f6', skin: '#c68642', hair: '#2c1810', pants: '#1e293b' },
  projectpath:  { jacket: '#f59e0b', skin: '#f5d0a9', hair: '#d4a574', pants: '#44403c' },
  discprofile:   { jacket: '#8b5cf6', skin: '#e8b896', hair: '#1a1a2e', pants: '#312e81' },
  inbox:        { jacket: '#f97316', skin: '#f0c8a0', hair: '#8b4513', pants: '#374151' },
};

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
  dynamicState: AgentDynamicState;
  isWalking?: boolean;
}

const StandingCharacter = ({ agentId }: { agentId: string }) => {
  const c = AGENT_COLORS[agentId] || AGENT_COLORS.bloomsuite;
  return (
    <div className="flex flex-col items-center">
      {/* Hair */}
      <div className="w-[18px] h-[7px] rounded-t-full -mb-[1px] relative z-10" style={{ backgroundColor: c.hair }} />
      {/* Head */}
      <div className="w-[16px] h-[16px] rounded-full relative z-10" style={{ backgroundColor: c.skin }}>
        <div className="absolute top-[5px] left-[3px] w-[3px] h-[3px] rounded-full bg-[#1a1a1a]" />
        <div className="absolute top-[5px] right-[3px] w-[3px] h-[3px] rounded-full bg-[#1a1a1a]" />
      </div>
      {/* Neck */}
      <div className="w-[6px] h-[3px]" style={{ backgroundColor: c.skin }} />
      {/* Torso / Jacket */}
      <div className="w-[22px] h-[18px] rounded-t-sm rounded-b-sm relative" style={{ backgroundColor: c.jacket }}>
        <div className="absolute top-[1px] -left-[4px] w-[4px] h-[13px] rounded-full" style={{ backgroundColor: c.jacket }} />
        <div className="absolute top-[1px] -right-[4px] w-[4px] h-[13px] rounded-full" style={{ backgroundColor: c.jacket }} />
      </div>
      {/* Legs */}
      <div className="flex gap-[3px]">
        <div className="w-[7px] h-[14px] rounded-b-sm" style={{ backgroundColor: c.pants }} />
        <div className="w-[7px] h-[14px] rounded-b-sm" style={{ backgroundColor: c.pants }} />
      </div>
      {/* Shoes */}
      <div className="flex gap-[3px] -mt-[1px]">
        <div className="w-[8px] h-[4px] rounded-b-sm bg-[#1a1a1a]" />
        <div className="w-[8px] h-[4px] rounded-b-sm bg-[#1a1a1a]" />
      </div>
    </div>
  );
};

const getBubbleStyle = (state: string) => {
  switch (state) {
    case 'waiting':
      return { bg: '#fffbeb', border: '#f59e0b', label: '💬 Needs your input' };
    case 'idle':
      return { bg: '#f9fafb', border: '#9ca3af', label: '• Idle' };
    case 'typing':
      return { bg: '#f0fdf4', border: '#22c55e', label: '✦ Working' };
    case 'reading':
      return { bg: '#eff6ff', border: '#3b82f6', label: '◉ Reading' };
    default:
      return { bg: '#f9fafb', border: '#9ca3af', label: state };
  }
};

const PixelAgent = ({ agent, onClick, isSelected, dynamicState, isWalking = false }: PixelAgentProps) => {
  const { state, taskIndex, standupOverride } = dynamicState;
  const isTyping = state === 'typing';
  const isReading = state === 'reading';
  const isActive = isTyping || isReading;

  const bubble = standupOverride
    ? { bg: '#f0fdf4', border: '#22c55e', label: '✦ Working on it...' }
    : getBubbleStyle(state);
  const showTaskText = !standupOverride && (isTyping || isReading);

  return (
    <div
      className={`desk-pod ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {/* Glow ring */}
      <div
        className="desk-glow"
        style={{ boxShadow: `0 0 24px 4px ${agent.colorHex}20, inset 0 0 0 2px ${agent.colorHex}30` }}
      />

      {/* Status bubble — always visible */}
      <div
        className="absolute -top-16 left-1/2 z-20 animate-bubble-appear"
        style={{
          transform: 'translateX(-50%)',
          minWidth: '150px',
          maxWidth: '220px',
          padding: '8px 14px',
          borderRadius: '8px',
          backgroundColor: bubble.bg,
          border: `2px solid ${bubble.border}`,
          color: '#1a1a1a',
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        }}
      >
        <div style={{ fontSize: '13px', fontWeight: 600, lineHeight: 1.3, textAlign: 'center' }}>
          {bubble.label}
        </div>
        {showTaskText && (
          <div className="mt-1 truncate" style={{ fontSize: '10px', fontWeight: 400, color: '#555', textAlign: 'center' }}>
            {agent.tasks[taskIndex]}
          </div>
        )}
        {/* Arrow */}
        <div
          className="absolute bottom-0 left-1/2 translate-y-full"
          style={{
            transform: 'translateX(-50%) translateY(100%)',
            width: 0,
            height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${bubble.border}`,
          }}
        />
      </div>

      {/* Character — standing behind desk, 80x80 min */}
      <div
        className="relative z-10 mb-2 flex items-end justify-center"
        style={{
          width: '80px',
          height: '80px',
          animation: isWalking
            ? 'walk-sway 0.4s ease-in-out infinite'
            : 'idle-float 2s ease-in-out infinite',
        }}
      >
        <div style={{ transform: 'scale(1.3)' }}>
          <StandingCharacter agentId={agent.id} />
        </div>
      </div>

      {/* Desk */}
      <div className="iso-desk">
        <div className="iso-desk-surface" />
        <div className="iso-monitor">
          <div
            className="iso-monitor-glow"
            style={{
              background: isActive
                ? `linear-gradient(135deg, ${agent.colorHex}40, ${agent.colorHex}20)`
                : 'hsl(210 20% 30%)',
            }}
          />
        </div>
      </div>

      {/* Nameplate */}
      <div className="iso-nameplate mt-2">
        <div className="text-[11px] font-semibold leading-tight" style={{ color: agent.colorHex }}>
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