import { Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

const AGENT_STYLES: Record<string, {
  jacket: string; jacketDark: string; skin: string; hair: string; pants: string;
  hairStyle: 'swept' | 'curly' | 'spiky' | 'bun' | 'buzzcut';
  accessory?: string; accessoryColor?: string;
  eyeStyle: 'round' | 'narrow' | 'big' | 'wink' | 'default';
}> = {
  bloomsuite: {
    jacket: '#22c55e', jacketDark: '#16a34a', skin: '#f0c8a0', hair: '#4a3728', pants: '#374151',
    hairStyle: 'swept', accessory: 'headband', accessoryColor: '#bbf7d0',
    eyeStyle: 'big',
  },
  clinicleader: {
    jacket: '#3b82f6', jacketDark: '#2563eb', skin: '#c68642', hair: '#2c1810', pants: '#1e293b',
    hairStyle: 'curly', accessory: 'glasses', accessoryColor: '#93c5fd',
    eyeStyle: 'round',
  },
  projectpath: {
    jacket: '#f59e0b', jacketDark: '#d97706', skin: '#f5d0a9', hair: '#d4a574', pants: '#44403c',
    hairStyle: 'buzzcut', accessory: 'hardhat', accessoryColor: '#fef08a',
    eyeStyle: 'narrow',
  },
  discprofile: {
    jacket: '#8b5cf6', jacketDark: '#7c3aed', skin: '#e8b896', hair: '#1a1a2e', pants: '#312e81',
    hairStyle: 'bun', accessory: 'earring', accessoryColor: '#c4b5fd',
    eyeStyle: 'wink',
  },
  inbox: {
    jacket: '#f97316', jacketDark: '#ea580c', skin: '#f0c8a0', hair: '#8b4513', pants: '#374151',
    hairStyle: 'spiky', accessory: 'headphones', accessoryColor: '#fed7aa',
    eyeStyle: 'default',
  },
};

const FortniteCharacter = ({ agentId }: { agentId: string }) => {
  const s = AGENT_STYLES[agentId] || AGENT_STYLES.bloomsuite;

  return (
    <svg width="60" height="72" viewBox="0 0 60 72" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* ---- HAIR (behind head) ---- */}
      {s.hairStyle === 'swept' && (
        <>
          <ellipse cx="30" cy="18" rx="17" ry="15" fill={s.hair} />
          <path d="M13 18 Q10 8 20 5 Q30 2 40 5 Q50 8 47 18" fill={s.hair} />
          <path d="M14 16 Q12 10 18 7" stroke={s.hair} strokeWidth="3" fill="none" />
        </>
      )}
      {s.hairStyle === 'curly' && (
        <>
          <ellipse cx="30" cy="17" rx="17" ry="16" fill={s.hair} />
          <circle cx="16" cy="12" r="5" fill={s.hair} />
          <circle cx="44" cy="12" r="5" fill={s.hair} />
          <circle cx="20" cy="7" r="4" fill={s.hair} />
          <circle cx="30" cy="5" r="4.5" fill={s.hair} />
          <circle cx="40" cy="7" r="4" fill={s.hair} />
        </>
      )}
      {s.hairStyle === 'spiky' && (
        <>
          <ellipse cx="30" cy="18" rx="16" ry="14" fill={s.hair} />
          <polygon points="22,10 24,0 27,10" fill={s.hair} />
          <polygon points="28,8 30,-2 33,8" fill={s.hair} />
          <polygon points="34,10 37,1 39,10" fill={s.hair} />
          <polygon points="17,14 16,5 21,12" fill={s.hair} />
          <polygon points="40,14 44,5 43,14" fill={s.hair} />
        </>
      )}
      {s.hairStyle === 'bun' && (
        <>
          <ellipse cx="30" cy="19" rx="16" ry="14" fill={s.hair} />
          <circle cx="30" cy="4" r="7" fill={s.hair} />
          <ellipse cx="30" cy="4" rx="5" ry="5.5" fill={s.hair} opacity="0.8" />
        </>
      )}
      {s.hairStyle === 'buzzcut' && (
        <>
          <ellipse cx="30" cy="18" rx="15.5" ry="14" fill={s.hair} />
          <rect x="15" y="8" width="30" height="8" rx="4" fill={s.hair} />
        </>
      )}

      {/* ---- HEAD (big chibi head) ---- */}
      <ellipse cx="30" cy="22" rx="14" ry="13" fill={s.skin} />

      {/* Cheek blush */}
      <ellipse cx="19" cy="26" rx="3.5" ry="2" fill="#ff9999" opacity="0.35" />
      <ellipse cx="41" cy="26" rx="3.5" ry="2" fill="#ff9999" opacity="0.35" />

      {/* ---- EYES ---- */}
      {s.eyeStyle === 'big' && (
        <>
          <ellipse cx="24" cy="23" rx="3.5" ry="4" fill="white" />
          <ellipse cx="36" cy="23" rx="3.5" ry="4" fill="white" />
          <ellipse cx="25" cy="23.5" rx="2" ry="2.5" fill="#1a1a2e" />
          <ellipse cx="37" cy="23.5" rx="2" ry="2.5" fill="#1a1a2e" />
          <circle cx="26" cy="22" r="0.8" fill="white" />
          <circle cx="38" cy="22" r="0.8" fill="white" />
        </>
      )}
      {s.eyeStyle === 'round' && (
        <>
          <circle cx="24" cy="23" r="3.2" fill="white" />
          <circle cx="36" cy="23" r="3.2" fill="white" />
          <circle cx="25" cy="23.5" r="2" fill="#1a1a2e" />
          <circle cx="37" cy="23.5" r="2" fill="#1a1a2e" />
          <circle cx="26" cy="22.5" r="0.7" fill="white" />
          <circle cx="38" cy="22.5" r="0.7" fill="white" />
        </>
      )}
      {s.eyeStyle === 'narrow' && (
        <>
          <ellipse cx="24" cy="23" rx="3.5" ry="2.8" fill="white" />
          <ellipse cx="36" cy="23" rx="3.5" ry="2.8" fill="white" />
          <ellipse cx="25" cy="23.2" rx="2" ry="1.8" fill="#1a1a2e" />
          <ellipse cx="37" cy="23.2" rx="2" ry="1.8" fill="#1a1a2e" />
          <ellipse cx="25.8" cy="22.2" rx="0.8" ry="0.6" fill="white" />
          <ellipse cx="37.8" cy="22.2" rx="0.8" ry="0.6" fill="white" />
        </>
      )}
      {s.eyeStyle === 'wink' && (
        <>
          <ellipse cx="24" cy="23" rx="3.2" ry="3.5" fill="white" />
          <ellipse cx="25" cy="23.5" rx="2" ry="2.2" fill="#1a1a2e" />
          <circle cx="26" cy="22" r="0.8" fill="white" />
          {/* Wink eye */}
          <path d="M33 23 Q36 20 39 23" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" fill="none" />
        </>
      )}
      {s.eyeStyle === 'default' && (
        <>
          <ellipse cx="24" cy="23" rx="3" ry="3.5" fill="white" />
          <ellipse cx="36" cy="23" rx="3" ry="3.5" fill="white" />
          <circle cx="25" cy="23.5" r="2" fill="#1a1a2e" />
          <circle cx="37" cy="23.5" r="2" fill="#1a1a2e" />
          <circle cx="26" cy="22.5" r="0.7" fill="white" />
          <circle cx="38" cy="22.5" r="0.7" fill="white" />
        </>
      )}

      {/* Eyebrows */}
      <line x1="21" y1="18" x2="27" y2="17.5" stroke={s.hair} strokeWidth="1.2" strokeLinecap="round" />
      <line x1="33" y1="17.5" x2="39" y2="18" stroke={s.hair} strokeWidth="1.2" strokeLinecap="round" />

      {/* Mouth — cute smile */}
      <path d="M26 28 Q30 31 34 28" stroke="#c0756b" strokeWidth="1.2" strokeLinecap="round" fill="none" />

      {/* ---- ACCESSORIES ---- */}
      {s.accessory === 'headband' && (
        <rect x="14" y="14" width="32" height="3" rx="1.5" fill={s.accessoryColor} opacity="0.9" />
      )}
      {s.accessory === 'glasses' && (
        <>
          <circle cx="24" cy="23" r="5" stroke={s.accessoryColor} strokeWidth="1.2" fill="none" />
          <circle cx="36" cy="23" r="5" stroke={s.accessoryColor} strokeWidth="1.2" fill="none" />
          <line x1="29" y1="23" x2="31" y2="23" stroke={s.accessoryColor} strokeWidth="1" />
          <line x1="19" y1="22" x2="16" y2="20" stroke={s.accessoryColor} strokeWidth="1" />
          <line x1="41" y1="22" x2="44" y2="20" stroke={s.accessoryColor} strokeWidth="1" />
        </>
      )}
      {s.accessory === 'hardhat' && (
        <>
          <ellipse cx="30" cy="11" rx="16" ry="6" fill={s.accessoryColor} />
          <rect x="14" y="10" width="32" height="5" rx="2" fill={s.accessoryColor} />
          <rect x="12" y="14" width="36" height="2.5" rx="1" fill={s.accessoryColor} opacity="0.8" />
        </>
      )}
      {s.accessory === 'earring' && (
        <circle cx="44" cy="26" r="1.5" fill={s.accessoryColor} />
      )}
      {s.accessory === 'headphones' && (
        <>
          <path d="M14 20 Q14 10 30 10 Q46 10 46 20" stroke={s.accessoryColor} strokeWidth="2.5" fill="none" />
          <rect x="12" y="18" width="5" height="8" rx="2.5" fill={s.accessoryColor} />
          <rect x="43" y="18" width="5" height="8" rx="2.5" fill={s.accessoryColor} />
        </>
      )}

      {/* ---- BODY (small chibi body) ---- */}
      {/* Neck */}
      <rect x="27" y="34" width="6" height="3" rx="1" fill={s.skin} />

      {/* Torso / Hoodie */}
      <rect x="18" y="36" width="24" height="16" rx="4" fill={s.jacket} />
      {/* Hoodie pocket */}
      <rect x="23" y="44" width="14" height="5" rx="2" fill={s.jacketDark} opacity="0.4" />
      {/* Hoodie hood line */}
      <path d="M22 37 Q30 40 38 37" stroke={s.jacketDark} strokeWidth="1" fill="none" opacity="0.5" />
      {/* Zipper line */}
      <line x1="30" y1="37" x2="30" y2="52" stroke={s.jacketDark} strokeWidth="0.8" opacity="0.4" />

      {/* Arms */}
      <rect x="12" y="38" width="7" height="12" rx="3.5" fill={s.jacket} />
      <rect x="41" y="38" width="7" height="12" rx="3.5" fill={s.jacket} />
      {/* Hands */}
      <ellipse cx="15.5" cy="51" rx="3" ry="2.5" fill={s.skin} />
      <ellipse cx="44.5" cy="51" rx="3" ry="2.5" fill={s.skin} />

      {/* ---- LEGS ---- */}
      <rect x="21" y="51" width="7" height="12" rx="2" fill={s.pants} />
      <rect x="32" y="51" width="7" height="12" rx="2" fill={s.pants} />

      {/* ---- SHOES ---- */}
      <rect x="19" y="62" width="10" height="5" rx="2.5" fill="#1a1a2e" />
      <rect x="31" y="62" width="10" height="5" rx="2.5" fill="#1a1a2e" />
      {/* Shoe soles */}
      <rect x="19" y="65" width="10" height="2" rx="1" fill="#2d2d3f" />
      <rect x="31" y="65" width="10" height="2" rx="1" fill="#2d2d3f" />
    </svg>
  );
};

