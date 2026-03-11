import { agents, Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

interface StatusBarProps {
  states: Record<string, AgentDynamicState>;
  selectedAgentId: string | null;
  onAgentClick: (agentId: string) => void;
}

const StatusBar = ({ states, selectedAgentId, onAgentClick }: StatusBarProps) => {
  const getStatusColor = (agentState: AgentDynamicState, agent: Agent) => {
    if (agentState.state === 'typing') return agent.colorHex;
    if (agentState.state === 'waiting') return '#fbbf24';
    if (agentState.state === 'reading') return '#7dd3fc';
    return '#334155';
  };

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-t border-border flex-wrap">
      {agents.map(agent => {
        const agentState = states[agent.id];
        const isSelected = selectedAgentId === agent.id;
        const dotColor = getStatusColor(agentState, agent);

        return (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: isSelected ? `${agent.colorHex}15` : 'transparent',
              borderColor: isSelected ? agent.colorHex : 'hsl(var(--border))',
              color: isSelected ? agent.colorHex : 'hsl(var(--muted-foreground))',
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${agentState.state !== 'idle' ? 'animate-status-pulse' : ''}`}
              style={{
                backgroundColor: dotColor,
                boxShadow: agentState.state !== 'idle' ? `0 0 6px ${dotColor}` : 'none',
              }}
            />
            {agent.name}
          </button>
        );
      })}
      <span className="ml-auto text-[10px] text-muted-foreground/40 font-pixel tracking-wider">
        CLICK AN AGENT TO CHAT
      </span>
    </div>
  );
};

export default StatusBar;
