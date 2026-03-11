import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

const AGENT_COLORS: Record<string, { jacket: string; skin: string; hair: string; pants: string }> = {
  bloomsuite:  { jacket: '#22c55e', skin: '#f0c8a0', hair: '#4a3728', pants: '#374151' },
  clinicleader: { jacket: '#3b82f6', skin: '#c68642', hair: '#2c1810', pants: '#1e293b' },
  projectpath: { jacket: '#f59e0b', skin: '#f5d0a9', hair: '#d4a574', pants: '#44403c' },
  discprofile:  { jacket: '#8b5cf6', skin: '#e8b896', hair: '#1a1a2e', pants: '#312e81' },
  inbox:       { jacket: '#f97316', skin: '#f0c8a0', hair: '#8b4513', pants: '#374151' },
};

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
  dynamicState: AgentDynamicState;
}

/** CSS pixel-art standing character */
const StandingCharacter = ({ agentId, isTyping }: { agentId: string; isTyping: boolean }) => {
  const colors = AGENT_COLORS[agentId] || AGENT_COLORS.bloomsuite;

  return (
    <div className={`flex flex-col items-center ${isTyping ? 'animate-agent-type' : ''}`}>
      {/* Hair */}
      <div
        className="w-[14px] h-[5px] rounded-t-full -mb-[1px] relative z-10"
        style={{ backgroundColor: colors.hair }}
      />
      {/* Head */}
      <div
        className="w-[12px] h-[12px] rounded-full relative z-10"
        style={{ backgroundColor: colors.skin }}
      >
        {/* Eyes */}
        <div className="absolute top-[4px] left-[3px] w-[2px] h-[2px] rounded-full bg-[#1a1a1a]" />
        <div className="absolute top-[4px] right-[3px] w-[2px] h-[2px] rounded-full bg-[#1a1a1a]" />
      </div>
      {/* Neck */}
      <div className="w-[4px] h-[2px]" style={{ backgroundColor: colors.skin }} />
      {/* Body / Jacket */}
      <div
        className="w-[16px] h-[14px] rounded-t-sm rounded-b-sm relative"
        style={{ backgroundColor: colors.jacket }}
      >
        {/* Arms */}
        <div
          className="absolute top-[1px] -left-[3px] w-[3px] h-[10px] rounded-full"
          style={{ backgroundColor: colors.jacket }}
        />
        <div
          className="absolute top-[1px] -right-[3px] w-[3px] h-[10px] rounded-full"
          style={{ backgroundColor: colors.jacket }}
        />
      </div>
      {/* Legs */}
      <div className="flex gap-[2px]">
        <div className="w-[5px] h-[10px] rounded-b-sm" style={{ backgroundColor: colors.pants }} />
        <div className="w-[5px] h-[10px] rounded-b-sm" style={{ backgroundColor: colors.pants }} />
      </div>
      {/* Shoes */}
      <div className="flex gap-[2px] -mt-[1px]">
        <div className="w-[6px] h-[3px] rounded-b-sm bg-[#1a1a1a]" />
        <div className="w-[6px] h-[3px] rounded-b-sm bg-[#1a1a1a]" />
      </div>
    </div>
  );
};

const getBubbleStyle = (state: string, agentColor: string) => {
  switch (state) {
    case 'waiting':
      return { bg: '#fffbeb', border: '#d97706', color: '#1a1a1a', label: '💬 Needs your input' };
    case 'idle':
      return { bg: '#f9fafb', border: '#9ca3af', color: '#1a1a1a', label: '• Idle' };
    case 'typing':
      return { bg: '#f0fdf4', border: '#22c55e', color: '#1a1a1a', label: '✦ Working' };
    case 'reading':
      return { bg: '#f0fdf4', border: '#22c55e', color: '#1a1a1a', label: '◉ Reading' };
    default:
      return { bg: '#f9fafb', border: '#9ca3af', color: '#1a1a1a', label: state };
  }
};

const PixelAgent = ({ agent, onClick, isSelected, dynamicState }: PixelAgentProps) => {
  const { state, taskIndex, standupOverride } = dynamicState;
  const isTyping = state === 'typing';
  const isReading = state === 'reading';
  const isActive = isTyping || isReading;
  const isWaiting = state === 'waiting';

  // If standup override is set, show that instead
  const bubble = standupOverride
    ? { bg: '#f0fdf4', border: '#22c55e', color: '#1a1a1a', label: '✦ Working on it...' }
    : getBubbleStyle(state, agent.colorHex);
  const showTaskText = !standupOverride && (isTyping || isReading);

  return (
    <div
      className={`desk-pod ${isSelected ? 'selected' : ''} ${isActive ? 'active' : ''}`}
      onClick={onClick}
    >
      {/* Active / selected glow ring */}
      <div
        className="desk-glow"
        style={{
          boxShadow: `0 0 24px 4px ${agent.colorHex}20, inset 0 0 0 2px ${agent.colorHex}30`,
        }}
      />

      {/* Status bubble — always visible */}
      <div
        className={`absolute -top-14 left-1/2 -translate-x-1/2 z-20 min-w-[140px] max-w-[200px] px-3 py-2 rounded-lg shadow-lg ${
          isWaiting ? 'iso-bubble' : 'animate-bubble-appear'
        }`}
        style={{
          backgroundColor: bubble.bg,
          border: `2px solid ${bubble.border}`,
          color: bubble.color,
        }}
      >
        <div className="text-[13px] font-semibold leading-snug text-center">
          {bubble.label}
        </div>
        {showTaskText && (
          <div className="text-[10px] font-normal text-[#555] mt-1 leading-snug text-center truncate">
            {agent.tasks[taskIndex]}
          </div>
        )}
        {/* Arrow */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
          style={{
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${bubble.border}`,
          }}
        />
      </div>

      {/* Standing character — positioned above desk */}
      <div className="iso-character relative z-10 mb-1" style={{ transform: 'scale(2.2)' }}>
        <StandingCharacter agentId={agent.id} isTyping={isTyping} />
      </div>

      {/* Desk with monitor */}
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