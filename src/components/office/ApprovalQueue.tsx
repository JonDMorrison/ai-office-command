import { useEffect, useState } from 'react';
import { X, Check, XCircle, Mail, Share2, FileText, Clock, ChevronDown, ChevronUp, Download, Copy, CheckCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { agents } from '@/data/agents';
import { toast } from 'sonner';

interface Approval {
  id: string;
  workspace_id: string;
  agent_role: string;
  task_id: string | null;
  approval_type: string;
  title: string;
  preview_text: string | null;
  full_payload: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
  approved_at: string | null;
  rejected_at: string | null;
}

interface ApprovalQueueProps {
  onClose: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  email_draft: { label: 'Email Draft', icon: Mail, color: 'hsl(var(--agent-inbox))' },
  social_post: { label: 'Social Post', icon: Share2, color: 'hsl(var(--agent-bloom))' },
  blog_post: { label: 'Blog Post', icon: FileText, color: 'hsl(var(--primary))' },
  ad_copy: { label: 'Ad Copy', icon: FileText, color: 'hsl(var(--primary))' },
  general: { label: 'Draft', icon: FileText, color: 'hsl(var(--primary))' },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] || { label: type.replace(/_/g, ' '), icon: FileText, color: 'hsl(var(--primary))' };

// ─── Helpers ────────────────────────────────────────────────────────────────

function getContentText(item: Approval): string {
  const payload = item.full_payload as any;
  return payload?.content || item.preview_text || item.title || '';
}

function downloadAsMarkdown(item: Approval) {
  const content = getContentText(item);
  const agent = agents.find(a => a.id === item.agent_role);
  const header = `# ${item.title}\n\n**Agent:** ${agent?.name || item.agent_role}\n**Type:** ${item.approval_type}\n**Date:** ${new Date(item.created_at).toLocaleDateString()}\n\n---\n\n`;
  const blob = new Blob([header + content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.title.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(item: Approval) {
  const content = getContentText(item);
  await navigator.clipboard.writeText(content);
  toast.success('Copied to clipboard');
}

/** Log an approval decision back to task_events so the originating agent gets feedback */
async function feedbackToAgent(item: Approval, decision: 'approved' | 'rejected') {
  // If the approval is linked to a task, log an event on that task
  if (item.task_id) {
    await (supabase.from('task_events' as any).insert({
      task_id: item.task_id,
      event_type: decision === 'approved' ? 'approval_approved' : 'approval_rejected',
      event_payload: {
        approval_id: item.id,
        approval_type: item.approval_type,
        title: item.title,
        decision,
        note: `Jon ${decision} "${item.title}"`,
      },
    } as any));
  }
}

// ─── Card ───────────────────────────────────────────────────────────────────

const ApprovalCard = ({
  item,
  isExpanded,
  onToggleExpand,
  onApprove,
  onReject,
  isProcessing,
}: {
  item: Approval;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onApprove: () => void;
  onReject: () => void;
  isProcessing: boolean;
}) => {
  const [copied, setCopied] = useState(false);
  const agent = agents.find(a => a.id === item.agent_role);
  const config = getTypeConfig(item.approval_type);
  const Icon = config.icon;
  const isPending = item.status === 'pending';
  const isApproved = item.status === 'approved';
  const hasContent = !!(getContentText(item));

  const handleCopy = async () => {
    await copyToClipboard(item);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`bg-card rounded-xl p-4 border border-border shadow-sm transition-all duration-300 ${
        !isPending ? 'opacity-75' : ''
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ backgroundColor: config.color + '22', color: config.color }}
          >
            <Icon size={13} />
          </div>
          <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
        </div>
        <div className="flex items-center gap-2">
          {agent && (
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: agent.colorHex + '18', color: agent.colorHex }}
            >
              {agent.name}
            </span>
          )}
          <button
            onClick={onToggleExpand}
            className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground"
          >
            {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{item.title}</h4>

      {/* Preview */}
      {item.preview_text && (
        <p className={`text-xs text-muted-foreground leading-relaxed mb-3 ${isExpanded ? '' : 'line-clamp-3'}`}>
          {item.preview_text}
        </p>
      )}

      {/* Expanded full content */}
      {isExpanded && (
        <div className="mb-3 space-y-2">
          {(item.full_payload as any)?.content && (
            <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
              <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
                {(item.full_payload as any).content}
              </p>
            </div>
          )}
          {!(item.full_payload as any)?.content && Object.keys(item.full_payload).length > 0 && (
            <div className="p-2.5 rounded-lg bg-secondary/50 border border-border">
              <pre className="text-[10px] text-muted-foreground whitespace-pre-wrap break-words leading-relaxed font-mono max-h-48 overflow-y-auto">
                {JSON.stringify(item.full_payload, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      {isPending ? (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-colors"
          >
            <Check size={13} /> {isProcessing ? 'Saving...' : 'Approve'}
          </button>
          <button
            onClick={onReject}
            disabled={isProcessing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-secondary text-secondary-foreground hover:bg-accent disabled:opacity-50 transition-colors"
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className={`text-xs font-medium ${isApproved ? 'text-emerald-600' : 'text-destructive'}`}>
            {isApproved ? '✅ Approved' : '❌ Rejected'}
          </div>
          {/* Post-approval actions for approved items */}
          {isApproved && hasContent && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
                  bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                title="Copy content"
              >
                {copied ? <CheckCheck size={10} /> : <Copy size={10} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => downloadAsMarkdown(item)}
                className="flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium
                  bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                title="Download as markdown"
              >
                <Download size={10} /> Export
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Queue ───────────────────────────────────────────────────────────────────

const ApprovalQueue = ({ onClose }: ApprovalQueueProps) => {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const { data, error } = await (supabase
        .from('approvals' as any)
        .select('*') as any)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApprovals((data as Approval[]) || []);
    } catch (err) {
      console.error('Failed to fetch approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
    const channel = supabase
      .channel('approvals-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'approvals' }, () => loadApprovals())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleApprove = async (item: Approval) => {
    setProcessingId(item.id);
    try {
      // For email drafts, save to Gmail
      if (item.approval_type === 'email_draft') {
        const { error: fnError } = await supabase.functions.invoke('save-gmail-draft', {
          body: { workspaceId: item.workspace_id, payload: item.full_payload },
        });
        if (fnError) {
          console.error('Gmail draft save failed:', fnError);
          toast.error('Could not save Gmail draft — approved anyway');
        } else {
          toast.success('Email draft saved to Gmail');
        }
      }

      // Mark approved
      await (supabase
        .from('approvals' as any)
        .update({ status: 'approved', approved_at: new Date().toISOString() } as any)
        .eq('id', item.id) as any);

      // Feed decision back to originating agent
      await feedbackToAgent(item, 'approved');

      setApprovals(prev =>
        prev.map(a => a.id === item.id ? { ...a, status: 'approved', approved_at: new Date().toISOString() } : a)
      );

      toast.success(`Approved: ${item.title}`);
    } catch (err) {
      console.error('Failed to approve:', err);
      toast.error('Failed to approve');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await (supabase
        .from('approvals' as any)
        .update({ status: 'rejected', rejected_at: new Date().toISOString() } as any)
        .eq('id', id) as any);

      const item = approvals.find(a => a.id === id);
      if (item) await feedbackToAgent(item, 'rejected');

      setApprovals(prev =>
        prev.map(a => a.id === id ? { ...a, status: 'rejected', rejected_at: new Date().toISOString() } : a)
      );

      toast.info('Rejected');
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const pending = approvals.filter(a => a.status === 'pending');
  const resolved = approvals.filter(a => a.status !== 'pending');

  return (
    <div className="w-96 h-full border-l border-border flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Clock size={16} className="text-primary" />
          <span className="text-sm font-semibold text-foreground">Approval Queue</span>
          {pending.length > 0 && (
            <span className="text-xs font-bold px-1.5 py-0.5 rounded-full bg-destructive text-destructive-foreground">
              {pending.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground text-xs">
            Loading approvals...
          </div>
        ) : approvals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="text-2xl mb-2">✨</div>
            <p className="text-sm font-medium text-foreground">All clear</p>
            <p className="text-xs text-muted-foreground mt-1">No items waiting for approval</p>
          </div>
        ) : (
          <>
            {pending.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Pending ({pending.length})
                </h3>
                <div className="space-y-2">
                  {pending.map(item => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedId === item.id}
                      onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onApprove={() => handleApprove(item)}
                      onReject={() => handleReject(item.id)}
                      isProcessing={processingId === item.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {resolved.length > 0 && (
              <div className={pending.length > 0 ? 'mt-4' : ''}>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
                  Resolved ({resolved.length})
                </h3>
                <div className="space-y-2">
                  {resolved.map(item => (
                    <ApprovalCard
                      key={item.id}
                      item={item}
                      isExpanded={expandedId === item.id}
                      onToggleExpand={() => setExpandedId(expandedId === item.id ? null : item.id)}
                      onApprove={() => {}}
                      onReject={() => {}}
                      isProcessing={false}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;
