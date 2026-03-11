import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

import bloomsuiteImg from '@/assets/agent-bloomsuite.png';
import clinicleaderImg from '@/assets/agent-clinicleader.png';
import projectpathImg from '@/assets/agent-projectpath.png';
import discImg from '@/assets/agent-disc.png';
import inboxImg from '@/assets/agent-inbox.png';

const agentImages: Record<string, string> = {
  bloomsuite: bloomsuiteImg,
  clinicleader: clinicleaderImg,
  projectpath: projectpathImg,
  discprofile: discImg,
  inbox: inboxImg,
};

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
  dynamicState: AgentDynamicState;
}

const PixelAgent = ({ agent, onClick, isSelected, dynamicState }: PixelAgentProps) => {
  const { state, taskIndex } = dynamicState;
  const isTyping = state === 'typing';
  const isWaiting = state === 'waiting';
  const isReading = state === 'reading';
  const isActive = isTyping || isReading;

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

      {/* Speech bubble for typing/waiting */}
      {(isTyping || isWaiting) && (
        <div
          className={`absolute -top-12 left-1/2 -translate-x-1/2 z-20 w-44 px-2.5 py-1.5 rounded-lg text-[9px] leading-relaxed shadow-md ${
            isWaiting ? 'iso-bubble' : 'animate-bubble-appear'
          }`}
          style={{
            backgroundColor: isWaiting ? '#fef3c7' : `${agent.colorHex}10`,
            border: `1px solid ${isWaiting ? '#f59e0b30' : `${agent.colorHex}20`}`,
            color: isWaiting ? '#92400e' : agent.colorHex,
          }}
        >
          {isWaiting ? '💬 Needs your input' : agent.tasks[taskIndex]}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: `5px solid ${isWaiting ? '#f59e0b30' : `${agent.colorHex}20`}`,
            }}
          />
        </div>
      )}

      {/* Character — floats above desk */}
      <div className="iso-character relative z-10 mb-1">
        <img
          src={agentImages[agent.id]}
          alt={agent.name}
          className={`w-20 h-20 object-contain ${
            isTyping ? 'animate-agent-type' : isReading ? 'animate-agent-read' : ''
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
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

      {/* Status badge */}
      <div
        className="mt-1 text-[9px] px-2 py-0.5 rounded-full font-medium capitalize"
        style={{
          color: agent.colorHex,
          backgroundColor: `${agent.colorHex}10`,
        }}
      >
        {state === 'idle' ? '• idle' : state === 'typing' ? '✦ working' : state === 'waiting' ? '◦ waiting' : '◉ reading'}
      </div>
    </div>
  );
};

export default PixelAgent;