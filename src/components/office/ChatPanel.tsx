import { Agent } from '@/data/agents';
import { useState, useRef, useEffect } from 'react';
import { X, Send, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  agent: Agent;
  onClose: () => void;
  onOpenSkills: () => void;
  initialNote?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  artifacts?: { tasks: number; approvals: number; memories: number; insights: number };
}

const ChatPanel = ({ agent, onClose, onOpenSkills, initialNote }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>(() => {
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
  });
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
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsTyping(true);

    try {
      const conversationMessages = messages
        .map(m => ({ role: m.role, content: m.content }));
      conversationMessages.push({ role: 'user', content: userMessage });

      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: { messages: conversationMessages, agentId: agent.id },
      });

      if (error) throw error;

      const artifacts = data.artifacts_created || undefined;
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.text || 'No response.', artifacts },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: 'Sorry, I had trouble connecting. Please try again.' },
      ]);
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
            {msg.artifacts && (msg.artifacts.tasks > 0 || msg.artifacts.approvals > 0) && (
              <div className="flex gap-1.5 mt-1 px-1">
                {msg.artifacts.tasks > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                    📋 {msg.artifacts.tasks} task{msg.artifacts.tasks > 1 ? 's' : ''}
                  </span>
                )}
                {msg.artifacts.approvals > 0 && (
                  <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                    ✋ {msg.artifacts.approvals} approval{msg.artifacts.approvals > 1 ? 's' : ''}
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
