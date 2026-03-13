import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { agents } from '@/data/agents';
import { TASK_STATUS } from '@/lib/constants';

export type DynamicState = 'idle' | 'working' | 'waiting' | 'blocked' | 'needs_input';

export interface AgentDynamicState {
  agentId: string;
  state: DynamicState;
  taskIndex: number;
  bobOffset: number;
  blinkOn: boolean;
  standupOverride?: string;
  activeTaskTitle?: string;
  activeTaskId?: string;
  activeTaskDescription?: string;
}

/**
 * Derives agent visual state from real task + approval data.
 *
 * Priority (highest wins):
 *   blocked        → any task with status = blocked
 *   needs_input    → any task with status = waiting_for_input
 *   waiting        → any pending approval for this agent
 *   working        → any task with status = in_progress OR queued
 *   idle           → nothing active
 */
function deriveState(
  agentId: string,
  tasksByAgent: Record<string, Array<{ status: string; title: string; id: string; description: string | null }>>,
  pendingApprovalAgents: Set<string>,
): { state: DynamicState; activeTaskTitle?: string; activeTaskId?: string; activeTaskDescription?: string } {
  const tasks = tasksByAgent[agentId] || [];

  const blocked = tasks.find(t => t.status === TASK_STATUS.BLOCKED);
  if (blocked) return { state: 'blocked', activeTaskTitle: blocked.title, activeTaskId: blocked.id, activeTaskDescription: blocked.description ?? undefined };

  const needsInput = tasks.find(t => t.status === TASK_STATUS.WAITING_FOR_INPUT);
  if (needsInput) return { state: 'needs_input', activeTaskTitle: needsInput.title, activeTaskId: needsInput.id, activeTaskDescription: needsInput.description ?? undefined };

  if (pendingApprovalAgents.has(agentId)) return { state: 'waiting' };

  const working = tasks.find(t => t.status === TASK_STATUS.IN_PROGRESS || t.status === TASK_STATUS.QUEUED);
  if (working) return { state: 'working', activeTaskTitle: working.title, activeTaskId: working.id, activeTaskDescription: working.description ?? undefined };

  return { state: 'idle' };
}

export function useAgentStates() {
  const [states, setStates] = useState<Record<string, AgentDynamicState>>(() => {
    const initial: Record<string, AgentDynamicState> = {};
    agents.forEach(agent => {
      initial[agent.id] = {
        agentId: agent.id,
        state: 'idle',
        taskIndex: 0,
        bobOffset: 0,
        blinkOn: true,
      };
    });
    return initial;
  });

  const overridesRef = useRef<Record<string, { text: string; expiry: number }>>({});

  // ── Poll real data every 8 seconds ──────────────────────────────────────
  const fetchRealStates = useCallback(async () => {
    try {
      // Fetch active tasks — use assigned_agent for ownership clarity
      const { data: taskData } = await (supabase
        .from('tasks' as any)
        .select('id, agent_role, assigned_agent, status, title, description')
        .in('status', [
          TASK_STATUS.IN_PROGRESS,
          TASK_STATUS.QUEUED,
          TASK_STATUS.PENDING,
          TASK_STATUS.BLOCKED,
          TASK_STATUS.WAITING_FOR_INPUT,
        ]) as any);

      // Fetch pending approvals
      const { data: approvalData } = await (supabase
        .from('approvals' as any)
        .select('agent_role')
        .eq('status', 'pending') as any);

      const tasksByAgent: Record<string, Array<{ status: string; title: string; id: string; description: string | null }>> = {};
      for (const t of (taskData || []) as Array<{ id: string; agent_role: string; assigned_agent: string | null; status: string; title: string; description: string | null }>) {
        const owner = t.assigned_agent || t.agent_role;
        if (!tasksByAgent[owner]) tasksByAgent[owner] = [];
        tasksByAgent[owner].push(t);
      }

      const pendingApprovalAgents = new Set<string>(
        ((approvalData || []) as Array<{ agent_role: string }>).map(a => a.agent_role)
      );

      const now = Date.now();

      setStates(prev => {
        const next = { ...prev };
        agents.forEach(agent => {
          // Check for active standup override
          const override = overridesRef.current[agent.id];
          if (override && override.expiry > now) {
            next[agent.id] = {
              ...prev[agent.id],
              state: 'working',
              standupOverride: override.text,
            };
            return;
          } else if (override) {
            delete overridesRef.current[agent.id];
          }

          const { state, activeTaskTitle } = deriveState(agent.id, tasksByAgent, pendingApprovalAgents);
          next[agent.id] = {
            ...prev[agent.id],
            state,
            standupOverride: undefined,
            activeTaskTitle,
            // Rotate taskIndex when working
            taskIndex: state === 'working'
              ? (prev[agent.id].taskIndex + 1) % agent.tasks.length
              : prev[agent.id].taskIndex,
          };
        });
        return next;
      });
    } catch (err) {
      console.error('[useAgentStates] poll error:', err);
    }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchRealStates();

    // Poll interval
    const pollId = setInterval(fetchRealStates, 8000);

    // Idle-float bob animation (purely cosmetic — keep local)
    const bobIntervals: ReturnType<typeof setInterval>[] = [];
    agents.forEach(agent => {
      const id = setInterval(() => {
        setStates(prev => ({
          ...prev,
          [agent.id]: {
            ...prev[agent.id],
            bobOffset: prev[agent.id].bobOffset === 0 ? -3 : 0,
          },
        }));
      }, 600 + Math.random() * 400);
      bobIntervals.push(id);
    });

    return () => {
      clearInterval(pollId);
      bobIntervals.forEach(clearInterval);
    };
  }, [fetchRealStates]);

  const setStandupOverrides = useCallback((approvedIds: string[]) => {
    const expiry = Date.now() + 15000;
    approvedIds.forEach(id => {
      overridesRef.current[id] = { text: 'Working on it...', expiry };
    });
    // Trigger immediate state update
    setStates(prev => {
      const next = { ...prev };
      approvedIds.forEach(id => {
        if (next[id]) {
          next[id] = { ...next[id], state: 'working', standupOverride: 'Working on it...' };
        }
      });
      return next;
    });
  }, []);

  const activeCount = Object.values(states).filter(s => s.state === 'working').length;
  const waitingCount = Object.values(states).filter(s => s.state === 'waiting' || s.state === 'needs_input').length;

  return { states, activeCount, waitingCount, setStandupOverrides, refetch: fetchRealStates };
}
