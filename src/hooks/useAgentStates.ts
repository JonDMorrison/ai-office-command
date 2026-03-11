import { useState, useEffect, useCallback } from 'react';
import { agents } from '@/data/agents';

export type DynamicState = 'typing' | 'reading' | 'idle' | 'waiting';

export interface AgentDynamicState {
  agentId: string;
  state: DynamicState;
  taskIndex: number;
  bobOffset: number;
  blinkOn: boolean;
  standupOverride?: string; // e.g. "Working on it..."
}

const STATES: DynamicState[] = ['typing', 'reading', 'idle', 'waiting'];

export function useAgentStates() {
  const [states, setStates] = useState<Record<string, AgentDynamicState>>(() => {
    const initial: Record<string, AgentDynamicState> = {};
    agents.forEach(agent => {
      initial[agent.id] = {
        agentId: agent.id,
        state: 'typing',
        taskIndex: 0,
        bobOffset: 0,
        blinkOn: true,
      };
    });
    return initial;
  });

  useEffect(() => {
    const intervals: ReturnType<typeof setInterval>[] = [];

    agents.forEach(agent => {
      const stateInterval = setInterval(() => {
        const newState = STATES[Math.floor(Math.random() * STATES.length)];
        setStates(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            state: newState,
            taskIndex: (newState === 'typing' || newState === 'reading')
              ? (prev[agent.id].taskIndex + 1) % agent.tasks.length
              : prev[agent.id].taskIndex,
          },
        }));
      }, 2500 + Math.random() * 2000);

      const bobInterval = setInterval(() => {
        setStates(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            bobOffset: prev[agent.id].bobOffset === 0 ? -3 : 0,
          },
        }));
      }, 600 + Math.random() * 400);

      const blinkInterval = setInterval(() => {
        setStates(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            blinkOn: !prev[agent.id].blinkOn,
          },
        }));
      }, 3000 + Math.random() * 2000);

      intervals.push(stateInterval, bobInterval, blinkInterval);
    });

    return () => intervals.forEach(clearInterval);
  }, []);

  const setStandupOverrides = useCallback((approvedIds: string[]) => {
    setStates(prev => {
      const next = { ...prev };
      approvedIds.forEach(id => {
        if (next[id]) {
          next[id] = { ...next[id], state: 'typing', standupOverride: 'Working on it...' };
        }
      });
      return next;
    });
    // Clear overrides after 15 seconds
    setTimeout(() => {
      setStates(prev => {
        const next = { ...prev };
        approvedIds.forEach(id => {
          if (next[id]) {
            next[id] = { ...next[id], standupOverride: undefined };
          }
        });
        return next;
      });
    }, 15000);
  }, []);

  const activeCount = Object.values(states).filter(s => s.state === 'typing' || s.state === 'reading').length;
  const waitingCount = Object.values(states).filter(s => s.state === 'waiting').length;

  return { states, activeCount, waitingCount, setStandupOverrides };
}