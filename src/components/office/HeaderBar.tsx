import { useEffect, useState } from 'react';

interface HeaderBarProps {
  activeCount: number;
  waitingCount: number;
}

const HeaderBar = ({ activeCount, waitingCount }: HeaderBarProps) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (d: Date) => {
    return d.toLocaleTimeString('en-US', { hour12: false });
  };

  const formatDate = (d: Date) => {
    return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
  };

  return (
    <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/80 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <span className="text-xl">🏢</span>
        <div>
          <span className="font-pixel text-[10px] text-primary tracking-wider">
            JONCOACH OFFICE
          </span>
          <div className="text-muted-foreground text-[9px]">AUTONOMOUS AGENT SYSTEM v2.1.0</div>
        </div>
      </div>

      <div className="flex items-center gap-6 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-agent-bloom animate-status-pulse" />
          <span className="text-foreground">{activeCount} ACTIVE</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#fbbf24' }} />
          <span className="text-muted-foreground">{waitingCount} WAITING</span>
        </div>
        <div className="border-l border-border pl-4 flex items-center gap-2">
          <span className="text-muted-foreground">{formatDate(time)}</span>
          <span className="text-primary font-semibold">{formatTime(time)}</span>
          <span className="animate-cursor-blink text-primary">_</span>
        </div>
      </div>
    </header>
  );
};

export default HeaderBar;
