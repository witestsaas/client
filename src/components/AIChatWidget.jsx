import { useState, useRef, useEffect, useCallback } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, ArrowRight, ChevronDown } from "lucide-react";
import ReactMarkdown from "react-markdown";

const N8N_WEBHOOK_URL = import.meta.env.VITE_N8N_CHAT_WEBHOOK_URL || "";

const SUGGESTED_QUESTIONS = [
  "What is Qalion and how does it work?",
  "How does AI-powered test automation differ from traditional testing?",
  "What kind of teams benefit most from Qalion?",
  "Can I see a quick overview of pricing?",
  "How do I get started with my first test?",
];

function generateSessionId() {
  return "sess_" + crypto.randomUUID();
}

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content:
        "Hi! I'm the Qalion Agent assistant. Ask me anything about our platform — features, pricing, integrations, or how to get started.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(generateSessionId);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
  }, [open]);

  const sendSuggested = useCallback(
    (question) => {
      setInput(question);
      setTimeout(() => {
        const fakeEvent = { trim: () => question };
        // Directly push the message and trigger send logic
        setMessages((prev) => [...prev, { role: "user", content: question }]);
        setLoading(true);

        (async () => {
          try {
            if (!N8N_WEBHOOK_URL) {
              await new Promise((r) => setTimeout(r, 1200));
              setMessages((prev) => [
                ...prev,
                {
                  role: "assistant",
                  content:
                    "Thanks for your question! The n8n webhook isn't configured yet. Set `VITE_N8N_CHAT_WEBHOOK_URL` in your environment to connect the AI agent.",
                },
              ]);
              return;
            }
            const res = await fetch(N8N_WEBHOOK_URL, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId, message: question }),
            });
            if (!res.ok) throw new Error("Request failed");
            const data = await res.json();
            const obj = Array.isArray(data) ? data[0] : data;
            const reply =
              obj?.output || obj?.response || obj?.text || obj?.message || "I couldn't process that. Please try again.";
            setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
          } catch {
            setMessages((prev) => [
              ...prev,
              { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." },
            ]);
          } finally {
            setLoading(false);
            setInput("");
          }
        })();
      }, 0);
    },
    [sessionId]
  );

  const sendMessage = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      if (!N8N_WEBHOOK_URL) {
        // Demo fallback when no webhook configured
        await new Promise((r) => setTimeout(r, 1200));
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              "Thanks for your question! The n8n webhook isn't configured yet. Set `VITE_N8N_CHAT_WEBHOOK_URL` in your environment to connect the AI agent.",
          },
        ]);
        return;
      }

      const res = await fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          message: trimmed,
        }),
      });

      if (!res.ok) throw new Error("Request failed");

      const data = await res.json();
      // n8n may return an array or a plain object
      const obj = Array.isArray(data) ? data[0] : data;
      const reply = obj?.output || obj?.response || obj?.text || obj?.message || "I couldn't process that. Please try again.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Sorry, I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, sessionId]);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* Auto-resize textarea to fit content up to max-height */
  const autoResize = useCallback(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, []);

  useEffect(() => {
    autoResize();
  }, [input, autoResize]);

  /* Markdown component overrides for well-formatted responses */
  const markdownComponents = {
    h1: ({ children }) => <h1 className="font-bold text-[15px] mt-3 mb-1.5 leading-snug">{children}</h1>,
    h2: ({ children }) => <h2 className="font-bold text-[14px] mt-2.5 mb-1 leading-snug">{children}</h2>,
    h3: ({ children }) => <h3 className="font-semibold text-[13.5px] mt-2 mb-1 leading-snug">{children}</h3>,
    h4: ({ children }) => <h4 className="font-semibold text-[13px] mt-1.5 mb-0.5">{children}</h4>,
    p: ({ children }) => <p className="mb-1.5 last:mb-0 leading-relaxed">{children}</p>,
    ol: ({ children }) => <ol className="list-decimal list-outside pl-4 mb-1.5 space-y-0.5">{children}</ol>,
    ul: ({ children }) => <ul className="list-disc list-outside pl-4 mb-1.5 space-y-0.5">{children}</ul>,
    li: ({ children }) => <li className="pl-0.5 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    a: ({ href, children }) => (
      <a href={href} target="_blank" rel="noopener noreferrer" className="text-[#FFAA00] underline hover:text-[#e69900] break-words">
        {children}
      </a>
    ),
    code: ({ inline, children }) =>
      inline !== false && !String(children).includes("\n") ? (
        <code className="bg-black/5 dark:bg-white/10 rounded px-1 py-0.5 text-[12px] font-mono break-all">{children}</code>
      ) : (
        <pre className="bg-black/5 dark:bg-white/10 rounded-lg px-3 py-2 my-1.5 overflow-x-auto">
          <code className="text-[12px] font-mono leading-relaxed whitespace-pre-wrap break-words">{children}</code>
        </pre>
      ),
    pre: ({ children }) => <div className="my-1.5">{children}</div>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-2 border-[#FFAA00]/40 pl-3 my-1.5 text-[12.5px] italic opacity-80">{children}</blockquote>
    ),
    hr: () => <hr className="border-black/10 dark:border-white/10 my-2" />,
    table: ({ children }) => (
      <div className="overflow-x-auto my-1.5">
        <table className="text-[12px] w-full border-collapse">{children}</table>
      </div>
    ),
    th: ({ children }) => <th className="text-left font-semibold px-2 py-1 border-b border-black/10 dark:border-white/10">{children}</th>,
    td: ({ children }) => <td className="px-2 py-1 border-b border-black/5 dark:border-white/5">{children}</td>,
  };

  return (
    <>
      {/* Chat panel */}
      <div
        className={`fixed bottom-20 right-2 sm:right-6 z-[9999] w-[calc(100vw-1rem)] sm:w-[420px] transition-all duration-300 origin-bottom-right ${
          open ? "scale-100 opacity-100 pointer-events-auto" : "scale-95 opacity-0 pointer-events-none"
        }`}
      >
        <div className="rounded-2xl border border-black/10 dark:border-white/10 bg-white dark:bg-[#1c1a2e] shadow-[0_20px_60px_rgba(0,0,0,0.2)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)] overflow-hidden flex flex-col h-[min(560px,calc(100dvh-7rem))]">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-4 py-3.5 border-b border-black/8 dark:border-white/8 bg-gradient-to-r from-[#FFAA00]/10 to-transparent flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#FFAA00]/15 flex items-center justify-center">
                <Sparkles className="h-4 w-4 text-[#FFAA00]" />
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1c1a2e] dark:text-white leading-tight">Qalion Assistant</p>
                <p className="text-[11px] text-[#1c1a2e]/50 dark:text-white/50">Ask anything about our platform</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="h-7 w-7 rounded-lg flex items-center justify-center text-[#1c1a2e]/50 dark:text-white/50 hover:bg-black/5 dark:hover:bg-white/8 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="h-6 w-6 rounded-md bg-[#FFAA00]/12 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <Bot className="h-3.5 w-3.5 text-[#FFAA00]" />
                  </div>
                )}
                <div
                  className={`rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === "user"
                      ? "max-w-[80%] bg-[#FFAA00] text-white rounded-br-md break-words"
                      : "max-w-[85%] bg-[#f4f4f5] dark:bg-white/8 text-[#1c1a2e] dark:text-white/90 rounded-bl-md"
                  } ${msg.role === "assistant" && msg.content.length > 600 ? "max-h-[280px] overflow-y-auto chat-response-scroll" : ""}`}
                >
                  {msg.role === "assistant" ? (
                    <ReactMarkdown components={markdownComponents}>
                      {msg.content}
                    </ReactMarkdown>
                  ) : (
                    msg.content
                  )}
                </div>
                {msg.role === "user" && (
                  <div className="h-6 w-6 rounded-md bg-[#1c1a2e]/8 dark:bg-white/10 flex-shrink-0 flex items-center justify-center mt-0.5">
                    <User className="h-3.5 w-3.5 text-[#1c1a2e]/60 dark:text-white/60" />
                  </div>
                )}
              </div>
            ))}
            {/* Suggested questions — only shown before user's first message */}
            {messages.length === 1 && !loading && (
              <div className="space-y-1.5 ml-8.5">
                {SUGGESTED_QUESTIONS.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => sendSuggested(q)}
                    className="group w-full text-left px-3 py-2 rounded-lg border border-black/6 dark:border-white/6 bg-white dark:bg-white/[0.03] hover:border-[#FFAA00]/30 hover:bg-[#FFAA00]/[0.04] transition-all duration-200 flex items-center justify-between gap-2 cursor-pointer"
                  >
                    <span className="text-[12.5px] text-[#1c1a2e]/70 dark:text-white/60 group-hover:text-[#1c1a2e] dark:group-hover:text-white/90 transition-colors leading-snug">
                      {q}
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#1c1a2e]/20 dark:text-white/20 group-hover:text-[#FFAA00] transition-colors flex-shrink-0" />
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className="flex gap-2.5">
                <div className="h-6 w-6 rounded-md bg-[#FFAA00]/12 flex-shrink-0 flex items-center justify-center mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-[#FFAA00]" />
                </div>
                <div className="bg-[#f4f4f5] dark:bg-white/8 rounded-2xl rounded-bl-md px-4 py-3">
                  <div className="flex gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1c1a2e]/30 dark:bg-white/30 animate-bounce [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1c1a2e]/30 dark:bg-white/30 animate-bounce [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 rounded-full bg-[#1c1a2e]/30 dark:bg-white/30 animate-bounce [animation-delay:300ms]" />
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t border-black/8 dark:border-white/8 px-3 py-3 flex-shrink-0">
            <div className="flex items-end gap-2 rounded-xl border border-black/10 dark:border-white/10 bg-[#f9f9f9] dark:bg-white/5 px-3 py-2 focus-within:ring-2 focus-within:ring-[#FFAA00]/30 focus-within:border-[#FFAA00]/40 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about Qalion..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm text-[#1c1a2e] dark:text-white placeholder:text-[#1c1a2e]/35 dark:placeholder:text-white/35 outline-none leading-relaxed break-words overflow-y-auto overflow-x-hidden"
                style={{ maxHeight: 120, minHeight: 24 }}
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="h-8 w-8 rounded-lg flex-shrink-0 flex items-center justify-center bg-[#FFAA00] text-white disabled:opacity-40 hover:bg-[#e69900] transition-colors cursor-pointer"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-[10px] text-center text-[#1c1a2e]/30 dark:text-white/30 mt-2">
              Powered by Qalion AI
            </p>
          </div>
        </div>
      </div>

      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={`fixed bottom-4 right-4 sm:right-6 z-[9999] h-12 w-12 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 cursor-pointer ${
          open
            ? "bg-[#1c1a2e] dark:bg-white/15 rotate-0"
            : "bg-[#FFAA00] hover:bg-[#e69900] shadow-[0_4px_20px_rgba(255,170,0,0.4)]"
        }`}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? (
          <X className="h-5 w-5 text-white" />
        ) : (
          <MessageSquare className="h-5 w-5 text-white" />
        )}
      </button>
    </>
  );
}
