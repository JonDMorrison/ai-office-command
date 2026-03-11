import { useState, useEffect, useRef, useCallback } from "react";

const AGENTS = [
  {
    id: "bloomsuite",
    name: "BloomSuite",
    role: "Category Builder",
    color: "#4ade80",
    accent: "#166534",
    desk: { x: 120, y: 160 },
    tasks: [
      "Drafting spring campaign for garden centers...",
      "Researching competitor positioning...",
      "Writing newsletter for independent retailers...",
      "Analyzing BloomSuite churn signals...",
    ],
    avatar: "🌿",
    priority: "#1 PRIORITY",
  },
  {
    id: "clinicleader",
    name: "ClinicLeader",
    role: "Distribution Agent",
    color: "#60a5fa",
    accent: "#1e3a5f",
    desk: { x: 420, y: 160 },
    tasks: [
      "Mapping clinic distribution channels...",
      "Preparing leadership summary report...",
      "Identifying outreach targets...",
      "Reviewing weekly accountability data...",
    ],
    avatar: "🏥",
    priority: "#2",
  },
  {
    id: "projectpath",
    name: "ProjectPath",
    role: "Clarity Agent",
    color: "#f59e0b",
    accent: "#78350f",
    desk: { x: 120, y: 380 },
    tasks: [
      "Defining use-case clarity framework...",
      "Reviewing contractor workflow gaps...",
      "Drafting field worker personas...",
      "Sitting on standby — awaiting direction.",
    ],
    avatar: "🏗️",
    priority: "#3",
  },
  {
    id: "disc",
    name: "DISC Profile",
    role: "Assessment Agent",
    color: "#c084fc",
    accent: "#4c1d95",
    desk: { x: 420, y: 380 },
    tasks: [
      "Processing team assessment reports...",
      "Generating coaching suggestions...",
      "Analyzing hiring alignment data...",
      "Phase 2 on hold — coach marketplace.",
    ],
    avatar: "🧠",
    priority: "#4",
  },
  {
    id: "inbox",
    name: "Inbox",
    role: "Comms Agent",
    color: "#fb923c",
    accent: "#7c2d12",
    desk: { x: 270, y: 270 },
    tasks: [
      "Scanning 14 unread emails...",
      "Drafting reply to client inquiry...",
      "Flagging 2 items for Jon's review...",
      "Filtering noise from signal...",
    ],
    avatar: "📬",
    priority: "ALWAYS ON",
  },
];

const STATES = ["typing", "reading", "idle", "waiting"];

function useAgentState(agent) {
  const [state, setState] = useState("idle");
  const [taskIndex, setTaskIndex] = useState(0);
  const [bobOffset, setBobOffset] = useState(0);
  const [blinkOn, setBlinkOn] = useState(true);

  useEffect(() => {
    const stateInterval = setInterval(() => {
      const newState = STATES[Math.floor(Math.random() * STATES.length)];
      setState(newState);
      if (newState === "typing" || newState === "reading") {
        setTaskIndex((i) => (i + 1) % agent.tasks.length);
      }
    }, 2500 + Math.random() * 2000);

    const bobInterval = setInterval(() => {
      setBobOffset((o) => (o === 0 ? -3 : 0));
    }, 600 + Math.random() * 400);

    const blinkInterval = setInterval(() => {
      setBlinkOn((b) => !b);
    }, 3000 + Math.random() * 2000);

    return () => {
      clearInterval(stateInterval);
      clearInterval(bobInterval);
      clearInterval(blinkInterval);
    };
  }, [agent.tasks.length]);

  return { state, taskIndex, bobOffset, blinkOn };
}

