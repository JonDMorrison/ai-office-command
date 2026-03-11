import { Agent } from '@/data/agents';
import { useEffect, useState } from 'react';

interface PixelAgentProps {
  agent: Agent;
  onClick: () => void;
  isSelected: boolean;
}

const PixelAgent = ({ agent, onClick, isSelected }: PixelAgentProps) => {
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [showBubble, setShowBubble] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowBubble(false);
      setTimeout(() => {
        setCurrentTaskIndex(prev => (prev + 1) % agent.tasks.length);
        setShowBubble(true);
      }, 300);
    }, 8000 + Math.random() * 4000);
    return () => clearInterval(interval);
  }, [agent.tasks.length]);

  const isActive = agent.status === 'active';
  const isWaiting = agent.status === 'waiting';

  return (
    <div
      className={`relative flex flex-col items-center cursor-pointer transition-transform duration-200 ${isSelected ? 'scale-105' : 'hover:scale-105'}`}
      onClick={onClick}
    >
      {/* Speech bubble */}
      {showBubble && (
        <div
          className="animate-bubble-appear absolute -top-16 left-1/2 -translate-x-1/2 w-48 px-3 py-2 rounded border text-[9px] font-pixel leading-relaxed z-10"
          style={{
            backgroundColor: `${agent.colorHex}10`,
            borderColor: `${agent.colorHex}40`,
            color: agent.colorHex,
          }}
        >
          {agent.tasks[currentTaskIndex]}
          <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-0 h-0"
            style={{
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${agent.colorHex}40`,
            }}
          />
        </div>
      )}

      {/* Agent body */}
      <div className={`relative ${isActive ? 'animate-agent-bob' : ''}`}>
        {/* Head */}
        <div
          className="w-10 h-10 rounded-sm border-2 relative animate-agent-blink"
          style={{
            backgroundColor: `${agent.colorHex}30`,
            borderColor: agent.colorHex,
            boxShadow: `0 0 12px ${agent.colorHex}40`,
          }}
        >
          {/* Eyes */}
          <div className="absolute top-3 left-2 flex gap-2">
            <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: agent.colorHex }} />
            <div className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: agent.colorHex }} />
          </div>
        </div>

        {/* Body */}
        <div
          className={`w-10 h-8 mt-0.5 rounded-sm border-2 ${isActive ? 'animate-agent-type' : ''}`}
          style={{
            backgroundColor: `${agent.colorHex}20`,
            borderColor: `${agent.colorHex}80`,
          }}
        />

        {/* Status indicator */}
        <div className="absolute -top-1 -right-1 flex items-center gap-1">
          <div
            className={`w-2.5 h-2.5 rounded-full border ${isActive ? 'animate-status-pulse' : ''}`}
            style={{
              backgroundColor: isActive ? agent.colorHex : isWaiting ? '#f59e0b' : '#6b7280',
              borderColor: isActive ? agent.colorHex : isWaiting ? '#f59e0b80' : '#6b728080',
            }}
          />
        </div>
      </div>

      {/* Desk */}
      <div
        className="w-20 h-3 mt-1 rounded-sm border"
        style={{
          backgroundColor: `${agent.colorHex}10`,
          borderColor: `${agent.colorHex}30`,
        }}
      />

      {/* Monitor on desk */}
      <div className="relative -mt-10 mb-7">
        <div
          className="w-14 h-10 rounded-sm border-2 flex items-center justify-center animate-monitor-glow"
          style={{
            backgroundColor: `${agent.colorHex}08`,
            borderColor: `${agent.colorHex}60`,
            boxShadow: `0 0 20px ${agent.colorHex}20`,
          }}
        >
          {/* Screen content - scrolling text effect */}
          <div className="w-10 space-y-0.5 overflow-hidden">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-0.5 rounded-full opacity-60"
                style={{
                  backgroundColor: agent.colorHex,
                  width: `${40 + Math.random() * 60}%`,
                }}
              />
            ))}
          </div>
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
          className="text-[8px] mt-1 px-2 py-0.5 rounded border font-pixel"
          style={{
            color: isActive ? agent.colorHex : isWaiting ? '#f59e0b' : '#6b7280',
            borderColor: isActive ? `${agent.colorHex}40` : isWaiting ? '#f59e0b40' : '#6b728040',
            backgroundColor: isActive ? `${agent.colorHex}10` : isWaiting ? '#f59e0b10' : '#6b728010',
          }}
        >
          {agent.status.toUpperCase()}
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
