import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { agents } from '@/data/agents';
import {
  Activity, CheckCircle2, Clock, AlertTriangle, Send,
  ArrowRightLeft, Brain, Lightbulb, Shield, ChevronDown, ChevronUp,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FeedEvent {
  id: string;
  timestamp: string;
  type: EventType;
  actor: string;
  target?: string;
  summary: string;
  workspace?: string;
}

type EventType =
  | 'created' | 'delegated' | 'blocked' | 'completed' | 'status_changed'
  | 'approval_created' | 'approval_approved' | 'approval_rejected'
  | 'insight_created' | 'memory_saved';

// ─── Agent display ──────────────────────────────────────────────────────────

const AGENT_DISPLAY: Record<string, { name: string; color: string }> = {};
agents.forEach(a => { AGENT_DISPLAY[a.id] = { name: a.name, color: a.colorHex }; });
AGENT_DISPLAY['system'] = { name: 'System', color: 'hsl(var(--muted-foreground))' };
AGENT_DISPLAY['executive'] = { name: 'Chief of Staff', color: '#6366f1' };
AGENT_DISPLAY['jon'] = { name: 'Jon', color: 'hsl(var(--primary))' };

function getActorDisplay(id: string) {
  return AGENT_DISPLAY[id] || { name: id, color: 'hsl(var(--muted-foreground))' };
}

const EVENT_ICONS: Record<EventType, { icon: typeof Activity; className: string }> = {
  created:           { icon: Activity,       className: 'text-primary' },
  delegated:         { icon: ArrowRightLeft, className: 'text-amber-500' },
  blocked:           { icon: AlertTriangle,  className: 'text-destructive' },
  completed:         { icon: CheckCircle2,   className: 'text-emerald-500' },
  status_changed:    { icon: Clock,          className: 'text-muted-foreground' },
  approval_created:  { icon: Send,           className: 'text-blue-500' },
  approval_approved: { icon: Shield,         className: 'text-emerald-500' },
  approval_rejected: { icon: AlertTriangle,  className: 'text-destructive' },
  insight_created:   { icon: Lightbulb,      className: 'text-amber-500' },
  memory_saved:      { icon: Brain,          className: 'text-purple-500' },
};

// ─── Formatting ─────────────────────────────────────────────────────────────

function formatTaskEvent(event: any, task: any): FeedEvent | null {
  const payload = event.event_payload || {};
  const actor = task?.created_by_agent || task?.agent_role || 'system';
  const assignee = task?.assigned_agent || task?.agent_role;
  const actorName = getActorDisplay(actor).name;
  const assigneeName = assignee ? getActorDisplay(assignee).name : null;
  const title = task?.title ? `"${task.title.slice(0, 50)}${task.title.length > 50 ? '…' : ''}"` : '"task"';

  let type: EventType = 'status_changed';
  let summary = '';

  switch (event.event_type) {
    case 'created':
      type = 'created';
      summary = actor !== assignee && assigneeName
        ? `${actorName} queued ${title} for ${assigneeName}`
        : `${actorName} created ${title}`;
      break;
    case 'status_changed': {
      const s = payload.new_status;
      if (s === 'completed') { type = 'completed'; summary = `${assigneeName || actorName} completed ${title}`; }
      else if (s === 'blocked') { type = 'blocked'; summary = `${assigneeName || actorName} flagged ${title} as blocked`; }
      else if (s === 'waiting_for_input') { type = 'status_changed'; summary = `${assigneeName || actorName} waiting for input on ${title}`; }
      else if (s === 'in_progress') { type = 'status_changed'; summary = `${assigneeName || actorName} started ${title}`; }
      else { summary = `${assigneeName || actorName} → ${s?.replace(/_/g, ' ')} on ${title}`; }
      break;
    }
    case 'agent_note':
      type = 'status_changed';
      summary = payload.note || `Note on ${title}`;
      break;
    case 'completed':
      type = 'completed';
      summary = `${assigneeName || actorName} completed ${title}`;
      break;
    default:
      summary = `${actorName}: ${event.event_type} on ${title}`;
  }

  return { id: event.id, timestamp: event.created_at, type, actor, target: assignee !== actor ? assignee : undefined, summary, workspace: task?.workspace_id };
}

function formatApprovalEvent(a: any): FeedEvent {
  const actor = a.agent_role || 'system';
  const actorName = getActorDisplay(actor).name;
  const title = `"${(a.title || '').slice(0, 50)}"`;
  let type: EventType = 'approval_created';
  let summary = '';

  if (a.status === 'approved') { type = 'approval_approved'; summary = `Jon approved ${title}`; }
  else if (a.status === 'rejected') { type = 'approval_rejected'; summary = `Jon rejected ${title}`; }
  else { type = 'approval_created'; summary = `${actorName} drafted ${title} for approval`; }

  return { id: `a-${a.id}`, timestamp: a.approved_at || a.rejected_at || a.created_at, type, actor: type === 'approval_created' ? actor : 'jon', summary, workspace: a.workspace_id };
}

function formatOutputEvent(o: any): FeedEvent | null {
  const actor = o.agent_role || 'system';
  const parts: string[] = [];
  if (o.tasks_created > 0) parts.push(`${o.tasks_created} task${o.tasks_created > 1 ? 's' : ''}`);
  if (o.approvals_created > 0) parts.push(`${o.approvals_created} draft${o.approvals_created > 1 ? 's' : ''}`);
  if (o.memories_created > 0) parts.push(`${o.memories_created} memory`);
  if (o.insights_created > 0) parts.push(`${o.insights_created} insight${o.insights_created > 1 ? 's' : ''}`);
  if (parts.length === 0) return null;
  return { id: `o-${o.id}`, timestamp: o.created_at, type: 'created', actor, summary: `${getActorDisplay(actor).name} produced ${parts.join(', ')}`, workspace: o.workspace_id };
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

// ─── Component ──────────────────────────────────────────────────────────────

const ActivityFeed = () => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      const [taskEventsRes, approvalsRes, outputsRes] = await Promise.all([
        (supabase.from('task_events' as any).select('*') as any).order('created_at', { ascending: false }).limit(15),
        (supabase.from('approvals' as any).select('*') as any).order('created_at', { ascending: false }).limit(8),
        (supabase.from('agent_outputs' as any).select('*') as any).order('created_at', { ascending: false }).limit(8),
      ]);

      const all: FeedEvent[] = [];

      if (taskEventsRes.data?.length) {
        const taskIds = [...new Set((taskEventsRes.data as any[]).map((e: any) => e.task_id))];
        const { data: tasksData } = await (supabase.from('tasks' as any).select('id, title, agent_role, assigned_agent, created_by_agent, workspace_id') as any).in('id', taskIds);
        const taskMap = new Map((tasksData || []).map((t: any) => [t.id, t]));
        for (const evt of taskEventsRes.data as any[]) {
          const f = formatTaskEvent(evt, taskMap.get(evt.task_id));
          if (f) all.push(f);
        }
      }

      for (const a of (approvalsRes.data || []) as any[]) all.push(formatApprovalEvent(a));
      for (const o of (outputsRes.data || []) as any[]) { const f = formatOutputEvent(o); if (f) all.push(f); }

      all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const seen = new Set<string>();
      setEvents(all.filter(e => { if (seen.has(e.id)) return false; seen.add(e.id); return true; }).slice(0, 25));
    } catch (err) {
      console.error('[ActivityFeed] error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 12000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  useEffect(() => {
    const ch = supabase.channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_events' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => fetchEvents())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_outputs' }, () => fetchEvents())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchEvents]);

  return (
    <div className={`activity-feed-panel ${collapsed ? 'collapsed' : ''}`}>
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between px-3 py-2 shrink-0 hover:bg-secondary/30 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Activity size={11} className="text-primary" />
          <span className="text-[10px] font-bold text-foreground tracking-wide uppercase">Activity</span>
          {events.length > 0 && <span className="text-[9px] text-muted-foreground">{events.length}</span>}
        </div>
        {collapsed ? <ChevronUp size={11} className="text-muted-foreground" /> : <ChevronDown size={11} className="text-muted-foreground" />}
      </button>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {loading ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-[10px]">Loading…</div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center py-6 text-muted-foreground text-[10px]">No activity yet</div>
          ) : (
            <div className="space-y-0">
              {events.map(event => {
                const { icon: Icon, className } = EVENT_ICONS[event.type] || EVENT_ICONS.status_changed;
                const actorD = getActorDisplay(event.actor);
                return (
                  <div key={event.id} className="flex items-start gap-2 py-1.5 border-b border-border/30 last:border-0">
                    <div className={`mt-0.5 shrink-0 ${className}`}><Icon size={10} /></div>
                    <p className="flex-1 text-[10px] leading-snug text-foreground/85 min-w-0 truncate">{event.summary}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: actorD.color }} />
                      <span className="text-[9px] text-muted-foreground">{relativeTime(event.timestamp)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ActivityFeed;