function PixelCharacter({ agent, isSelected, onClick, agentState }) {
  const { state, taskIndex, bobOffset, blinkOn } = agentState;

  const bodyColor = agent.color;
  const shadowColor = agent.accent;

  const getStatusGlow = () => {
    if (state === "waiting") return `0 0 12px 4px #fbbf24`;
    if (state === "typing") return `0 0 12px 4px ${agent.color}`;
    if (state === "reading") return `0 0 8px 2px #a5f3fc`;
    return "none";
  };

  return (
    <div
      onClick={onClick}
      style={{
        position: "absolute",
        left: agent.desk.x,
        top: agent.desk.y + bobOffset,
        cursor: "pointer",
        transition: "top 0.3s ease",
        zIndex: isSelected ? 20 : 10,
      }}
    >
      {/* Desk */}
      <div style={{
        position: "absolute",
        bottom: -18,
        left: -24,
        width: 90,
        height: 18,
        background: `linear-gradient(180deg, #92400e 0%, #78350f 100%)`,
        borderRadius: "3px 3px 0 0",
        boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
        border: "1px solid #a16207",
      }} />

      {/* Monitor */}
      <div style={{
        position: "absolute",
        bottom: 14,
        left: 10,
        width: 40,
        height: 28,
        background: "#1e293b",
        border: `2px solid ${state === "typing" ? agent.color : "#334155"}`,
        borderRadius: 3,
        boxShadow: state === "typing" ? `0 0 8px ${agent.color}60` : "none",
        transition: "border-color 0.3s, box-shadow 0.3s",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 8,
      }}>
        {state === "typing" && (
          <div style={{ color: agent.color, fontFamily: "monospace", fontSize: 6, padding: 2, lineHeight: 1.2 }}>
            {Array(3).fill(0).map((_, i) => (
              <div key={i} style={{ width: `${20 + Math.random() * 15}px`, height: 1.5, background: agent.color, marginBottom: 2, opacity: 0.7 }} />
            ))}
          </div>
        )}
        {state === "reading" && (
          <div style={{ color: "#7dd3fc", fontFamily: "monospace", fontSize: 5, padding: 2, opacity: 0.9 }}>📄</div>
        )}
        {(state === "idle" || state === "waiting") && (
          <div style={{ width: 6, height: 6, background: state === "waiting" ? "#fbbf24" : "#334155", borderRadius: "50%", opacity: blinkOn ? 1 : 0.3, transition: "opacity 0.3s" }} />
        )}
      </div>

      {/* Character body */}
      <div style={{
        position: "relative",
        width: 42,
        height: 52,
        filter: isSelected ? `drop-shadow(0 0 6px ${agent.color})` : "none",
        boxShadow: getStatusGlow(),
        borderRadius: 4,
        transition: "filter 0.2s",
      }}>
        {/* Head */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 9,
          width: 24,
          height: 24,
          background: `linear-gradient(135deg, ${bodyColor} 0%, ${shadowColor} 100%)`,
          borderRadius: "6px 6px 4px 4px",
          border: `2px solid ${shadowColor}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 12,
        }}>
          {agent.avatar}
          {/* Eyes */}
          <div style={{ position: "absolute", bottom: 6, left: 4, width: 4, height: blinkOn ? 4 : 1, background: "#0f172a", borderRadius: "50%", transition: "height 0.1s" }} />
          <div style={{ position: "absolute", bottom: 6, right: 4, width: 4, height: blinkOn ? 4 : 1, background: "#0f172a", borderRadius: "50%", transition: "height 0.1s" }} />
        </div>

        {/* Body */}
        <div style={{
          position: "absolute",
          top: 22,
          left: 6,
          width: 30,
          height: 22,
          background: `linear-gradient(180deg, ${bodyColor}cc 0%, ${shadowColor}cc 100%)`,
          borderRadius: "4px 4px 2px 2px",
          border: `1.5px solid ${shadowColor}`,
        }} />

        {/* Arms - animated when typing */}
        <div style={{
          position: "absolute",
          top: 26,
          left: -4,
          width: 10,
          height: 14,
          background: `${bodyColor}bb`,
          borderRadius: 3,
          border: `1px solid ${shadowColor}`,
          transformOrigin: "top center",
          transform: state === "typing" ? `rotate(${bobOffset === -3 ? -15 : 15}deg)` : "rotate(0deg)",
          transition: "transform 0.15s",
        }} />
        <div style={{
          position: "absolute",
          top: 26,
          right: -4,
          width: 10,
          height: 14,
          background: `${bodyColor}bb`,
          borderRadius: 3,
          border: `1px solid ${shadowColor}`,
          transformOrigin: "top center",
          transform: state === "typing" ? `rotate(${bobOffset === -3 ? 15 : -15}deg)` : "rotate(0deg)",
          transition: "transform 0.15s",
        }} />

        {/* Legs */}
        <div style={{ position: "absolute", bottom: 0, left: 8, width: 10, height: 10, background: shadowColor, borderRadius: "0 0 3px 3px", border: `1px solid ${shadowColor}` }} />
        <div style={{ position: "absolute", bottom: 0, right: 8, width: 10, height: 10, background: shadowColor, borderRadius: "0 0 3px 3px", border: `1px solid ${shadowColor}` }} />
      </div>

      {/* Speech bubble */}
      {(state === "typing" || state === "waiting") && (
        <div style={{
          position: "absolute",
          top: -42,
          left: -60,
          width: 160,
          background: state === "waiting" ? "#fef3c7" : "#1e293b",
          border: `1.5px solid ${state === "waiting" ? "#f59e0b" : agent.color}`,
          borderRadius: 8,
          padding: "5px 8px",
          fontSize: 9,
          color: state === "waiting" ? "#92400e" : agent.color,
          fontFamily: "'Courier New', monospace",
          lineHeight: 1.3,
          boxShadow: `0 2px 12px ${agent.color}40`,
          zIndex: 30,
          animation: "fadeIn 0.3s ease",
          whiteSpace: "normal",
          wordBreak: "break-word",
        }}>
          {state === "waiting" ? "⚠ Needs your input" : agent.tasks[taskIndex]}
          <div style={{
            position: "absolute",
            bottom: -6,
            left: 70,
            width: 10,
            height: 6,
            background: state === "waiting" ? "#fef3c7" : "#1e293b",
            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
            borderLeft: `1.5px solid ${state === "waiting" ? "#f59e0b" : agent.color}`,
            borderRight: `1.5px solid ${state === "waiting" ? "#f59e0b" : agent.color}`,
          }} />
        </div>
      )}

      {/* Name label */}
      <div style={{
        position: "absolute",
        bottom: -34,
        left: "50%",
        transform: "translateX(-50%)",
        whiteSpace: "nowrap",
        textAlign: "center",
      }}>
        <div style={{ fontSize: 10, fontFamily: "'Courier New', monospace", color: agent.color, fontWeight: "bold", textShadow: `0 0 8px ${agent.color}` }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 8, color: "#64748b", fontFamily: "'Courier New', monospace" }}>
          {agent.priority}
        </div>
      </div>
    </div>
  );
}

function ChatPanel({ agent, onClose }) {
  const [messages, setMessages] = useState([
    { from: "agent", text: `Hey Jon. I'm the ${agent.name} agent. What do you need?` }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput("");
    setMessages(m => [...m, { from: "user", text: userMsg }]);
    setLoading(true);

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: `You are the ${agent.name} agent in Jon Morrison's virtual AI office. Your role: ${agent.role}. Jon is a Canadian entrepreneur running 5 SaaS products. ${agent.name} is ${agent.priority === "#1 PRIORITY" ? "his primary focus — a SaaS platform for garden centers combining CRM, marketing automation, and operations. Jon should be doing category building and distribution, NOT coding." : `product ${agent.priority} in his stack.`} Be direct, concise, useful. No fluff. You know Jon well — he over-builds and under-distributes. Push him toward the right actions. Max 3 sentences unless more detail is specifically needed.`,
          messages: [
            ...messages.filter(m => m.from !== "system").map(m => ({
              role: m.from === "user" ? "user" : "assistant",
              content: m.text
            })),
            { role: "user", content: userMsg }
          ]
        })
      });
      const data = await res.json();
      const reply = data.content?.[0]?.text || "Something went wrong.";
      setMessages(m => [...m, { from: "agent", text: reply }]);
    } catch (e) {
      setMessages(m => [...m, { from: "agent", text: "Connection error. Try again." }]);
    }
    setLoading(false);
  };

  return (
    <div style={{
      position: "fixed",
      right: 20,
      bottom: 20,
      width: 340,
      height: 460,
      background: "#0f172a",
      border: `2px solid ${agent.color}`,
      borderRadius: 12,
      display: "flex",
      flexDirection: "column",
      boxShadow: `0 0 40px ${agent.color}40`,
      zIndex: 100,
      fontFamily: "'Courier New', monospace",
      animation: "slideUp 0.25s ease",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px",
        borderBottom: `1px solid ${agent.color}40`,
        display: "flex",
        alignItems: "center",
        gap: 10,
        background: `${agent.color}15`,
      }}>
        <span style={{ fontSize: 20 }}>{agent.avatar}</span>
        <div style={{ flex: 1 }}>
          <div style={{ color: agent.color, fontWeight: "bold", fontSize: 13 }}>{agent.name}</div>
          <div style={{ color: "#64748b", fontSize: 10 }}>{agent.role}</div>
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 18, lineHeight: 1,
          padding: "2px 6px", borderRadius: 4,
        }}>×</button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {messages.map((msg, i) => (
          <div key={i} style={{
            alignSelf: msg.from === "user" ? "flex-end" : "flex-start",
            maxWidth: "85%",
          }}>
            <div style={{
              padding: "8px 12px",
              background: msg.from === "user" ? `${agent.color}25` : "#1e293b",
              border: `1px solid ${msg.from === "user" ? agent.color + "60" : "#334155"}`,
              borderRadius: msg.from === "user" ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
              color: msg.from === "user" ? "#e2e8f0" : agent.color,
              fontSize: 12,
              lineHeight: 1.5,
            }}>
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ alignSelf: "flex-start" }}>
            <div style={{ padding: "8px 12px", background: "#1e293b", border: "1px solid #334155", borderRadius: "12px 12px 12px 2px", color: agent.color, fontSize: 12 }}>
              <span style={{ animation: "blink 1s infinite" }}>thinking...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: `1px solid ${agent.color}30`, display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask your agent..."
          style={{
            flex: 1,
            background: "#1e293b",
            border: `1px solid ${agent.color}50`,
            borderRadius: 8,
            padding: "8px 12px",
            color: "#e2e8f0",
            fontSize: 12,
            fontFamily: "'Courier New', monospace",
            outline: "none",
          }}
        />
        <button onClick={send} disabled={loading} style={{
          background: agent.color,
          border: "none",
          borderRadius: 8,
          padding: "8px 14px",
          color: "#0f172a",
          fontWeight: "bold",
          cursor: "pointer",
          fontSize: 12,
          fontFamily: "'Courier New', monospace",
          opacity: loading ? 0.5 : 1,
        }}>→</button>
      </div>
    </div>
  );
}

