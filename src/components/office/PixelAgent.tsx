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

  const statusColor = isTyping ? agent.colorHex
    : isWaiting ? '#fbbf24'
    : isReading ? '#7dd3fc'
    : '#334155';

  const breathOffset = bobOffset * 0.4;

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      onClick={onClick}
    >
      {/* Speech bubble */}
      {(isTyping || isWaiting) && (
        <div
          className="animate-bubble-appear absolute -top-10 left-1/2 -translate-x-1/2 w-48 px-3 py-2 rounded border text-[9px] font-pixel leading-relaxed z-10"
          style={{
            backgroundColor: isWaiting ? '#fef3c710' : `${agent.colorHex}10`,
            borderColor: isWaiting ? '#f59e0b40' : `${agent.colorHex}40`,
            color: isWaiting ? '#f59e0b' : agent.colorHex,
          }}
        >
          {isWaiting ? '⚠ Needs your input' : agent.tasks[taskIndex]}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${isWaiting ? '#f59e0b40' : `${agent.colorHex}40`}`,
            }}
          />
        </div>
      )}

      {/* Pixel art character image */}
      <div
        className="relative"
        style={{
          transform: `translateY(${breathOffset}px)`,
          transition: 'transform 0.6s ease-in-out',
        }}
      >
        <img
          src={agentImages[agent.id]}
          alt={agent.name}
          className={`w-32 h-32 object-contain drop-shadow-lg ${
            isTyping ? 'animate-agent-type' : isReading ? 'animate-agent-read' : 'animate-agent-breathe'
          }`}
          style={{
            imageRendering: 'pixelated',
            filter: isTyping ? `drop-shadow(0 0 8px ${agent.colorHex}40)` : 'none',
          }}
        />

        {/* Status indicator */}
        <div className="absolute top-1 right-2 z-20">
          <div
            className={`w-3 h-3 rounded-full border-2 ${(isTyping || isReading) ? 'animate-status-pulse' : ''}`}
            style={{
              backgroundColor: statusColor,
              borderColor: `${statusColor}80`,
              boxShadow: `0 0 8px ${statusColor}60`,
            }}
          />
        </div>
      </div>

      {/* Name plate */}
      <div className="mt-1 text-center">
        <div className="font-pixel text-[8px] tracking-wider" style={{ color: agent.colorHex }}>
          {agent.name.toUpperCase()}
        </div>
        <div className="text-[9px] text-muted-foreground mt-0.5">
          {agent.role}
        </div>
        <div
          className="text-[8px] mt-1 px-2 py-0.5 rounded border font-pixel uppercase"
          style={{
            color: statusColor,
            borderColor: `${statusColor}40`,
            backgroundColor: `${statusColor}10`,
          }}
        >
          {state}
        </div>
      </div>

      {/* Selection ring */}
      {isSelected && (
        <div
          className="absolute inset-0 -m-3 rounded border-2 pointer-events-none"
          style={{
            borderColor: `${agent.colorHex}60`,
            boxShadow: `0 0 30px ${agent.colorHex}20, inset 0 0 30px ${agent.colorHex}10`,
          }}
        />
      )}
    </div>
  );
};

export default PixelAgent;
