import { Agent } from '@/data/agents';
import { useState, useRef, useEffect } from 'react';
import { X, Send, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

interface ChatPanelProps {
  agent: Agent;
  onClose: () => void;
  onOpenSkills: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatPanel = ({ agent, onClose, onOpenSkills }: ChatPanelProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `> ${agent.name} Agent online.\n> Specialization: ${agent.role}\n> Status: ${agent.status.toUpperCase()}\n\nHow can I assist you today?`,
    },
  ]);
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
      // Build conversation history (exclude the initial greeting)
      const conversationMessages = messages
        .slice(1)
        .map(m => ({ role: m.role, content: m.content }));
      conversationMessages.push({ role: 'user', content: userMessage });

      const { data, error } = await supabase.functions.invoke('agent-chat', {
        body: { messages: conversationMessages, agentId: agent.id },
      });

      if (error) throw error;

      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: data.text || 'No response.' },
      ]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: '⚠ Error connecting to agent. Check your Anthropic API key and try again.' },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div
      className="w-96 h-full border-l flex flex-col"
      style={{
        borderColor: `${agent.colorHex}30`,
        backgroundColor: 'hsl(220 50% 5% / 0.98)',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: `${agent.colorHex}30` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full animate-status-pulse"
            style={{ backgroundColor: agent.colorHex }}
          />
          <div>
            <div className="font-pixel text-[10px]" style={{ color: agent.colorHex }}>
              {agent.name.toUpperCase()}
            </div>
            <div className="text-[10px] text-muted-foreground">{agent.role}</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onOpenSkills}
            className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title="Edit Skills"
          >
            <Settings size={14} />
          </button>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] px-3 py-2 rounded text-xs whitespace-pre-wrap leading-relaxed ${
                msg.role === 'user' ? 'bg-secondary text-secondary-foreground' : ''
              }`}
              style={
                msg.role === 'assistant'
                  ? {
                      backgroundColor: `${agent.colorHex}10`,
                      color: agent.colorHex,
                      border: `1px solid ${agent.colorHex}20`,
                    }
                  : undefined
              }
            >
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm prose-invert max-w-none [&_*]:text-inherit [&_*]:text-xs [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div
              className="px-3 py-2 rounded text-xs"
              style={{
                backgroundColor: `${agent.colorHex}10`,
                color: agent.colorHex,
                border: `1px solid ${agent.colorHex}20`,
              }}
            >
              <span className="animate-cursor-blink">█</span> Processing...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t" style={{ borderColor: `${agent.colorHex}30` }}>
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: agent.colorHex }}>
            &gt;
          </span>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder={`Message ${agent.name}...`}
            className="flex-1 bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || isTyping}
            className="p-1.5 rounded transition-colors disabled:opacity-30"
            style={{ color: agent.colorHex }}
          >
            <Send size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPanel;