export default function JonCoachOffice() {
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatAgent, setChatAgent] = useState(null);
  const [time, setTime] = useState(new Date());

  const agentStates = AGENTS.map(agent => useAgentState(agent));

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const handleAgentClick = (agent) => {
    setSelectedAgent(agent.id);
    setChatAgent(agent);
  };

  const activeCount = agentStates.filter(s => s.state === "typing" || s.state === "reading").length;
  const waitingCount = agentStates.filter(s => s.state === "waiting").length;

  return (
    <div style={{
      width: "100%",
      minHeight: "100vh",
      background: "#070d1a",
      fontFamily: "'Courier New', monospace",
      overflow: "hidden",
      position: "relative",
    }}>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
        @keyframes flicker { 0%, 100% { opacity: 1; } 95% { opacity: 0.97; } 96% { opacity: 0.8; } 97% { opacity: 1; } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f172a; } ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
      `}</style>

      {/* CRT scanline overlay */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
        pointerEvents: "none", zIndex: 50, animation: "flicker 8s infinite",
      }} />

      {/* Header bar */}
      <div style={{
        padding: "14px 24px",
        borderBottom: "1px solid #1e293b",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "#0a1628",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ fontSize: 20 }}>🏢</div>
          <div>
            <div style={{ color: "#4ade80", fontSize: 14, fontWeight: "bold", letterSpacing: "0.1em", textShadow: "0 0 12px #4ade8080" }}>
              JONCOACH OFFICE
            </div>
            <div style={{ color: "#334155", fontSize: 10, letterSpacing: "0.05em" }}>
              AUTONOMOUS AGENT SYSTEM v1.0
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#4ade80", fontSize: 18, fontWeight: "bold" }}>{activeCount}</div>
            <div style={{ color: "#334155", fontSize: 9 }}>ACTIVE</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ color: "#fbbf24", fontSize: 18, fontWeight: "bold" }}>{waitingCount}</div>
            <div style={{ color: "#334155", fontSize: 9 }}>WAITING</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#60a5fa", fontSize: 13 }}>{time.toLocaleTimeString()}</div>
            <div style={{ color: "#334155", fontSize: 9 }}>{time.toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" })}</div>
          </div>
        </div>
      </div>

      {/* Office floor */}
      <div style={{ position: "relative", margin: "20px auto", maxWidth: 680, height: 540 }}>

        {/* Floor grid */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `
            linear-gradient(rgba(30,41,59,0.4) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,41,59,0.4) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          borderRadius: 12,
          border: "1px solid #1e293b",
          background: "#0d1b2e",
        }} />

        {/* Room walls suggestion */}
        <div style={{ position: "absolute", inset: 10, border: "2px solid #1e3a5f", borderRadius: 8, pointerEvents: "none" }} />

        {/* Floor label */}
        <div style={{
          position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
          color: "#1e3a5f", fontSize: 10, letterSpacing: "0.3em", pointerEvents: "none",
        }}>
          · · · JON'S OFFICE · · ·
        </div>

        {/* Plant decorations */}
        <div style={{ position: "absolute", top: 20, left: 20, fontSize: 20, filter: "drop-shadow(0 0 6px #4ade8040)" }}>🌱</div>
        <div style={{ position: "absolute", top: 20, right: 20, fontSize: 20, filter: "drop-shadow(0 0 6px #4ade8040)" }}>🌱</div>
        <div style={{ position: "absolute", bottom: 20, left: 20, fontSize: 16 }}>☕</div>
        <div style={{ position: "absolute", bottom: 20, right: 20, fontSize: 16 }}>📋</div>

        {/* Agents */}
        {AGENTS.map((agent, i) => (
          <PixelCharacter
            key={agent.id}
            agent={agent}
            isSelected={selectedAgent === agent.id}
            onClick={() => handleAgentClick(agent)}
            agentState={agentStates[i]}
          />
        ))}
      </div>

      {/* Status bar */}
      <div style={{
        margin: "0 auto", maxWidth: 680, padding: "10px 16px",
        display: "flex", gap: 8, flexWrap: "wrap",
      }}>
        {AGENTS.map((agent, i) => (
          <div
            key={agent.id}
            onClick={() => handleAgentClick(agent)}
            style={{
              padding: "5px 12px",
              background: selectedAgent === agent.id ? `${agent.color}20` : "#0a1628",
              border: `1px solid ${selectedAgent === agent.id ? agent.color : "#1e293b"}`,
              borderRadius: 20,
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              transition: "all 0.2s",
            }}
          >
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: agentStates[i].state === "typing" ? agent.color
                : agentStates[i].state === "waiting" ? "#fbbf24"
                : agentStates[i].state === "reading" ? "#7dd3fc"
                : "#334155",
              boxShadow: agentStates[i].state !== "idle" ? `0 0 6px ${agent.color}` : "none",
              animation: agentStates[i].state !== "idle" ? "blink 1.5s infinite" : "none",
            }} />
            <span style={{ color: selectedAgent === agent.id ? agent.color : "#64748b", fontSize: 10 }}>
              {agent.name}
            </span>
          </div>
        ))}
        <div style={{ marginLeft: "auto", color: "#1e3a5f", fontSize: 10, alignSelf: "center" }}>
          CLICK AN AGENT TO CHAT
        </div>
      </div>

      {/* Chat panel */}
      {chatAgent && (
        <ChatPanel agent={chatAgent} onClose={() => { setChatAgent(null); setSelectedAgent(null); }} />
      )}
    </div>
  );
}
