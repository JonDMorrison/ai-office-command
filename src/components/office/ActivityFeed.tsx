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
  | 'created'
  | 'delegated'
  | 'blocked'
  | 'completed'
  | 'status_changed'
  | 'approval_created'
  | 'approval_approved'
  | 'approval_rejected'
  | 'insight_created'
  | 'memory_saved';

// ─── Agent display helpers ──────────────────────────────────────────────────

const AGENT_DISPLAY: Record<string, { name: string; color: string }> = {};
agents.forEach(a => { AGENT_DISPLAY[a.id] = { name: a.name, color: a.colorHex }; });
AGENT_DISPLAY['system'] = { name: 'System', color: 'hsl(var(--muted-foreground))' };
AGENT_DISPLAY['executive'] = { name: 'Chief of Staff', color: '#6366f1' };
AGENT_DISPLAY['jon'] = { name: 'Jon', color: 'hsl(var(--primary))' };

function getActorDisplay(id: string) {
  return AGENT_DISPLAY[id] || { name: id, color: 'hsl(var(--muted-foreground))' };
}

// ─── Event icons ────────────────────────────────────────────────────────────

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

// ─── Formatting helpers ─────────────────────────────────────────────────────

function formatTaskEvent(event: any, task: any): FeedEvent | null {
  const eventType = event.event_type;
  const payload = event.event_payload || {};
  const actor = task?.created_by_agent || task?.agent_role || 'system';
  const assignee = task?.assigned_agent || task?.agent_role;
  const actorName = getActorDisplay(actor).name;
  const assigneeName = assignee ? getActorDisplay(assignee).name : null;

  let type: EventType = 'status_changed';
  let summary = '';

  switch (eventType) {
    case 'created':
      type = 'created';
      if (actor !== assignee && assigneeName) {
        summary = `${actorName} queued "${task?.title}" for ${assigneeName}`;
      } else {
        summary = `${actorName} created "${task?.title}"`;
      }
      break;
    case 'status_changed': {
      const newStatus = payload.new_status;
      if (newStatus === 'completed') {
        type = 'completed';
        summary = `${assigneeName || actorName} completed "${task?.title}"`;
      } else if (newStatus === 'blocked') {
        type = 'blocked';
        summary = `${assigneeName || actorName} flagged "${task?.title}" as blocked`;
      } else if (newStatus === 'waiting_for_input') {
        type = 'status_changed';
        summary = `${assigneeName || actorName} is waiting for input on "${task?.title}"`;
      } else if (newStatus === 'in_progress') {
        type = 'status_changed';
        summary = `${assigneeName || actorName} started working on "${task?.title}"`;
      } else {
        summary = `${assigneeName || actorName} moved "${task?.title}" to ${newStatus?.replace(/_/g, ' ')}`;
      }
      break;
    }
    case 'agent_note':
      type = 'status_changed';
      summary = payload.note || `Agent note on "${task?.title}"`;
      break;
    case 'completed':
      type = 'completed';
      summary = `${assigneeName || actorName} completed "${task?.title}"`;
      break;
    default:
      summary = `${actorName}: ${eventType} on "${task?.title}"`;
  }

  // Truncate title in summary
  if (summary.length > 120) summary = summary.slice(0, 117) + '…';

  return {
    id: event.id,
    timestamp: event.created_at,
    type,
    actor,
    target: assignee !== actor ? assignee : undefined,
    summary,
    workspace: task?.workspace_id || undefined,
  };
}

function formatApprovalEvent(approval: any): FeedEvent {
  const actor = approval.agent_role || 'system';
  const actorName = getActorDisplay(actor).name;
  let type: EventType = 'approval_created';
  let summary = '';

  if (approval.status === 'approved') {
    type = 'approval_approved';
    summary = `Jon approved "${approval.title}" from ${actorName}`;
  } else if (approval.status === 'rejected') {
    type = 'approval_rejected';
    summary = `Jon rejected "${approval.title}" from ${actorName}`;
  } else {
    type = 'approval_created';
    summary = `${actorName} created ${approval.approval_type?.replace(/_/g, ' ')} draft: "${approval.title}"`;
  }

  if (summary.length > 120) summary = summary.slice(0, 117) + '…';

  return {
    id: `approval-${approval.id}`,
    timestamp: approval.approved_at || approval.rejected_at || approval.created_at,
    type,
    actor: type === 'approval_created' ? actor : 'jon',
    target: type === 'approval_created' ? undefined : actor,
    summary,
    workspace: approval.workspace_id,
  };
}

function formatOutputEvent(output: any): FeedEvent | null {
  const actor = output.agent_role || 'system';
  const actorName = getActorDisplay(actor).name;
  const parts: string[] = [];
  if (output.tasks_created > 0) parts.push(`${output.tasks_created} task${output.tasks_created > 1 ? 's' : ''}`);
  if (output.approvals_created > 0) parts.push(`${output.approvals_created} approval${output.approvals_created > 1 ? 's' : ''}`);
  if (output.memories_created > 0) parts.push(`${output.memories_created} memor${output.memories_created > 1 ? 'ies' : 'y'}`);
  if (output.insights_created > 0) parts.push(`${output.insights_created} insight${output.insights_created > 1 ? 's' : ''}`);

  if (parts.length === 0) return null;

  return {
    id: `output-${output.id}`,
    timestamp: output.created_at,
    type: 'created',
    actor,
    summary: `${actorName} produced ${parts.join(', ')}`,
    workspace: output.workspace_id,
  };
}

