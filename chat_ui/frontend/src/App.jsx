import React, { useEffect, useRef, useState } from "react";
import "./App.css";
import { AIClient } from "./lib/ai/client";
import { APP_NAME } from "./lib/config";
import Sidebar from "./components/Sidebar";
import Spinner from "./components/Spinner";

const ai = new AIClient();

export default function App() {
  const role = localStorage.getItem("role") || "student";

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef(null);

  // Load conversations on mount
  useEffect(() => {
    (async () => {
      const list = await ai.listConversations();
      setConversations(list);
      if (list.length > 0) {
        setActiveId(list[0].id);
      } else {
        const c = await ai.createConversation("New Chat");
        setConversations([c]);
        setActiveId(c.id);
      }
    })();
  }, []);

  // Load messages when activeId changes
  useEffect(() => {
    (async () => {
      if (!activeId) return;
      const msgs = await ai.getMessages(activeId);
      setMessages(msgs);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    })();
  }, [activeId]);

  const startNewChat = async () => {
    const c = await ai.createConversation("New Chat");
    setConversations(prev => [c, ...prev]);
    setActiveId(c.id);
    setMessages([]);
    setInput("");
  };

  // EXPLICITLY delete by the id that was clicked, not the active one.
  const deleteConversation = async (id) => {
    if (ai.deleteConversation) { try { await ai.deleteConversation(id); } catch {} }
  
    // Compute next list from current state
    const nextList = conversations.filter(c => c.id !== id);
    setConversations(nextList);
  
    // If you deleted the active one, choose the next to show (or create a new one)
    if (id === activeId) {
      if (nextList.length > 0) {
        setActiveId(nextList[0].id);
      } else {
        const c = await ai.createConversation("New Chat");
        setConversations([c]);
        setActiveId(c.id);
      }
      setMessages([]);
    }
  };

  const selectConversation = async (id) => {
    if (id === activeId) return;
    setActiveId(id);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !activeId) return;
    setInput("");

    const optimistic = { role: "user", content: text, createdAt: new Date().toISOString() };
    setMessages(m => [...m, optimistic]);
    setLoading(true);

    try {
      const resp = await ai.chat({ threadId: activeId, message: text });
      setMessages(m => [...m, { role: "assistant", content: resp.content, createdAt: resp.createdAt }]);
      setConversations(prev => {
        const copy = [...prev];
        const idx = copy.findIndex(c => c.id === activeId);
        if (idx >= 0) copy[idx] = { ...copy[idx], updatedAt: new Date().toISOString() };
        return copy;
      });
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", content: `⚠️ ${e.message}`, createdAt: new Date().toISOString() }]);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" }), 50);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="min-h-screen flex bg-neutral-50">
      {/* Left Sidebar */}
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onNewChat={startNewChat}
        onSelect={selectConversation}
        onDelete={deleteConversation}
      />

      {/* Main Chat */}
      <div className="flex-1 flex flex-col">
        <header className="px-4 py-3 border-b bg-white flex items-center justify-between">
          <h1 className="font-semibold">{APP_NAME}</h1>
          <div className="text-sm opacity-70">Role: {role}</div>
        </header>

        <div className="p-4 flex-1 flex flex-col relative">
          <div ref={listRef} className="flex-1 overflow-auto border rounded bg-white p-4 space-y-3 pb-28">
            {messages.length === 0 && !loading && (
              <div className="text-neutral-500 text-sm">
                Start a conversation. Example: <em>“Explain the Pythagorean theorem.”</em>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={m.role === "user" ? "text-right" : "text-left"}>
                <div className={
                  "inline-block px-3 py-2 rounded " +
                  (m.role === "user" ? "bg-indigo-600 text-white" : "bg-neutral-100")
                }>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="text-left">
                <div className="inline-block px-3 py-2 rounded bg-neutral-100">
                  <Spinner />
                </div>
              </div>
            )}
          </div>

          {/* Composer */}
          <div className="absolute left-0 right-0 bottom-0 px-4 pb-4">
            <div className="max-w-3xl mx-auto">
              <div className="bg-white border rounded flex items-end gap-2 p-2">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Type your message..."
                  className="flex-1 resize-none outline-none p-2"
                  rows={1}
                />
                <button
                  onClick={send}
                  disabled={loading || !input.trim()}
                  className={
                    "w-10 h-10 rounded flex items-center justify-center " +
                    (loading || !input.trim()
                      ? "bg-neutral-200 cursor-not-allowed"
                      : "bg-indigo-600 hover:bg-indigo-700 text-white")
                  }
                  title="Send"
                >
                  {loading ? (
                    <Spinner />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="h-5 w-5">
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
