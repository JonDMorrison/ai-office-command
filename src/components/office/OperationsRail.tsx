import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { agents } from '@/data/agents';
import { Layers, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';

interface OpsCounts {
  queued: number;
  inProgress: number;
  blocked: number;
  waitingInput: number;
  pendingApprovals: number;
  completedToday: number;
}

const AGENT_MAP = new Map(agents.map(a => [a.id, a]));

function getAgentColor(agentId: string): string {
  return AGENT_MAP.get(agentId)?.colorHex || 'hsl(var(--muted-foreground))';
}

const OperationsRail = () => {
  const [counts, setCounts] = useState<OpsCounts>({
    queued: 0, inProgress: 0, blocked: 0, waitingInput: 0, pendingApprovals: 0, completedToday: 0,
  });
  const [blockedTasks, setBlockedTasks] = useState<Array<{ title: string; agent_role: string }>>([]);

  const fetchCounts = useCallback(async () => {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const [queuedRes, progressRes, blockedRes, waitingRes, approvalsRes, completedRes] = await Promise.all([
        (supabase.from('tasks' as any).select('id', { count: 'exact', head: true }) as any).eq('status', 'queued'),
        (supabase.from('tasks' as any).select('id', { count: 'exact', head: true }) as any).eq('status', 'in_progress'),
        (supabase.from('tasks' as any).select('title, agent_role') as any).eq('status', 'blocked'),
        (supabase.from('tasks' as any).select('id', { count: 'exact', head: true }) as any).eq('status', 'waiting_for_input'),
        (supabase.from('approvals' as any).select('id', { count: 'exact', head: true }) as any).eq('status', 'pending'),
        (supabase.from('tasks' as any).select('id', { count: 'exact', head: true }) as any).eq('status', 'completed').gte('completed_at', todayStart.toISOString()),
      ]);

      setCounts({
        queued: queuedRes.count || 0,
        inProgress: progressRes.count || 0,
        blocked: blockedRes.data?.length || 0,
        waitingInput: waitingRes.count || 0,
        pendingApprovals: approvalsRes.count || 0,
        completedToday: completedRes.count || 0,
      });

      setBlockedTasks((blockedRes.data || []).slice(0, 3) as Array<{ title: string; agent_role: string }>);
    } catch (err) {
      console.error('[OperationsRail] fetch error:', err);
    }
  }, []);

  useEffect(() => {
    fetchCounts();
    const interval = setInterval(fetchCounts, 10000);
    return () => clearInterval(interval);
  }, [fetchCounts]);

  const hasIssues = counts.blocked > 0 || counts.waitingInput > 0;

  return (
    <div className="ops-rail">
      <div className="ops-rail-header">
        <Layers size={11} className="text-primary" />
        <span>Operations</span>
      </div>

      <div className="ops-rail-grid">
        {/* Queued */}
        <div className="ops-metric">
          <div className="ops-metric-value">{counts.queued}</div>
          <div className="ops-metric-label">Queued</div>
        </div>

        {/* In Progress */}
        <div className="ops-metric">
          <div className="ops-metric-value text-primary">{counts.inProgress}</div>
          <div className="ops-metric-label">Active</div>
        </div>

        {/* Blocked */}
        <div className={`ops-metric ${counts.blocked > 0 ? 'ops-metric-alert' : ''}`}>
          <div className={`ops-metric-value ${counts.blocked > 0 ? 'text-destructive' : ''}`}>
            {counts.blocked > 0 && <AlertTriangle size={10} className="inline mr-0.5 mb-px" />}
            {counts.blocked}
          </div>
          <div className="ops-metric-label">Blocked</div>
        </div>

        {/* Approvals */}
        <div className={`ops-metric ${counts.pendingApprovals > 0 ? 'ops-metric-waiting' : ''}`}>
          <div className={`ops-metric-value ${counts.pendingApprovals > 0 ? 'text-amber-600' : ''}`}>
            {counts.pendingApprovals > 0 && <Clock size={10} className="inline mr-0.5 mb-px" />}
            {counts.pendingApprovals}
          </div>
          <div className="ops-metric-label">Approvals</div>
        </div>

        {/* Completed today */}
        <div className="ops-metric">
          <div className="ops-metric-value text-emerald-600">
            {counts.completedToday > 0 && <CheckCircle2 size={10} className="inline mr-0.5 mb-px" />}
            {counts.completedToday}
          </div>
          <div className="ops-metric-label">Today</div>
        </div>
      </div>

      {/* Blocked task details */}
      {blockedTasks.length > 0 && (
        <div className="ops-blocked-list">
          {blockedTasks.map((t, i) => (
            <div key={i} className="ops-blocked-item">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getAgentColor(t.agent_role) }} />
              <span className="truncate">{t.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OperationsRail;
