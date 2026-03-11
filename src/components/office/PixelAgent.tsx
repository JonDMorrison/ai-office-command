import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
  dynamicState: AgentDynamicState;
}

const PixelAgent = ({ agent, onClick, isSelected, dynamicState }: PixelAgentProps) => {
  const { state, taskIndex, bobOffset, blinkOn } = dynamicState;
  const isTyping = state === 'typing';
  const isWaiting = state === 'waiting';
  const isReading = state === 'reading';

  const statusColor = isTyping ? agent.colorHex
    : isWaiting ? '#fbbf24'
    : isReading ? '#7dd3fc'
    : '#334155';

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      onClick={onClick}
      style={{ transform: `translateY(${bobOffset}px)` }}
    >
      {/* Speech bubble */}
      {(isTyping || isWaiting) && (
        <div
          className="animate-bubble-appear absolute -top-16 left-1/2 -translate-x-1/2 w-48 px-3 py-2 rounded border text-[9px] font-pixel leading-relaxed z-10"
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

      {/* Agent body */}
      <div className="relative">
        {/* Head with avatar */}
        <div
          className="w-10 h-10 rounded-sm border-2 relative flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${agent.colorHex}40, ${agent.colorHex}15)`,
            borderColor: agent.colorHex,
            boxShadow: `0 0 12px ${agent.colorHex}40`,
          }}
        >
          <span className="text-sm z-10">{agent.avatar}</span>
          {/* Eyes */}
          <div className="absolute bottom-1.5 left-1.5 flex gap-2">
            <div
              className="w-1.5 rounded-sm transition-all duration-100"
              style={{
                backgroundColor: '#0f172a',
                height: blinkOn ? '6px' : '1px',
              }}
            />
            <div
              className="w-1.5 rounded-sm transition-all duration-100"
              style={{
                backgroundColor: '#0f172a',
                height: blinkOn ? '6px' : '1px',
              }}
            />
          </div>
        </div>

        {/* Body */}
        <div
          className="w-10 h-6 mt-0.5 rounded-sm border-2"
          style={{
            background: `linear-gradient(180deg, ${agent.colorHex}30, ${agent.colorHex}15)`,
            borderColor: `${agent.colorHex}80`,
          }}
        />

        {/* Arms */}
        <div
          className="absolute top-[26px] -left-1.5 w-2.5 h-3.5 rounded-sm border transition-transform duration-150"
          style={{
            backgroundColor: `${agent.colorHex}30`,
            borderColor: `${agent.colorHex}60`,
            transformOrigin: 'top center',
            transform: isTyping ? `rotate(${bobOffset === -3 ? -15 : 15}deg)` : 'rotate(0deg)',
          }}
        />
        <div
          className="absolute top-[26px] -right-1.5 w-2.5 h-3.5 rounded-sm border transition-transform duration-150"
          style={{
            backgroundColor: `${agent.colorHex}30`,
            borderColor: `${agent.colorHex}60`,
            transformOrigin: 'top center',
            transform: isTyping ? `rotate(${bobOffset === -3 ? 15 : -15}deg)` : 'rotate(0deg)',
          }}
        />

        {/* Legs */}
        <div className="flex justify-center gap-1 -mt-0.5">
          <div className="w-2.5 h-2.5 rounded-b-sm" style={{ backgroundColor: `${agent.colorHex}25` }} />
          <div className="w-2.5 h-2.5 rounded-b-sm" style={{ backgroundColor: `${agent.colorHex}25` }} />
        </div>

        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full border ${(isTyping || isReading) ? 'animate-status-pulse' : ''}`}
            style={{
              backgroundColor: statusColor,
              borderColor: `${statusColor}80`,
            }}
          />
        </div>
      </div>

      {/* Desk — wooden style */}
      <div
        className="w-20 h-3 mt-1 rounded-t-sm border"
        style={{
          background: 'linear-gradient(180deg, hsl(30 60% 30%), hsl(30 50% 22%))',
          borderColor: 'hsl(30 50% 35%)',
          boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
        }}
      />

      {/* Monitor on desk */}
      <div className="relative -mt-10 mb-7">
        <div
          className="w-14 h-10 rounded-sm border-2 flex items-center justify-center overflow-hidden transition-all duration-300"
          style={{
            backgroundColor: '#1e293b',
            borderColor: isTyping ? agent.colorHex : `${agent.colorHex}40`,
            boxShadow: isTyping ? `0 0 12px ${agent.colorHex}40` : 'none',
          }}
        >
          {/* Screen content based on state */}
          {isTyping && (
            <div className="w-10 space-y-0.5 overflow-hidden p-0.5">
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className="h-0.5 rounded-full opacity-70"
                  style={{
                    backgroundColor: agent.colorHex,
                    width: `${40 + Math.random() * 60}%`,
                  }}
                />
              ))}
            </div>
          )}
          {isReading && (
            <span className="text-[10px] opacity-90">📄</span>
          )}
          {(state === 'idle' || isWaiting) && (
            <div
              className="w-1.5 h-1.5 rounded-full transition-opacity duration-300"
              style={{
                backgroundColor: isWaiting ? '#fbbf24' : '#334155',
                opacity: blinkOn ? 1 : 0.3,
              }}
            />
          )}
        </div>
        {/* Monitor stand */}
        <div
          className="w-3 h-2 mx-auto"
          style={{ backgroundColor: `${agent.colorHex}40` }}
        />
      </div>

      {/* Name plate */}
      <div className="mt-2 text-center">
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
