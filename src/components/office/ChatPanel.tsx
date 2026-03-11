import { Agent } from '@/data/agents';
import { useState, useRef, useEffect } from 'react';
import { X, Send } from 'lucide-react';

interface ChatPanelProps {
  agent: Agent;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const ChatPanel = ({ agent, onClose }: ChatPanelProps) => {
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

    // Mock response since Lovable Cloud is not enabled
    setTimeout(() => {
      const responses = [
        `Processing your request regarding "${userMessage.slice(0, 30)}...".\n\nI'm currently running analysis on this. As the ${agent.name} agent, I can confirm this falls within my ${agent.role} domain.\n\n> Task queued. Estimated completion: 2.4s`,
        `Acknowledged. Cross-referencing with ${agent.product} database...\n\nBased on current data patterns, I recommend we proceed with a phased approach. Want me to break this down further?`,
        `Running diagnostic on: "${userMessage.slice(0, 25)}..."\n\n✓ Input validated\n✓ Context loaded\n✓ ${agent.product} modules online\n\nReady to execute. Shall I proceed?`,
      ];
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: responses[Math.floor(Math.random() * responses.length)] },
      ]);
      setIsTyping(false);
    }, 1500 + Math.random() * 1000);
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
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
        >
          <X size={14} />
        </button>
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
              {msg.content}
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
