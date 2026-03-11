import { useState, useEffect, useCallback, useRef } from 'react';
import { agents } from '@/data/agents';
import { supabase } from '@/integrations/supabase/client';
import { Check, SkipForward, Loader2 } from 'lucide-react';

type StandupPhase = 'idle' | 'walking-in' | 'presenting' | 'approving' | 'walking-out' | 'complete';

const FALLBACK_SUGGESTIONS: Record<string, string> = {
  bloomsuite: "Spring is coming — time to launch the seasonal campaign. Want me to draft the email series?",
  clinicleader: "You haven't posted about ClinicLeader in 3 weeks. Want me to draft a LinkedIn post?",
  projectpath: "ProjectPath has 2 features half-built. Want me to write a prioritization summary?",
  discprofile: "Your DISC app has no public content. Want me to create a sample team report to share?",
  inbox: "You have unread emails across both accounts. Want me to triage and draft replies?",
};

const MEETING_POSITIONS = [
  { x: -120, y: -40 },
  { x: -60,  y: -70 },
  { x: 0,    y: -80 },
  { x: 60,   y: -70 },
  { x: 120,  y: -40 },
];

interface DailyStandupProps {
  onApproved: (agentIds: string[]) => void;
  onDismiss: () => void;
}

const DailyStandup = ({ onApproved, onDismiss }: DailyStandupProps) => {
  const [phase, setPhase] = useState<StandupPhase>('walking-in');
  const [presentingIndex, setPresentingIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Record<string, string>>(FALLBACK_SUGGESTIONS);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsReady, setSuggestionsReady] = useState(false);
  const fetchedRef = useRef(false);
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'skipped' | null>>(() => {
    const d: Record<string, 'approved' | 'skipped' | null> = {};
    agents.forEach(a => { d[a.id] = null; });
    return d;
  });

  // Fetch suggestions when standup starts (walking-in phase)
  useEffect(() => {
    if (phase === 'walking-in' && !fetchedRef.current) {
      fetchedRef.current = true;
      setSuggestionsLoading(true);

      supabase.functions.invoke('daily-standup', { body: {} })
        .then(({ data, error }) => {
          if (error) {
            console.error('Standup fetch error:', error);
            setSuggestionsReady(true);
            return;
          }
          if (data?.suggestions) {
            setSuggestions(prev => ({ ...prev, ...data.suggestions }));
          }
          setSuggestionsReady(true);
        })
        .catch(err => {
          console.error('Standup fetch failed:', err);
          setSuggestionsReady(true);
        })
        .finally(() => setSuggestionsLoading(false));
    }
  }, [phase]);

  // Walking-in → presenting (wait for suggestions to be ready)
  useEffect(() => {
    if (phase === 'walking-in') {
      // Minimum 2s walk + wait for suggestions
      const minWalkTimer = setTimeout(() => {
        if (suggestionsReady) {
          setPhase('presenting');
        }
      }, 2000);
      return () => clearTimeout(minWalkTimer);
    }
  }, [phase, suggestionsReady]);

  // If suggestions arrive after 2s walk timer already fired
  useEffect(() => {
    if (phase === 'walking-in' && suggestionsReady) {
      const t = setTimeout(() => setPhase('presenting'), 500);
      return () => clearTimeout(t);
    }
  }, [phase, suggestionsReady]);

  // Presenting auto-advance
  useEffect(() => {
    if (phase === 'presenting') {
      if (presentingIndex < agents.length) {
        const t = setTimeout(() => setPresentingIndex(i => i + 1), 3000);
        return () => clearTimeout(t);
      } else {
        setPhase('approving');
      }
    }
  }, [phase, presentingIndex]);

  // Walking-out → complete
  useEffect(() => {
    if (phase === 'walking-out') {
      const t = setTimeout(() => {
        const approvedIds = Object.entries(decisions)
          .filter(([, v]) => v === 'approved')
          .map(([k]) => k);
        onApproved(approvedIds);
        setPhase('complete');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, decisions, onApproved]);

  const handleDecision = useCallback((agentId: string, decision: 'approved' | 'skipped') => {
    setDecisions(prev => ({ ...prev, [agentId]: decision }));
  }, []);

  const allDecided = Object.values(decisions).every(d => d !== null);

  const handleFinishApproving = useCallback(() => {
    if (allDecided) setPhase('walking-out');
  }, [allDecided]);

  const approvedCount = Object.values(decisions).filter(d => d === 'approved').length;

  if (phase === 'idle') {
    return (
      <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
        <button
          onClick={() => setPhase('walking-in')}
          className="pointer-events-auto px-5 py-3 rounded-xl text-sm font-semibold shadow-lg
            bg-card border-2 border-border text-foreground
            hover:shadow-xl hover:scale-105 transition-all duration-200"
        >
          ☀️ Start Daily Standup
        </button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 z-30">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]" />

      {/* Meeting zone glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/4 w-[320px] h-[200px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse, hsla(40, 80%, 70%, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Agents walking to meeting zone */}
      <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2">
        {agents.map((agent, i) => {
          const isPresenting = phase === 'presenting' && presentingIndex === i;
          const hasPresented = phase === 'presenting' && presentingIndex > i;
          const pos = MEETING_POSITIONS[i];

          return (
            <div
              key={agent.id}
              className="absolute"
              style={{
                transform: (phase === 'walking-in')
                  ? `translate(${pos.x}px, ${pos.y}px)`
                  : (phase === 'walking-out' || phase === 'complete')
                    ? 'translate(0px, 0px)'
                    : `translate(${pos.x}px, ${pos.y}px)`,
                transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
                left: '50%',
                top: '50%',
                marginLeft: '-20px',
                marginTop: '-24px',
              }}
            >
              {/* Walking animation wrapper */}
              <div className={`${(phase === 'walking-in' || phase === 'walking-out') ? 'animate-standup-walk' : 'iso-character'}`}>
                <div className="flex flex-col items-center" style={{ transform: 'scale(2)' }}>
                  <div
                    className="w-[12px] h-[12px] rounded-full relative"
                    style={{ backgroundColor: '#f0c8a0' }}
                  >
                    <div className="absolute top-[4px] left-[3px] w-[2px] h-[2px] rounded-full bg-[#1a1a1a]" />
                    <div className="absolute top-[4px] right-[3px] w-[2px] h-[2px] rounded-full bg-[#1a1a1a]" />
                  </div>
                  <div
                    className="w-[14px] h-[12px] rounded-sm mt-[1px]"
                    style={{ backgroundColor: agent.colorHex }}
                  />
                  <div className="flex gap-[2px]">
                    <div className="w-[4px] h-[8px] rounded-b-sm bg-[#374151]" />
                    <div className="w-[4px] h-[8px] rounded-b-sm bg-[#374151]" />
                  </div>
                </div>
              </div>

              <div
                className="text-[10px] font-semibold text-center mt-1 whitespace-nowrap"
                style={{ color: agent.colorHex }}
              >
                {agent.name}
              </div>

              {/* Presenting card */}
              {isPresenting && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[260px] animate-bubble-appear">
                  <div
                    className="bg-white rounded-lg p-3 shadow-xl text-[13px] leading-relaxed text-[#1a1a1a]"
                    style={{ borderLeft: `4px solid ${agent.colorHex}` }}
                  >
                    {suggestions[agent.id]}
                  </div>
                </div>
              )}

              {hasPresented && phase === 'presenting' && (
                <div className="absolute -top-2 left-1/2 -translate-x-1/2 text-muted-foreground text-xs">✓</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Approval cards */}
      {phase === 'approving' && (
        <div className="absolute inset-x-0 top-4 bottom-20 flex items-center justify-center pointer-events-auto overflow-y-auto">
          <div className="flex flex-wrap justify-center gap-3 max-w-[700px] px-4 py-4">
            {agents.map(agent => {
              const decision = decisions[agent.id];
              return (
                <div
                  key={agent.id}
                  className={`w-[300px] bg-white rounded-xl p-4 shadow-xl transition-all duration-300 ${
                    decision ? 'opacity-60 scale-95' : ''
                  }`}
                  style={{ borderLeft: `4px solid ${agent.colorHex}` }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: agent.colorHex }} />
                    <span className="text-sm font-semibold" style={{ color: agent.colorHex }}>
                      {agent.name}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed text-[#1a1a1a] mb-3">
                    {suggestions[agent.id]}
                  </p>
                  {decision ? (
                    <div className={`text-sm font-medium ${decision === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                      {decision === 'approved' ? '✅ Approved' : '⏭ Skipped'}
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDecision(agent.id, 'approved')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                          bg-green-500 text-white hover:bg-green-600 transition-colors"
                      >
                        <Check size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleDecision(agent.id, 'skipped')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                          bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                      >
                        <SkipForward size={14} /> Skip
                      </button>
                    </div>
                  )}
                </div>
              );
            })}

            {allDecided && (
              <div className="w-full flex justify-center mt-2">
                <button
                  onClick={handleFinishApproving}
                  className="px-6 py-2.5 rounded-xl text-sm font-semibold bg-primary text-primary-foreground
                    hover:opacity-90 transition-all shadow-lg animate-bubble-appear"
                >
                  Continue →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Complete summary */}
      {phase === 'complete' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
          <div className="bg-white rounded-2xl p-6 shadow-2xl max-w-md text-center animate-bubble-appear">
            <div className="text-2xl mb-2">✅</div>
            <h3 className="text-lg font-semibold text-[#1a1a1a] mb-1">Standup Complete</h3>
            <p className="text-sm text-[#555] mb-4">
              {approvedCount} task{approvedCount !== 1 ? 's' : ''} approved. Click any agent to review their work.
            </p>
            <button
              onClick={onDismiss}
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground
                hover:opacity-90 transition-all"
            >
              Back to Office
            </button>
          </div>
        </div>
      )}

      {/* Phase indicator */}
      {(phase === 'walking-in' || phase === 'presenting' || phase === 'walking-out') && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card border border-border shadow-md text-xs font-medium text-foreground flex items-center gap-2">
          {phase === 'walking-in' && (
            <>
              <Loader2 size={12} className="animate-spin" />
              {suggestionsLoading ? '☕ Gathering context from Gmail & agents...' : '☕ Team is gathering...'}
            </>
          )}
          {phase === 'presenting' && `📋 ${agents[presentingIndex]?.name || 'Team'} is presenting...`}
          {phase === 'walking-out' && '🚶 Heading back to work...'}
        </div>
      )}
    </div>
  );
};

export default DailyStandup;