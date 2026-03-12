import { useState, useEffect, useCallback, useRef } from 'react';
import { agents } from '@/data/agents';
import { supabase } from '@/integrations/supabase/client';
import { Check, SkipForward, Loader2, ArrowRight, Star } from 'lucide-react';

type StandupPhase = 'idle' | 'walking-in' | 'presenting' | 'approving' | 'walking-out' | 'complete';

interface StructuredSuggestion {
  agent_role: string;
  workspace_id: string;
  title: string;
  description: string;
  urgency_score: number;
  impact_score: number;
  task_type: string;
}

const MEETING_POSITIONS = [
  { x: -160, y: -40 },
  { x: -96,  y: -70 },
  { x: -32,  y: -80 },
  { x: 32,   y: -80 },
  { x: 96,   y: -70 },
  { x: 160,  y: -40 },
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
  const [suggestions, setSuggestions] = useState<StructuredSuggestion[]>([]);
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [focusRecommendation, setFocusRecommendation] = useState<string | null>(null);
  const [focusReason, setFocusReason] = useState<string | null>(null);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [suggestionsReady, setSuggestionsReady] = useState(false);
  const fetchedRef = useRef(false);
  const [followUps, setFollowUps] = useState<Record<string, string>>({});
  const [decisions, setDecisions] = useState<Record<number, 'approved' | 'skipped' | null>>({});

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
          if (data?.structured_suggestions?.length) {
            setSuggestions(data.structured_suggestions);
            const initialDecisions: Record<number, 'approved' | 'skipped' | null> = {};
            data.structured_suggestions.forEach((_: any, i: number) => { initialDecisions[i] = null; });
            setDecisions(initialDecisions);
          }
          if (data?.executive_summary) setExecutiveSummary(data.executive_summary);
          if (data?.focus_recommendation) setFocusRecommendation(data.focus_recommendation);
          if (data?.focus_reason) setFocusReason(data.focus_reason);
          setSuggestionsReady(true);
        })
        .catch(err => {
          console.error('Standup fetch failed:', err);
          setSuggestionsReady(true);
        })
        .finally(() => setSuggestionsLoading(false));
    }
  }, [phase]);

  // Walking-in → presenting (executive briefing)
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
        const approvedAgentIds = suggestions
          .filter((_, i) => decisions[i] === 'approved')
          .map(s => s.agent_role);
        const uniqueIds = [...new Set(approvedAgentIds)];
        onApproved(uniqueIds, followUps);
        setPhase('complete');
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [phase, decisions, followUps, onApproved, suggestions]);

  const handleDecision = useCallback((index: number, decision: 'approved' | 'skipped') => {
    setDecisions(prev => ({ ...prev, [index]: decision }));

    if (decision === 'approved' && onCreateTask) {
      const suggestion = suggestions[index];
      const agent = agents.find(a => a.id === suggestion.agent_role);
      const followUp = followUps[String(index)];
      onCreateTask({
        agent_role: suggestion.agent_role,
        title: suggestion.title.slice(0, 120),
        description: suggestion.description,
        input_payload: {
          title: suggestion.title,
          description: suggestion.description,
          urgency_score: suggestion.urgency_score,
          impact_score: suggestion.impact_score,
          task_type: suggestion.task_type,
          ...(followUp ? { follow_up: followUp } : {}),
          agent_name: agent?.name || suggestion.agent_role,
          source: 'executive_standup',
        },
      });
    }
  }, [onCreateTask, suggestions, followUps]);

  const allDecided = suggestions.length > 0 && Object.keys(decisions).length === suggestions.length &&
    Object.values(decisions).every(d => d !== null);

  const handleFinishApproving = useCallback(() => {
    setPhase('walking-out');
  }, []);

  const approvedCount = Object.values(decisions).filter(d => d === 'approved').length;

  const focusAgent = agents.find(a => a.id === focusRecommendation || a.workspaceId === focusRecommendation);

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
            const pos = MEETING_POSITIONS[i] || { x: 0, y: -90 };
            return (
              <div
                key={agent.id}
                className="absolute"
                style={{
                  transform: `translate(${pos.x}px, ${pos.y}px)`,
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
              </div>
            );
          })}
        </div>
      )}

      {/* Presenting: Executive briefing card */}
      {phase === 'presenting' && (
        <div className="absolute inset-0 flex items-start justify-center pt-8 pointer-events-auto z-40">
          <div className="w-[500px] max-w-[90vw] animate-bubble-appear">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
              {/* Executive header */}
              <div className="px-5 py-4 border-b border-gray-100" style={{ background: 'linear-gradient(135deg, #6366f115, #6366f108)' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Star size={16} className="text-indigo-500" />
                  <span className="text-sm font-bold text-indigo-600">Chief of Staff — Daily Briefing</span>
                </div>
                <p className="text-[13px] text-gray-700 leading-relaxed">{executiveSummary || 'Preparing briefing...'}</p>
              </div>

              {/* Focus recommendation */}
              {focusRecommendation && (
                <div className="px-5 py-3 bg-amber-50/60 border-b border-amber-100/50 flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0"
                    style={{ backgroundColor: focusAgent?.colorHex || '#6366f1' }}
                  >
                    {focusAgent?.avatar || '🎯'}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-amber-800">
                      Today's Focus → {focusAgent?.name || focusRecommendation}
                    </div>
                    <div className="text-xs text-amber-700 leading-snug">{focusReason}</div>
                  </div>
                </div>
              )}

              {/* Suggestion count */}
              <div className="px-5 py-2 text-xs text-gray-500 font-medium">
                {suggestions.length} prioritized action{suggestions.length !== 1 ? 's' : ''} for today
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <button
                onClick={() => setPhase('approving')}
                className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold shadow-lg
                  bg-primary text-primary-foreground hover:opacity-90 transition-all"
              >
                Review Actions <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Approval phase */}
      {phase === 'approving' && (
        <div className="absolute inset-0 flex flex-col pointer-events-auto z-40">
          {/* Sticky header */}
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-border px-4 py-3 shadow-sm">
            <div className="max-w-[860px] mx-auto flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Daily Standup — Review & Approve</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {Object.values(decisions).filter(d => d !== null).length} of {suggestions.length} decided
                </p>
              </div>
              {focusRecommendation && focusAgent && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200">
                  <span className="text-xs font-semibold" style={{ color: focusAgent.colorHex }}>
                    🎯 Focus: {focusAgent.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Scrollable card grid */}
          <div className="flex-1 overflow-y-auto px-4 py-4" style={{ maxHeight: '80vh' }}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-[860px] mx-auto">
              {suggestions.map((suggestion, index) => {
                const decision = decisions[index];
                const agent = agents.find(a => a.id === suggestion.agent_role);
                const isFocusWorkspace = suggestion.workspace_id === focusRecommendation;
                const followUpKey = String(index);

                return (
                  <div
                    key={index}
                    className={`bg-white rounded-xl p-3 shadow-lg transition-all duration-300 ${
                      decision ? 'opacity-60 scale-[0.98]' : ''
                    } ${isFocusWorkspace ? 'ring-2 ring-amber-300' : ''}`}
                    style={{ borderLeft: `4px solid ${agent?.colorHex || '#6366f1'}`, maxWidth: '420px' }}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: agent?.colorHex || '#6366f1' }} />
                        <span className="font-bold" style={{ fontSize: '14px', color: agent?.colorHex || '#6366f1' }}>
                          {agent?.name || suggestion.agent_role}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-gray-100 text-gray-500">
                          {suggestion.task_type?.replace('_', ' ') || 'task'}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                          style={{
                            backgroundColor: (suggestion.urgency_score * suggestion.impact_score) >= 16 ? '#fef2f2' : '#f0fdf4',
                            color: (suggestion.urgency_score * suggestion.impact_score) >= 16 ? '#dc2626' : '#16a34a',
                          }}
                        >
                          U{suggestion.urgency_score}×I{suggestion.impact_score}
                        </span>
                      </div>
                    </div>

                    <h4 className="text-[13px] font-semibold text-gray-900 mb-0.5 leading-snug">{suggestion.title}</h4>
                    <p className="text-[12px] text-gray-600 mb-2 leading-relaxed">{suggestion.description}</p>

                    {/* Follow-up input */}
                    {!decision && (
                      <input
                        type="text"
                        value={followUps[followUpKey] || ''}
                        onChange={e => setFollowUps(prev => ({ ...prev, [followUpKey]: e.target.value }))}
                        placeholder="Add context (optional)..."
                        className="w-full mb-2 bg-white outline-none"
                        style={{
                          border: '1px solid #e5e7eb',
                          borderRadius: '6px',
                          padding: '6px 10px',
                          fontSize: '12px',
                        }}
                      />
                    )}

                    {followUps[followUpKey] && decision && (
                      <div className="rounded mb-2" style={{
                        backgroundColor: '#f3f4f6',
                        padding: '5px 8px',
                        fontSize: '11px',
                        color: '#4b5563',
                      }}>
                        <span style={{ fontWeight: 600 }}>Note: </span>{followUps[followUpKey]}
                      </div>
                    )}

                    {decision ? (
                      <div className={`text-sm font-medium ${decision === 'approved' ? 'text-green-600' : 'text-gray-400'}`}>
                        {decision === 'approved' ? '✅ Approved' : '⏭ Skipped'}
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleDecision(index, 'approved')}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium
                            bg-green-500 text-white hover:bg-green-600 transition-colors"
                        >
                          <Check size={13} /> Approve
                        </button>
                        <button
                          onClick={() => handleDecision(index, 'skipped')}
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
              {approvedCount} task{approvedCount !== 1 ? 's' : ''} approved and queued.
              {focusAgent && (
                <span className="block mt-1 font-medium" style={{ color: focusAgent.colorHex }}>
                  🎯 Primary focus: {focusAgent.name}
                </span>
              )}
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
              {suggestionsLoading ? '👔 Chief of Staff reviewing all workspaces...' : '☕ Team is gathering...'}
            </>
          )}
          {phase === 'walking-out' && '🚶 Heading back to work...'}
        </div>
      )}
    </div>
  );
};

export default DailyStandup;
