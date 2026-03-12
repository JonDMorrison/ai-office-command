import { useEffect, useState } from 'react';

interface HeaderBarProps {
  activeCount: number;
  waitingCount: number;
  onStartStandup?: () => void;
  pendingApprovals?: number;
  onOpenApprovals?: () => void;
}

const HeaderBar = ({ activeCount, waitingCount, onStartStandup, pendingApprovals = 0, onOpenApprovals }: HeaderBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const formatDate = (d: Date) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

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
