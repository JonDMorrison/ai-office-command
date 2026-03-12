import { agents } from '@/data/agents';
import { AgentDynamicState } from '@/hooks/useAgentStates';

interface StatusBarProps {
  states: Record<string, AgentDynamicState>;
  selectedAgentId: string | null;
  onAgentClick: (agentId: string) => void;
}

const STATE_LABELS: Record<string, string> = {
  idle: '',
  working: 'working',
  waiting: 'awaiting',
  needs_input: 'input needed',
  blocked: 'blocked',
};

const StatusBar = ({ states, selectedAgentId, onAgentClick }: StatusBarProps) => {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2 border-t border-border bg-card/95 backdrop-blur-sm">
      {agents.map(agent => {
        const agentState = states[agent.id];
        const isSelected = selectedAgentId === agent.id;
        const isActive = agentState.state !== 'idle';
        const stateLabel = STATE_LABELS[agentState.state] || '';

        return (
          <button
            key={agent.id}
            onClick={() => onAgentClick(agent.id)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: isSelected ? `${agent.colorHex}12` : 'transparent',
              border: `1px solid ${isSelected ? `${agent.colorHex}30` : 'transparent'}`,
              color: isSelected ? agent.colorHex : 'hsl(var(--muted-foreground))',
            }}
          >
            <div
              className={`w-1.5 h-1.5 rounded-full ${isActive ? 'animate-status-pulse' : ''}`}
              style={{ backgroundColor: isActive ? agent.colorHex : 'hsl(var(--border))' }}
            />
            <span>{agent.name}</span>
            {stateLabel && (
              <span className="text-[8px] opacity-60">{stateLabel}</span>
            )}
          </button>
        );
      })}

      <div className="ml-auto text-[10px] text-muted-foreground">
        Click an agent to chat
      </div>
    </div>
  );
};

export default StatusBar;
