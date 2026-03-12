import { useCallback, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { getWorkspaceForAgent } from '@/lib/constants';

export interface Approval {
  id: string;
  workspace_id: string | null;
  agent_role: string;
  task_id: string | null;
  approval_type: string;
  title: string;
  preview_text: string | null;
  full_payload: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

export function useApprovals() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchApprovals = useCallback(async (filters?: { status?: string; agent_role?: string; workspace_id?: string }) => {
    setLoading(true);
    try {
      let query = (supabase
        .from('approvals' as any)
        .select('*') as any)
        .order('created_at', { ascending: false });

      if (filters?.workspace_id) query = query.eq('workspace_id', filters.workspace_id);
      if (filters?.status) query = query.eq('status', filters.status);
      if (filters?.agent_role) query = query.eq('agent_role', filters.agent_role);

      const { data, error } = await query;
      if (error) throw error;
      setApprovals((data as Approval[]) || []);
      return (data as Approval[]) || [];
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createApproval = useCallback(async (item: {
    agent_role: string;
    approval_type: string;
    title: string;
    preview_text?: string;
    full_payload?: Record<string, unknown>;
    task_id?: string;
  }) => {
    try {
      const workspaceId = getWorkspaceForAgent(item.agent_role);
      const { data, error } = await (supabase
        .from('approvals' as any)
        .insert({
          workspace_id: workspaceId,
          agent_role: item.agent_role,
          task_id: item.task_id || null,
          approval_type: item.approval_type,
          title: item.title,
          preview_text: item.preview_text || null,
          full_payload: item.full_payload || {},
        } as any)
        .select()
        .single() as any);

      if (error) throw error;
      setApprovals(prev => [(data as Approval), ...prev]);
      return data as Approval;
    } catch (err) {
      console.error('Failed to create approval:', err);
      return null;
    }
  }, []);

  const approveItem = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase
        .from('approvals' as any)
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
        } as any)
        .eq('id', id) as any);

      if (error) throw error;
      setApprovals(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'approved', approved_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to approve item:', err);
    }
  }, []);

  const rejectItem = useCallback(async (id: string) => {
    try {
      const { error } = await (supabase
        .from('approvals' as any)
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
        } as any)
        .eq('id', id) as any);

      if (error) throw error;
      setApprovals(prev => prev.map(a =>
        a.id === id ? { ...a, status: 'rejected', rejected_at: new Date().toISOString() } : a
      ));
    } catch (err) {
      console.error('Failed to reject item:', err);
    }
  }, []);

  const pendingCount = approvals.filter(a => a.status === 'pending').length;

  return { approvals, loading, pendingCount, fetchApprovals, createApproval, approveItem, rejectItem };
}
