import { Agent } from '@/data/agents';
import { useState, useRef, useEffect } from 'react';
import { X, Send, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';
import { toast } from '@/hooks/use-toast';

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  artifacts?: { tasks: number; approvals: number; memories: number; insights: number; delegations: number };
}

interface ChatPanelProps {
  agent: Agent;
  onClose: () => void;
  onOpenSkills: () => void;
  onOpenApprovals?: () => void;
  initialNote?: string;
  messages: Message[];
  onMessagesChange: (messages: Message[]) => void;
}

export function buildInitialMessages(agent: Agent, initialNote?: string): Message[] {
  const initial: Message[] = [];
  if (initialNote) {
    initial.push({
      role: 'user',
      content: `Before starting, note Jon's refinement: ${initialNote}`,
    });
  }
  initial.push({
    role: 'assistant',
    content: initialNote
      ? `Got it — I'll factor in that refinement. I'm ${agent.name}, your ${agent.role} specialist. Let's get started!`
      : `Hi! I'm ${agent.name}, your ${agent.role} specialist. How can I help you today?`,
  });
  return initial;
}

const ChatPanel = ({ agent, onClose, onOpenSkills, onOpenApprovals, messages, onMessagesChange }: ChatPanelProps) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setInput('');
    const updated = [...messages, { role: 'user' as const, content: userMessage }];
    onMessagesChange(updated);
    setIsTyping(true);

    try {
      const conversationMessages = updated.map(m => ({ role: m.role, content: m.content }));

      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: {
          messages: conversationMessages,
          agentId: agent.id,
          workspaceId: agent.workspaceId,
        },
      });

      if (error) throw error;

      const artifacts = {
        tasks: data.tasksCreated || 0,
        approvals: data.approvalsCreated || 0,
        memories: data.memoriesCreated || 0,
        insights: data.insightsCreated || 0,
        delegations: data.delegationsCreated || 0,
      };
      const hasArtifacts = Object.values(artifacts).some(v => v > 0);
      const withReply = [
        ...updated,
        { role: 'assistant' as const, content: data.message || data.text || 'No response.', artifacts: hasArtifacts ? artifacts : undefined },
      ];
      onMessagesChange(withReply);

      // Show toast for created artifacts
      const artifactParts: string[] = [];
      if (artifacts.tasks > 0) artifactParts.push(`${artifacts.tasks} task${artifacts.tasks > 1 ? 's' : ''} created`);
      if (artifacts.approvals > 0) artifactParts.push(`${artifacts.approvals} approval${artifacts.approvals > 1 ? 's' : ''} pending`);
      if (artifacts.delegations > 0) artifactParts.push(`${artifacts.delegations} delegated`);
      if (artifacts.memories > 0) artifactParts.push(`${artifacts.memories} memor${artifacts.memories > 1 ? 'ies' : 'y'} saved`);
      if (artifacts.insights > 0) artifactParts.push(`${artifacts.insights} insight${artifacts.insights > 1 ? 's' : ''} logged`);

      if (artifactParts.length > 0) {
        toast({
          description: artifactParts.join(' · '),
          duration: 3000,
        });
      }
    } catch (err) {
      console.error('Chat error:', err);
      const withError = [
        ...updated,
        { role: 'assistant' as const, content: 'Sorry, I had trouble connecting. Please try again.' },
      ];
      onMessagesChange(withError);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="w-96 h-full border-l border-border flex flex-col bg-card">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-status-pulse"
            style={{ backgroundColor: agent.colorHex }}
          />
          <div>
            <div className="text-sm font-semibold" style={{ color: agent.colorHex }}>
              {agent.name}
            </div>
            <div className="text-xs text-muted-foreground">{agent.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSkills}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Edit Skills"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground rounded-2xl rounded-br-md'
                  : 'bg-secondary text-secondary-foreground rounded-2xl rounded-bl-md'
              }`}
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm max-w-none [&_*]:text-inherit [&_*]:text-sm [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.artifacts && (msg.artifacts.tasks > 0 || msg.artifacts.approvals > 0 || msg.artifacts.delegations > 0) && (
              <div className="flex flex-wrap gap-1.5 mt-1 px-1">
                {msg.artifacts.tasks > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                    📋 {msg.artifacts.tasks} task{msg.artifacts.tasks > 1 ? 's' : ''}
                  </span>
                )}
                {msg.artifacts.approvals > 0 && (
                  <button
                    onClick={onOpenApprovals}
                    className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground hover:bg-accent/80 transition-colors cursor-pointer"
                  >
                    ✋ {msg.artifacts.approvals} approval{msg.artifacts.approvals > 1 ? 's' : ''}
                  </button>
                )}
                {msg.artifacts.delegations > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                    🤝 {msg.artifacts.delegations} delegated
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-secondary text-muted-foreground px-3.5 py-2.5 rounded-2xl rounded-bl-md text-sm">
              <span className="inline-flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '300ms' }} />
              </span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${agent.name}...`}
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="p-1.5 rounded-lg transition-colors disabled:opacity-30 hover:bg-primary/10"
            style={{ color: agent.colorHex }}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