const getBubbleStyle = (state: string) => {
  switch (state) {
    case 'working':
      return { bg: '#f0fdf4', border: '#22c55e', label: '✦ Working' };
    case 'waiting':
      return { bg: '#fffbeb', border: '#f59e0b', label: '✋ Awaiting Approval' };
    case 'needs_input':
      return { bg: '#fef2f2', border: '#ef4444', label: '💬 Needs Your Input' };
    case 'blocked':
      return { bg: '#fef2f2', border: '#dc2626', label: '🚫 Blocked' };
    case 'idle':
      return { bg: '#f9fafb', border: '#9ca3af', label: '• Idle' };
    default:
      return { bg: '#f9fafb', border: '#9ca3af', label: state };
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
    ? { bg: '#f0fdf4', border: '#22c55e', label: '✦ Working on it...' }
    : getBubbleStyle(state);
  const showTaskText = !standupOverride && isActive && activeTaskTitle;

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

      {/* Status bubble */}
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
            {activeTaskTitle || agent.tasks[taskIndex]}
          </div>
        )}
        <div
          className="absolute bottom-0 left-1/2 translate-y-full"
          style={{
            transform: 'translateX(-50%) translateY(100%)',
            width: 0, height: 0,
            borderLeft: '6px solid transparent',
            borderRight: '6px solid transparent',
            borderTop: `6px solid ${bubble.border}`,
          }}
        />
      </div>

      {/* Character */}
      <div
        className="relative z-10 mb-2 flex items-end justify-center"
        style={{
          width: '80px',
          height: '90px',
          animation: isWalking
            ? 'walk-sway 0.4s ease-in-out infinite'
            : 'idle-float 2s ease-in-out infinite',
        }}
      >
        <FortniteCharacter agentId={agent.id} />
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
