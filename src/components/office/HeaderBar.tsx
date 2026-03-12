import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';

interface HeaderBarProps {
  activeCount: number;
  waitingCount: number;
  onStartStandup?: () => void;
  pendingApprovals?: number;
  onOpenApprovals?: () => void;
  onTasksRan?: () => void;
}

const HeaderBar = ({ activeCount, waitingCount, onStartStandup, pendingApprovals = 0, onOpenApprovals, onTasksRan }: HeaderBarProps) => {
  const [time, setTime] = useState(new Date());
  const [runningTasks, setRunningTasks] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleRunTasks = async () => {
    setRunningTasks(true);
    try {
      const { data, error } = await supabase.functions.invoke('run-agent-tasks', { body: {} });
      if (error) { toast.error('Failed to run tasks', { description: error.message }); return; }

      const results = data?.results || [];
      const completed = results.filter((r: any) => r.status === 'completed').length;
      const failed = results.filter((r: any) => r.status === 'failed').length;
      const other = results.length - completed - failed;

      if (results.length === 0) {
        toast.info('No queued tasks', { description: 'All agents idle.' });
      } else {
        const parts: string[] = [];
        if (completed > 0) parts.push(`${completed} completed`);
        if (other > 0) parts.push(`${other} in progress`);
        if (failed > 0) parts.push(`${failed} failed`);
        toast.success(`Ran ${results.length} task${results.length > 1 ? 's' : ''}`, { description: parts.join(', ') });
      }
      onTasksRan?.();
    } catch (err) {
      toast.error('Error running tasks', { description: String(err) });
    } finally {
      setRunningTasks(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-5 py-2.5 bg-card/95 backdrop-blur-sm border-b border-border">
      {/* Left: Brand */}
      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-sm font-bold">J</span>
        </div>
        <div>
          <span className="font-semibold text-[13px] text-foreground tracking-tight">JonCoach</span>
          <span className="text-[10px] text-muted-foreground ml-1.5 tracking-wide uppercase">Control Room</span>
        </div>
      </div>

      {/* Right: Actions + status */}
      <div className="flex items-center gap-3">
        {/* Run tasks */}
        <button
          onClick={handleRunTasks}
          disabled={runningTasks}
          className="px-3 py-1.5 rounded-lg text-[11px] font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {runningTasks ? (
            <><span className="inline-block w-2.5 h-2.5 border-1.5 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />Running…</>
          ) : '▶ Run Tasks'}
        </button>

        {/* Standup */}
        {onStartStandup && (
          <button
            onClick={onStartStandup}
            className="px-3 py-1.5 rounded-lg text-[11px] font-semibold text-foreground border border-border hover:bg-secondary transition-all"
          >
            Daily Standup
          </button>
        )}

        {/* Approvals */}
        {onOpenApprovals && (
          <button
            onClick={onOpenApprovals}
            className="relative px-3 py-1.5 rounded-lg text-[11px] font-semibold text-foreground border border-border hover:bg-secondary transition-all"
          >
            Approvals
            {pendingApprovals > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
                {pendingApprovals}
              </span>
            )}
          </button>
        )}

        {/* Separator */}
        <div className="w-px h-5 bg-border" />

        {/* Status indicators */}
        <div className="flex items-center gap-3 text-[11px]">
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-status-pulse" />
            <span className="text-foreground font-medium">{activeCount}</span>
            <span className="text-muted-foreground">active</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span className="text-muted-foreground">{waitingCount} waiting</span>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pl-2 border-l border-border">
          <span>{formatDate(time)}</span>
          <span className="text-foreground font-semibold tabular-nums">{formatTime(time)}</span>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
