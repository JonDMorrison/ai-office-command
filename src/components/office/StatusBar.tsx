import { agents, Agent } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

interface StatusBarProps {
  states: Record<string, AgentDynamicState>;
  selectedAgentId: string | null;
  onAgentClick: (agentId: string) => void;
}

const StatusBar = ({ states, selectedAgentId, onAgentClick }: StatusBarProps) => {
  return (
    <div className="flex items-center gap-2 px-5 py-2.5 border-t border-border bg-card flex-wrap">
      {agents.map(agent => {
        const agentState = states[agent.id];
        const isSelected = selectedAgentId === agent.id;
        const isActive = agentState.state !== 'idle';

        return (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: isSelected ? `${agent.colorHex}15` : 'hsl(var(--secondary))',
              border: `1px solid ${isSelected ? `${agent.colorHex}40` : 'transparent'}`,
              color: isSelected ? agent.colorHex : 'hsl(var(--muted-foreground))',
            }}
          >
            <div
              className={`w-2 h-2 rounded-full ${isActive ? 'animate-status-pulse' : ''}`}
              style={{
                backgroundColor: isActive ? agent.colorHex : 'hsl(var(--border))',
              }}
            />
            {agent.name}
          </button>
        );
      })}

      <div className="ml-auto flex items-center gap-4 text-xs text-muted-foreground">
        <span>{agents.length} team members</span>
        <span className="text-border">•</span>
        <span>Click a team member to chat</span>
      </div>
    </div>
  );
};

export default StatusBar;
