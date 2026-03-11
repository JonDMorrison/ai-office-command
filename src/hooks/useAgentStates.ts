import { useState, useEffect } from 'react';
import { agents } from '@/data/agents';

export type DynamicState = 'typing' | 'reading' | 'idle' | 'waiting';

export interface AgentDynamicState {
  agentId: string;
  state: DynamicState;
  taskIndex: number;
  bobOffset: number;
  blinkOn: boolean;
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
      // State cycling
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

      // Bob animation
      const bobInterval = setInterval(() => {
        setStates(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            bobOffset: prev[agent.id].bobOffset === 0 ? -3 : 0,
          },
        }));
      }, 600 + Math.random() * 400);

      // Blink
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

  const activeCount = Object.values(states).filter(s => s.state === 'typing' || s.state === 'reading').length;
  const waitingCount = Object.values(states).filter(s => s.state === 'waiting').length;

  return { states, activeCount, waitingCount };
}
