import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { TASK_STATUS, COMPANY_ID, type TaskStatus } from '@/lib/constants';

export interface Task {
  id: string;
  company_id: string;
  agent_role: string;
  title: string;
  description: string | null;
  task_type: string;
  status: TaskStatus;
  priority: number;
  requires_approval: boolean;
  source: string;
  input_payload: Record<string, unknown>;
  output_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTasks = useCallback(async (filters?: { status?: string; agent_role?: string }) => {
    setLoading(true);
    try {
      let query = (supabase
        .from('tasks' as any)
        .select('*') as any)
        .eq('company_id', COMPANY_ID)
        .order('created_at', { ascending: false });

      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.agent_role) query = query.eq('agent_role', filters.agent_role);

      const { data, error } = await query;
      if (error) throw error;
      setTasks((data as Task[]) || []);
      return (data as Task[]) || [];
    } catch (err) {
      console.error('Failed to fetch tasks:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createTask = useCallback(async (task: {
    agent_role: string;
    title: string;
    description?: string;
    task_type?: string;
    source?: string;
    priority?: number;
    input_payload?: Record<string, unknown>;
  }) => {
    try {
      const row = {
        company_id: COMPANY_ID,
        agent_role: task.agent_role,
        title: task.title,
        description: task.description || null,
        task_type: task.task_type || 'general',
        source: task.source || 'standup',
        priority: task.priority || 3,
        status: TASK_STATUS.QUEUED,
        input_payload: (task.input_payload || {}) as unknown as Record<string, unknown>,
      };

      const { data, error } = await (supabase
        .from('tasks' as any)
        .insert(row as any)
        .select()
        .single() as any);

      if (error) throw error;

      // Also log an event
      await (supabase.from('task_events' as any).insert({
        task_id: (data as any).id,
        event_type: 'created',
        event_payload: { source: task.source || 'standup' },
      } as any));

      setTasks(prev => [(data as Task), ...prev]);
      return data as Task;
    } catch (err) {
      console.error('Failed to create task:', err);
      return null;
    }
  }, []);

  const updateTaskStatus = useCallback(async (taskId: string, status: TaskStatus) => {
    try {
      const updates: Record<string, unknown> = { status };
      if (status === TASK_STATUS.COMPLETED) updates.completed_at = new Date().toISOString();

      const { error } = await (supabase
        .from('tasks' as any)
        .update(updates as any)
        .eq('id', taskId) as any);

      if (error) throw error;

      await (supabase.from('task_events' as any).insert({
        task_id: taskId,
        event_type: 'status_changed',
        event_payload: { new_status: status },
      } as any));

      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status, ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}) } : t));
    } catch (err) {
      console.error('Failed to update task:', err);
    }
  }, []);

  return { tasks, loading, fetchTasks, createTask, updateTaskStatus };
}
