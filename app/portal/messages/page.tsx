"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useRef, useCallback } from "react";

interface Message {
  id: string;
  body: string;
  createdAt: string;
  sender: { name: string | null; role: string };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const [clientId, setClientId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Get client ID
  useEffect(() => {
    fetch("/api/v1/clients/me")
      .then((r) => r.json())
      .then((d) => setClientId(d.id));
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!clientId) return;
    const res = await fetch(`/api/v1/clients/${clientId}/messages`);
    if (res.ok) {
      const data = await res.json();
      setMessages(data);
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function sendMessage() {
    if (!newMessage.trim() || !clientId) return;
    setSending(true);
    const res = await fetch(`/api/v1/clients/${clientId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: newMessage }),
    });
    if (res.ok) {
      const msg = await res.json();
      setMessages((prev) => [...prev, msg]);
      setNewMessage("");
    }
    setSending(false);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const userId = session?.user?.id;

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 0px)", minHeight: "600px" }}>
      {/* Header */}
      <div
        className="px-6 py-4 flex-shrink-0"
        style={{ borderBottom: "1px solid var(--color-border)", background: "white" }}
      >
        <h1 className="text-lg font-bold" style={{ color: "var(--color-text)" }}>Messages</h1>
        <p className="text-xs mt-0.5" style={{ color: "var(--color-text-muted)" }}>Direct communication with your Reef Ntwrks team</p>
      </div>

      {/* Thread */}
      <div
        className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
        style={{ background: "var(--color-surface)" }}
      >
        {loading && (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin mb-2" style={{ borderColor: "var(--color-coral)" }} />
            <p className="text-xs" style={{ color: "var(--color-text-subtle)" }}>Loading messages…</p>
          </div>
        )}
        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center mb-4"
              style={{ background: "var(--color-surface-2)" }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: "var(--color-text-subtle)" }}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-sm font-medium" style={{ color: "var(--color-text-muted)" }}>No messages yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--color-text-subtle)" }}>Send a message to start the conversation.</p>
          </div>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender.role === "client";
          const initial = msg.sender.name?.charAt(0).toUpperCase() || "?";
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              {!isOwn && (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white flex-shrink-0"
                  style={{ background: "var(--color-coral)" }}
                >
                  {initial}
                </div>
              )}
              <div className={`max-w-[70%] flex flex-col gap-1 ${isOwn ? "items-end" : "items-start"}`}>
                {!isOwn && (
                  <p className="text-xs font-medium px-1" style={{ color: "var(--color-text-muted)" }}>
                    {msg.sender.name ?? "Reef Ntwrks"}
                  </p>
                )}
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isOwn ? "var(--color-coral)" : "white",
                    color: isOwn ? "white" : "var(--color-text)",
                    border: isOwn ? "none" : "1px solid var(--color-border)",
                    borderBottomRightRadius: isOwn ? "4px" : undefined,
                    borderBottomLeftRadius: !isOwn ? "4px" : undefined,
                  }}
                >
                  {msg.body}
                </div>
                <p className="text-xs px-1" style={{ color: "var(--color-text-subtle)" }}>
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div
        className="flex-shrink-0 px-6 py-4 flex items-end gap-3"
        style={{ borderTop: "1px solid var(--color-border)", background: "white" }}
      >
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
          rows={2}
          className="flex-1 px-4 py-3 rounded-xl text-sm resize-none outline-none transition-all"
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="flex-shrink-0 px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50 text-white"
          style={{ background: "var(--color-coral)" }}
        >
          {sending ? "…" : "Send"}
        </button>
      </div>
    </div>
  );
}
