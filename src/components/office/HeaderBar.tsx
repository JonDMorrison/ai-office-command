import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const handleRunTasks = async () => {
    setRunningTasks(true);
    try {
      const { data, error } = await supabase.functions.invoke('run-agent-tasks', {
        body: {},
      });

      if (error) {
        toast.error('Failed to run tasks', { description: error.message });
        return;
      }

      const results = data?.results || [];
      const completed = results.filter((r: any) => r.status === 'completed').length;
      const failed = results.filter((r: any) => r.status === 'failed').length;
      const other = results.length - completed - failed;

      if (results.length === 0) {
        toast.info('No queued tasks', { description: 'All agents are idle — nothing to run.' });
      } else {
        const parts: string[] = [];
        if (completed > 0) parts.push(`${completed} completed`);
        if (other > 0) parts.push(`${other} in progress`);
        if (failed > 0) parts.push(`${failed} failed`);
        toast.success(`Ran ${results.length} task${results.length > 1 ? 's' : ''}`, {
          description: parts.join(', '),
        });
      }

      onTasksRan?.();
    } catch (err) {
      toast.error('Error running tasks', { description: String(err) });
    } finally {
      setRunningTasks(false);
    }
  };

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-card border-b border-border shadow-sm">
      <div className="flex items-center gap-3">
        <span className="text-2xl">☀️</span>
        <div>
          <span className="font-semibold text-sm text-foreground tracking-wide">
            JonCoach Office
          </span>
          <div className="text-muted-foreground text-xs">Your AI team, ready to help</div>
        </div>
      </div>

      <div className="flex items-center gap-4 text-sm">
        <button
          onClick={handleRunTasks}
          disabled={runningTasks}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-all flex items-center gap-1.5"
        >
          {runningTasks ? (
            <>
              <span className="inline-block w-3 h-3 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Running...
            </>
          ) : (
            '▶ Run Queued Tasks'
          )}
        </button>
        {onStartStandup && (
          <button
            onClick={onStartStandup}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:bg-accent hover:shadow-sm transition-all"
          >
            ☀️ Daily Standup
          </button>
        )}
        {onOpenApprovals && (
          <button
            onClick={onOpenApprovals}
            className="relative px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-foreground border border-border hover:bg-accent hover:shadow-sm transition-all"
          >
            📋 Approvals
            {pendingApprovals > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                {pendingApprovals}
              </span>
            )}
          </button>
        )}
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-agent-bloom animate-status-pulse" />
          <span className="text-foreground font-medium">{activeCount} active</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-agent-project" />
          <span className="text-muted-foreground">{waitingCount} waiting</span>
        </div>
        <div className="border-l border-border pl-4 flex items-center gap-2 text-muted-foreground">
          <span>{formatDate(time)}</span>
          <span className="text-foreground font-medium">{formatTime(time)}</span>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
