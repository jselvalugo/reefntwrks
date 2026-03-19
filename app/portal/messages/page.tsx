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

  const userRole = session?.user?.role || "client";

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">Messages</h1>
        <p className="text-sm text-gray-400 mt-1">Chat with the Reef Ntwrks team</p>
      </div>

      {/* Message thread */}
      <div
        className="flex-1 overflow-y-auto rounded-xl p-4 space-y-4"
        style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.08)" }}
      >
        {loading && <p className="text-center text-gray-500 py-8">Loading messages…</p>}
        {!loading && messages.length === 0 && (
          <p className="text-center text-gray-500 py-8">No messages yet. Say hi!</p>
        )}
        {messages.map((msg) => {
          const isOwn = msg.sender.role === userRole;
          const initial = msg.sender.name?.charAt(0).toUpperCase() || "?";
          return (
            <div key={msg.id} className={`flex items-end gap-3 ${isOwn ? "flex-row-reverse" : ""}`}>
              {/* Avatar */}
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0"
                style={{ background: isOwn ? "#FF6B47" : "#2dd4bf", color: "white" }}
              >
                {initial}
              </div>
              <div className={`max-w-xs lg:max-w-md ${isOwn ? "items-end" : "items-start"} flex flex-col gap-1`}>
                <div
                  className="px-4 py-2.5 rounded-2xl text-sm leading-relaxed"
                  style={{
                    background: isOwn ? "#FF6B47" : "rgba(255,255,255,0.08)",
                    color: "white",
                    borderBottomRightRadius: isOwn ? "4px" : undefined,
                    borderBottomLeftRadius: !isOwn ? "4px" : undefined,
                  }}
                >
                  {msg.body}
                </div>
                <p className="text-xs text-gray-600 px-1">
                  {msg.sender.name || (msg.sender.role === "admin" ? "Reef Ntwrks" : "You")} ·{" "}
                  {new Date(msg.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-4 flex gap-3">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message… (Enter to send)"
          rows={2}
          className="flex-1 px-4 py-3 rounded-xl text-sm bg-transparent text-white placeholder-gray-600 resize-none"
          style={{ background: "#1a1f2e", border: "1px solid rgba(255,255,255,0.15)" }}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="px-5 py-3 rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
          style={{ background: "#FF6B47", color: "white" }}
        >
          Send
        </button>
      </div>
    </div>
  );
}
