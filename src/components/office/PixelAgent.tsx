import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
  dynamicState: AgentDynamicState;
}

const HairRenderer = ({ style, color, width }: { style: Agent['hairStyle']; color: string; width: number }) => {
  switch (style) {
    case 'short':
      return (
        <div className="absolute -top-1.5 left-0 right-0 flex justify-center">
          <div className="rounded-t-md" style={{ width: width + 2, height: 6, backgroundColor: color }} />
        </div>
      );
    case 'long':
      return (
        <>
          <div className="absolute -top-2 left-0 right-0 flex justify-center">
            <div className="rounded-t-lg" style={{ width: width + 4, height: 8, backgroundColor: color }} />
          </div>
          <div className="absolute top-1 -left-1" style={{ width: 3, height: 14, backgroundColor: color, borderRadius: '0 0 2px 2px' }} />
          <div className="absolute top-1 -right-1" style={{ width: 3, height: 14, backgroundColor: color, borderRadius: '0 0 2px 2px' }} />
        </>
      );
    case 'spiky':
      return (
        <div className="absolute -top-2.5 left-0 right-0 flex justify-center gap-[1px]">
          {[6, 9, 7, 10, 6].map((h, i) => (
            <div key={i} style={{ width: 3, height: h, backgroundColor: color, borderRadius: '2px 2px 0 0' }} />
          ))}
        </div>
      );
    case 'curly':
      return (
        <div className="absolute -top-2 left-0 right-0 flex justify-center">
          <div style={{ width: width + 6, height: 9, backgroundColor: color, borderRadius: '8px 8px 2px 2px' }} />
        </div>
      );
    case 'slick':
      return (
        <div className="absolute -top-1 left-0 right-0 flex justify-center">
          <div style={{ width: width + 2, height: 5, backgroundColor: color, borderRadius: '4px 4px 0 0' }} />
          <div className="absolute top-0 -right-0.5" style={{ width: 4, height: 7, backgroundColor: color, borderRadius: '0 4px 2px 0', transform: 'skewX(-8deg)' }} />
        </div>
      );
    default:
      return null;
  }
};

const PixelAgent = ({ agent, onClick, isSelected, dynamicState }: PixelAgentProps) => {
  const { state, taskIndex, bobOffset, blinkOn } = dynamicState;
  const isTyping = state === 'typing';
  const isWaiting = state === 'waiting';
  const isReading = state === 'reading';

  const statusColor = isTyping ? agent.colorHex
    : isWaiting ? '#fbbf24'
    : isReading ? '#7dd3fc'
    : '#334155';

  // Subtle breathing animation offset
  const breathOffset = bobOffset * 0.5;

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      onClick={onClick}
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

      {/* Human character */}
      <div className="relative" style={{ transform: `translateY(${breathOffset}px)`, transition: 'transform 0.6s ease-in-out' }}>
        {/* Head */}
        <div className="relative flex justify-center">
          <div
            className="w-11 h-11 rounded-full relative"
            style={{ backgroundColor: agent.skinTone, boxShadow: `0 2px 8px rgba(0,0,0,0.3)` }}
          >
            {/* Hair */}
            <HairRenderer style={agent.hairStyle} color={agent.hairColor} width={44} />

            {/* Face */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-1.5">
              {/* Eyes */}
              <div className="flex gap-2.5 mb-0.5">
                <div
                  className="w-2 rounded-full transition-all duration-100"
                  style={{
                    backgroundColor: '#2d1b0e',
                    height: blinkOn ? 5 : 1,
                  }}
                />
                <div
                  className="w-2 rounded-full transition-all duration-100"
                  style={{
                    backgroundColor: '#2d1b0e',
                    height: blinkOn ? 5 : 1,
                  }}
                />
              </div>
              {/* Mouth — expression changes with state */}
              <div
                className="mt-0.5 rounded-full"
                style={{
                  width: isTyping ? 4 : isWaiting ? 6 : 5,
                  height: isTyping ? 3 : isWaiting ? 2 : 2,
                  backgroundColor: isWaiting ? '#d97706' : '#c4816a',
                  borderRadius: isTyping ? '0 0 50% 50%' : isWaiting ? '2px' : '50%',
                }}
              />
            </div>

            {/* Cheek blush */}
            <div className="absolute bottom-2.5 left-1 w-2 h-1 rounded-full opacity-30" style={{ backgroundColor: '#e57373' }} />
            <div className="absolute bottom-2.5 right-1 w-2 h-1 rounded-full opacity-30" style={{ backgroundColor: '#e57373' }} />
          </div>

          {/* Status indicator */}
          <div className="absolute -top-0.5 -right-0.5 flex items-center gap-1 z-20">
            <div
              className={`w-2.5 h-2.5 rounded-full border ${(isTyping || isReading) ? 'animate-status-pulse' : ''}`}
              style={{
                backgroundColor: statusColor,
                borderColor: `${statusColor}80`,
              }}
            />
          </div>
        </div>

        {/* Neck */}
        <div className="flex justify-center -mt-0.5">
          <div className="w-3 h-1.5" style={{ backgroundColor: agent.skinTone }} />
        </div>

        {/* Shoulders & torso — colored with agent color (clothing) */}
        <div className="relative flex justify-center -mt-px">
          <div
            className="w-16 h-8 rounded-t-lg relative"
            style={{
              background: `linear-gradient(180deg, ${agent.colorHex}, ${agent.colorHex}cc)`,
              boxShadow: `0 2px 6px ${agent.colorHex}30`,
            }}
          >
            {/* Collar / shirt detail */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-4 h-2" style={{ backgroundColor: `${agent.colorHex}dd`, borderRadius: '0 0 4px 4px' }} />
            {/* Subtle shirt texture lines */}
            <div className="absolute bottom-1 left-2 right-2 flex flex-col gap-0.5 opacity-20">
              <div className="h-px" style={{ backgroundColor: '#000' }} />
              <div className="h-px" style={{ backgroundColor: '#000' }} />
            </div>
          </div>

          {/* Arms with skin tone hands */}
          <div
            className="absolute top-0 -left-2 w-3 h-7 rounded-md transition-transform duration-150"
            style={{
              background: `linear-gradient(180deg, ${agent.colorHex}, ${agent.colorHex}cc)`,
              transformOrigin: 'top center',
              transform: isTyping ? `rotate(${bobOffset === -3 ? -20 : 20}deg)` : 'rotate(5deg)',
            }}
          >
            {/* Hand */}
            <div className="absolute -bottom-1 left-0 w-3 h-2 rounded-full" style={{ backgroundColor: agent.skinTone }} />
          </div>
          <div
            className="absolute top-0 -right-2 w-3 h-7 rounded-md transition-transform duration-150"
            style={{
              background: `linear-gradient(180deg, ${agent.colorHex}, ${agent.colorHex}cc)`,
              transformOrigin: 'top center',
              transform: isTyping ? `rotate(${bobOffset === -3 ? 20 : -20}deg)` : 'rotate(-5deg)',
            }}
          >
            {/* Hand */}
            <div className="absolute -bottom-1 left-0 w-3 h-2 rounded-full" style={{ backgroundColor: agent.skinTone }} />
          </div>
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
