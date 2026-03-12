import { useEffect } from 'react';
import { X, Check, XCircle, Mail, Share2, FileText, Clock } from 'lucide-react';
import { useApprovals, Approval } from '@/hooks/useApprovals';
import { agents } from '@/data/agents';

interface ApprovalQueueProps {
  onClose: () => void;
}

const TYPE_CONFIG: Record<string, { label: string; icon: typeof Mail; color: string }> = {
  email_draft: { label: 'Email Draft', icon: Mail, color: 'hsl(var(--agent-inbox))' },
  social_post: { label: 'Social Post', icon: Share2, color: 'hsl(var(--agent-bloom))' },
  general: { label: 'Draft', icon: FileText, color: 'hsl(var(--primary))' },
};

const getTypeConfig = (type: string) =>
  TYPE_CONFIG[type] || { label: type, icon: FileText, color: 'hsl(var(--primary))' };

const ApprovalCard = ({
  item,
  onApprove,
  onReject,
}: {
  item: Approval;
  onApprove: () => void;
  onReject: () => void;
}) => {
  const agent = agents.find(a => a.id === item.agent_role);
  const config = getTypeConfig(item.approval_type);
  const Icon = config.icon;
  const isPending = item.status === 'pending';

  return (
    <div
      className={`bg-card rounded-xl p-4 border border-border shadow-sm transition-all duration-300 ${
        !isPending ? 'opacity-50 scale-[0.98]' : ''
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
        {agent && (
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: agent.colorHex + '18', color: agent.colorHex }}
          >
            {agent.name}
          </span>
        )}
      </div>

      {/* Title */}
      <h4 className="text-sm font-semibold text-foreground mb-1 leading-snug">{item.title}</h4>

      {/* Preview */}
      {item.preview_text && (
        <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-3">
          {item.preview_text}
        </p>
      )}

      {/* Actions */}
      {isPending ? (
        <div className="flex gap-2">
          <button
            onClick={onApprove}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-primary text-primary-foreground hover:opacity-90 transition-colors"
          >
            <Check size={13} /> Approve
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
              bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
          >
            <XCircle size={13} /> Reject
          </button>
        </div>
      ) : (
        <div className={`text-xs font-medium ${item.status === 'approved' ? 'text-primary' : 'text-destructive'}`}>
          {item.status === 'approved' ? '✅ Approved' : '❌ Rejected'}
        </div>
      )}
    </div>
  );
};

const ApprovalQueue = ({ onClose }: ApprovalQueueProps) => {
  const { approvals, loading, fetchApprovals, approveItem, rejectItem } = useApprovals();

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

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
            <p className="text-xs text-muted-foreground mt-1">
              No items waiting for approval
            </p>
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
                      onApprove={() => approveItem(item.id)}
                      onReject={() => rejectItem(item.id)}
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
                      onApprove={() => {}}
                      onReject={() => {}}
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