// ─── Time formatting ────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// ─── Component ──────────────────────────────────────────────────────────────

const FEED_LIMIT = 30;

const ActivityFeed = () => {
  const [events, setEvents] = useState<FeedEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(false);

  const fetchEvents = useCallback(async () => {
    try {
      // Fetch in parallel: task_events (with task data), approvals, agent_outputs
      const [taskEventsRes, approvalsRes, outputsRes] = await Promise.all([
        (supabase
          .from('task_events' as any)
          .select('*') as any)
          .order('created_at', { ascending: false })
          .limit(20),
        (supabase
          .from('approvals' as any)
          .select('*') as any)
          .order('created_at', { ascending: false })
          .limit(10),
        (supabase
          .from('agent_outputs' as any)
          .select('*') as any)
          .order('created_at', { ascending: false })
          .limit(10),
      ]);

      const allEvents: FeedEvent[] = [];

      // Process task_events — need to fetch associated tasks for context
      if (taskEventsRes.data?.length) {
        const taskIds = [...new Set((taskEventsRes.data as any[]).map((e: any) => e.task_id))];
        const { data: tasksData } = await (supabase
          .from('tasks' as any)
          .select('id, title, agent_role, assigned_agent, created_by_agent, workspace_id') as any)
          .in('id', taskIds);

        const taskMap = new Map((tasksData || []).map((t: any) => [t.id, t]));

        for (const evt of taskEventsRes.data as any[]) {
          const task = taskMap.get(evt.task_id);
          const formatted = formatTaskEvent(evt, task);
          if (formatted) allEvents.push(formatted);
        }
      }

      // Process approvals
      if (approvalsRes.data?.length) {
        for (const approval of approvalsRes.data as any[]) {
          allEvents.push(formatApprovalEvent(approval));
        }
      }

      // Process agent_outputs — only show ones with actual artifact production
      if (outputsRes.data?.length) {
        for (const output of outputsRes.data as any[]) {
          const formatted = formatOutputEvent(output);
          if (formatted) allEvents.push(formatted);
        }
      }

      // Sort by timestamp descending, deduplicate, limit
      allEvents.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      const seen = new Set<string>();
      const deduped = allEvents.filter(e => {
        if (seen.has(e.id)) return false;
        seen.add(e.id);
        return true;
      });

      setEvents(deduped.slice(0, FEED_LIMIT));
    } catch (err) {
      console.error('[ActivityFeed] Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
    const interval = setInterval(fetchEvents, 12000);
    return () => clearInterval(interval);
  }, [fetchEvents]);

  // Realtime subscriptions for live updates
  useEffect(() => {
    const channel = supabase
      .channel('activity-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'task_events' }, () => fetchEvents())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => fetchEvents())
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'agent_outputs' }, () => fetchEvents())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchEvents]);

  return (
    <div className="flex flex-col bg-card/80 backdrop-blur-sm border-t border-border overflow-hidden transition-all duration-300"
      style={{ height: collapsed ? '36px' : '180px' }}
    >
      {/* Header */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center justify-between px-4 py-2 shrink-0 hover:bg-secondary/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Activity size={13} className="text-primary" />
          <span className="text-[11px] font-semibold text-foreground tracking-wide uppercase">
            Activity
          </span>
          {events.length > 0 && (
            <span className="text-[10px] font-medium text-muted-foreground">
              {events.length} recent
            </span>
          )}
        </div>
        {collapsed ? <ChevronUp size={13} className="text-muted-foreground" /> : <ChevronDown size={13} className="text-muted-foreground" />}
      </button>

      {/* Feed content */}
      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-3 pb-2">
          {loading ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-[11px]">
              Loading activity…
            </div>
          ) : events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground text-[11px]">
              No recent activity
            </div>
          ) : (
            <div className="space-y-0">
              {events.map(event => {
                const iconConfig = EVENT_ICONS[event.type] || EVENT_ICONS.status_changed;
                const Icon = iconConfig.icon;
                const actorDisplay = getActorDisplay(event.actor);

                return (
                  <div
                    key={event.id}
                    className="flex items-start gap-2.5 py-1.5 border-b border-border/40 last:border-0 group"
                  >
                    {/* Icon */}
                    <div className={`mt-0.5 shrink-0 ${iconConfig.className}`}>
                      <Icon size={12} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] leading-snug text-foreground/90 truncate">
                        {event.summary}
                      </p>
                    </div>

                    {/* Timestamp + actor badge */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full opacity-70"
                        style={{
                          backgroundColor: actorDisplay.color + '18',
                          color: actorDisplay.color,
                        }}
                      >
                        {actorDisplay.name.split(' ')[0]}
                      </span>
                      <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                        {relativeTime(event.timestamp)}
                      </span>
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
