import { useState, useEffect, useCallback, useRef } from 'react';
import { agents } from '@/data/agents';
import { supabase } from '@/integrations/supabase/client';
import { Check, SkipForward, Loader2, ArrowRight } from 'lucide-react';

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
  onApproved: (agentIds: string[], followUps: Record<string, string>) => void;
  onDismiss: () => void;
  onCreateTask?: (task: {
    agent_role: string;
    title: string;
    description?: string;
    input_payload?: Record<string, unknown>;
  }) => Promise<unknown>;
}

const DailyStandup = ({ onApproved, onDismiss, onCreateTask }: DailyStandupProps) => {
  const [phase, setPhase] = useState<StandupPhase>('walking-in');
  const [presentingIndex, setPresentingIndex] = useState(0);
  const [suggestions, setSuggestions] = useState<Record<string, string>>(FALLBACK_SUGGESTIONS);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsReady, setSuggestionsReady] = useState(false);
  const fetchedRef = useRef(false);
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [currentFollowUp, setCurrentFollowUp] = useState('');
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'skipped' | null>>(() => {
    const d: Record<string, 'approved' | 'skipped' | null> = {};
    agents.forEach(a => { d[a.id] = null; });
    return d;
  });

  // Fetch suggestions when standup starts
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

  // Walking-in → presenting
  useEffect(() => {
    if (phase === 'walking-in') {
      const minWalkTimer = setTimeout(() => {
        if (suggestionsReady) setPhase('presenting');
      }, 2000);
      return () => clearTimeout(minWalkTimer);
    }
  }, [phase, suggestionsReady]);

  useEffect(() => {
    if (phase === 'walking-in' && suggestionsReady) {
      const t = setTimeout(() => setPhase('presenting'), 500);
      return () => clearTimeout(t);
    }
  }, [phase, suggestionsReady]);

  // Walking-out → complete
  useEffect(() => {
    if (phase === 'walking-out') {
      const t = setTimeout(() => {
        const approvedIds = Object.entries(decisions)
          .filter(([, v]) => v === 'approved')
          .map(([k]) => k);
        onApproved(approvedIds, followUps);
        setPhase('complete');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, decisions, followUps, onApproved]);

  const handleDecision = useCallback((agentId: string, decision: 'approved' | 'skipped') => {
    setDecisions(prev => ({ ...prev, [agentId]: decision }));
  }, []);

  const allDecided = Object.values(decisions).every(d => d !== null);

  const handleFinishApproving = useCallback(() => {
    setPhase('walking-out');
  }, []);

  const approvedCount = Object.values(decisions).filter(d => d === 'approved').length;

  const handleNextPresenting = useCallback(() => {
    const currentAgent = agents[presentingIndex];
    // Save follow-up if entered
    if (currentFollowUp.trim()) {
      setFollowUps(prev => ({ ...prev, [currentAgent.id]: currentFollowUp.trim() }));
    }
    setCurrentFollowUp('');

    if (presentingIndex < agents.length - 1) {
      setPresentingIndex(i => i + 1);
    } else {
      setPhase('approving');
    }
  }, [presentingIndex, currentFollowUp]);

  const isLastAgent = presentingIndex >= agents.length - 1;

  return (
    <div className="absolute inset-0 z-30">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-foreground/10 backdrop-blur-[2px]" />

      {/* Meeting zone glow */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/4 w-[320px] h-[200px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(ellipse, hsla(40, 80%, 70%, 0.15) 0%, transparent 70%)' }}
      />

      {/* Agents in meeting zone */}
      {(phase === 'walking-in' || phase === 'presenting' || phase === 'walking-out') && (
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
                    : (phase === 'walking-out')
                      ? 'translate(0px, 0px)'
                      : `translate(${pos.x}px, ${pos.y}px)`,
                  transition: 'transform 2s cubic-bezier(0.4, 0, 0.2, 1)',
                  left: '50%',
                  top: '50%',
                  marginLeft: '-20px',
                  marginTop: '-24px',
                }}
              >
                <div className={`${(phase === 'walking-in' || phase === 'walking-out') ? 'animate-standup-walk' : 'iso-character'}`}>
                  <div className="flex flex-col items-center" style={{ transform: 'scale(2)' }}>
                    <div className="w-[12px] h-[12px] rounded-full relative" style={{ backgroundColor: '#f0c8a0' }}>
                      <div className="absolute top-[4px] left-[3px] w-[2px] h-[2px] rounded-full bg-[#1a1a1a]" />
                      <div className="absolute top-[4px] right-[3px] w-[2px] h-[2px] rounded-full bg-[#1a1a1a]" />
                    </div>
                    <div className="w-[14px] h-[12px] rounded-sm mt-[1px]" style={{ backgroundColor: agent.colorHex }} />
                    <div className="flex gap-[2px]">
                      <div className="w-[4px] h-[8px] rounded-b-sm bg-[#374151]" />
                      <div className="w-[4px] h-[8px] rounded-b-sm bg-[#374151]" />
                    </div>
                  </div>
                </div>

                <div className="text-[10px] font-semibold text-center mt-1 whitespace-nowrap" style={{ color: agent.colorHex }}>
                  {agent.name}
                </div>

                {/* Presenting card with follow-up input */}
                {isPresenting && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-[300px] animate-bubble-appear">
                    <div
                      className="bg-white rounded-lg p-3 shadow-xl leading-relaxed text-[#1a1a1a]"
                      style={{ borderLeft: `4px solid ${agent.colorHex}`, fontSize: '13px', lineHeight: 1.5 }}
                    >
                      <div className="font-bold mb-1" style={{ fontSize: '15px', color: agent.colorHex }}>
                        {agent.name}
                      </div>
                      <div className="mb-2">{suggestions[agent.id]}</div>
                      <div>
                        <label className="block mb-1" style={{ fontSize: '12px', color: '#6b7280' }}>
                          Refine this task (optional)
                        </label>
                        <input
                          type="text"
                          value={currentFollowUp}
                          onChange={e => setCurrentFollowUp(e.target.value)}
                          placeholder="e.g. Focus on Instagram instead..."
                          className="w-full bg-white outline-none"
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '6px',
                            padding: '8px',
                            fontSize: '13px',
                          }}
                        />
                      </div>
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
      )}

      {/* Presenting: Next button */}
      {phase === 'presenting' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 pointer-events-auto z-40">
          <button
            onClick={handleNextPresenting}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg
              bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            {isLastAgent ? 'Review All' : 'Next'} <ArrowRight size={16} />
          </button>
        </div>
      )}

      {/* Approval phase — full-screen scrollable */}
      {phase === 'approving' && (
        <div className="absolute inset-0 flex flex-col pointer-events-auto z-40">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-3 text-center shadow-sm">
            <h2 className="text-sm font-semibold text-foreground">Daily Standup — Review & Approve</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {Object.values(decisions).filter(d => d !== null).length} of {agents.length} decided
            </p>
          </div>

          {/* Scrollable card grid */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: '80vh' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[860px] mx-auto">
              {agents.map(agent => {
                const decision = decisions[agent.id];
                const agentFollowUp = followUps[agent.id];
                return (
                  <div
                    key={agent.id}
                    className={`bg-white rounded-xl p-3 shadow-lg transition-all duration-300 ${
                      decision ? 'opacity-60 scale-[0.98]' : ''
                    }`}
                    style={{ borderLeft: `4px solid ${agent.colorHex}`, maxWidth: '420px' }}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent.colorHex }} />
                      <span className="font-bold" style={{ fontSize: '15px', color: agent.colorHex }}>
                        {agent.name}
                      </span>
                    </div>
                    <p className="text-[#1a1a1a] mb-1" style={{ fontSize: '13px', lineHeight: 1.5 }}>
                      {suggestions[agent.id]}
                    </p>
                    {agentFollowUp && (
                      <div
                        className="rounded mb-2"
                        style={{
                          backgroundColor: '#f3f4f6',
                          padding: '6px 10px',
                          fontSize: '12px',
                          lineHeight: 1.4,
                          color: '#4b5563',
                        }}
                      >
                        <span style={{ fontWeight: 600, color: '#6b7280' }}>Your note: </span>
                        {agentFollowUp}
                      </div>
                    )}
                    {decision ? (
                      <div className={`text-sm font-medium ${decision === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                        {decision === 'approved' ? '✅ Approved' : '⏭ Skipped'}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(agent.id, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleDecision(agent.id, 'skipped')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-gray-200 text-gray-700 hover:bg-gray-300 transition-colors"
                        >
                          <SkipForward size={13} /> Skip
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Sticky footer */}
          <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur-sm border-t border-border px-4 py-3 flex justify-center">
            <button
              onClick={handleFinishApproving}
              disabled={!allDecided}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold shadow-lg transition-all
                bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              All Done <ArrowRight size={16} />
            </button>
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
              className="px-5 py-2 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all"
            >
              Back to Office
            </button>
          </div>
        </div>
      )}

      {/* Phase indicator */}
      {(phase === 'walking-in' || phase === 'walking-out') && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card border border-border shadow-md text-xs font-medium text-foreground flex items-center gap-2">
          {phase === 'walking-in' && (
            <>
              <Loader2 size={12} className="animate-spin" />
              {suggestionsLoading ? '☕ Gathering context from Gmail & agents...' : '☕ Team is gathering...'}
            </>
          )}
          {phase === 'walking-out' && '🚶 Heading back to work...'}
        </div>
      )}

      {/* Presenting indicator */}
      {phase === 'presenting' && (
        <div className="absolute bottom-28 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-card border border-border shadow-md text-xs font-medium text-foreground">
          📋 {agents[presentingIndex]?.name} ({presentingIndex + 1}/{agents.length})
        </div>
      )}
    </div>
  );
};

export default DailyStandup;
