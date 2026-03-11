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
  const { state, taskIndex, bobOffset } = dynamicState;
  const isTyping = state === 'typing';
  const isWaiting = state === 'waiting';
  const isReading = state === 'reading';

  const breathOffset = bobOffset * 0.4;

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      onClick={onClick}
    >
      {/* Speech bubble */}
      {(isTyping || isWaiting) && (
        <div
          className="animate-bubble-appear absolute -top-10 left-1/2 -translate-x-1/2 w-48 px-3 py-2 rounded-xl text-[9px] leading-relaxed z-10 shadow-md"
          style={{
            backgroundColor: isWaiting ? '#fef3c7' : `${agent.colorHex}12`,
            borderColor: isWaiting ? '#f59e0b40' : `${agent.colorHex}30`,
            color: isWaiting ? '#92400e' : agent.colorHex,
            border: `1px solid ${isWaiting ? '#f59e0b30' : `${agent.colorHex}25`}`,
          }}
        >
          {isWaiting ? '💬 Needs your input' : agent.tasks[taskIndex]}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${isWaiting ? '#f59e0b30' : `${agent.colorHex}25`}`,
            }}
          />
        </div>
      )}

      {/* Desk */}
      <div className="absolute -bottom-2 w-36 h-8 rounded-lg shadow-md"
        style={{
          background: 'linear-gradient(180deg, hsl(30 35% 70%) 0%, hsl(30 30% 62%) 100%)',
          borderBottom: '3px solid hsl(30 25% 55%)',
        }}
      >
        {/* Coffee mug on desk */}
        <span className="absolute -top-3 right-2 text-sm select-none">☕</span>
      </div>

      {/* Character image */}
      <div
        className="relative z-10"
        style={{
          transform: `translateY(${breathOffset}px)`,
          transition: 'transform 0.6s ease-in-out',
        }}
      >
        <img
          src={agentImages[agent.id]}
          alt={agent.name}
          className={`w-28 h-28 object-contain ${
            isTyping ? 'animate-agent-type' : isReading ? 'animate-agent-read' : 'animate-agent-breathe'
          }`}
          style={{ imageRendering: 'pixelated' }}
        />
      </div>

      {/* Name plate */}
      <div className="mt-3 text-center">
        <div className="text-xs font-semibold" style={{ color: agent.colorHex }}>
          {agent.name}
        </div>
        <div className="text-[11px] text-muted-foreground mt-0.5">
          {agent.role}
        </div>
        <div
          className="text-[10px] mt-1.5 px-3 py-1 rounded-full font-medium capitalize"
          style={{
            color: agent.colorHex,
            backgroundColor: `${agent.colorHex}12`,
          }}
        >
          {state === 'idle' ? '• idle' : state === 'typing' ? '✦ working' : state === 'waiting' ? '◦ waiting' : '◉ reading'}
        </div>
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute inset-0 -m-3 rounded-2xl border-2 pointer-events-none"
          style={{
            borderColor: `${agent.colorHex}50`,
            boxShadow: `0 0 20px ${agent.colorHex}15`,
          }}
        />
      )}
    </div>
  );
};

export default PixelAgent;
