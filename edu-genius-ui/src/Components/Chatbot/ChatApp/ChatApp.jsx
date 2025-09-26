// ChatApp.jsx
import React, { useEffect, useRef, useState } from "react";
import "./ChatApp.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Spinner from "../Spinner/Spinner.jsx";

/* ─────────────── Inline Mock AIClient ─────────────── */
class AIClient {
  async listConversations() {
    return [];
  }

  async createConversation(title) {
    return {
      id: Date.now().toString(),
      title,
      updatedAt: new Date().toISOString(),
    };
  }

  async getMessages() {
    return [];
  }

  async chat({ threadId, message }) {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`, // ⚠️ exposed
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: message },
        ],
      }),
    });

    if (!res.ok) throw new Error(`API error ${res.status}`);
    const data = await res.json();

    return {
      role: "assistant",
      content: data.choices?.[0]?.message?.content || "(no reply)",
      createdAt: new Date().toISOString(),
    };
  }

  async deleteConversation() {}
  async restoreConversation() {}
}

const ai = new AIClient();

/* ─────────────── App Name from .env ─────────────── */
const APP_NAME = import.meta.env.VITE_APP_NAME || "Chatbot";

const sortByUpdatedAtDesc = (arr) =>
  [...arr].sort(
    (a, b) => new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0)
  );

export default function App() {
  const role = localStorage.getItem("role") || "student";

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const listRef = useRef(null);
  const composerRef = useRef(null);

  const [confirmDelete, setConfirmDelete] = useState({ open: false, id: null });
  const [toast, setToast] = useState({
    open: false,
    message: "",
    actionText: "",
    onAction: null,
  });
  const lastDeletedRef = useRef(null);

  /* ─────────────── Load conversations ─────────────── */
  useEffect(() => {
    (async () => {
      const list = await ai.listConversations();
      const sorted = sortByUpdatedAtDesc(list);
      setConversations(sorted);
      if (sorted.length > 0) setActiveId(sorted[0].id);
      else {
        const c = await ai.createConversation("New Chat");
        setConversations([c]);
        setActiveId(c.id);
      }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!activeId) return;
      const msgs = await ai.getMessages(activeId);
      setMessages(msgs);
      setTimeout(
        () =>
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          }),
        50
      );
    })();
  }, [activeId]);

  const ensureComposerVisible = () => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
    composerRef.current?.scrollIntoView({
      block: "nearest",
      behavior: "smooth",
    });
  };

  const startNewChat = async () => {
    const c = await ai.createConversation("New Chat");
    setConversations((prev) => [c, ...prev]);
    setActiveId(c.id);
    setMessages([]);
    setInput("");
  };

  const onDelete = (id) => setConfirmDelete({ open: true, id });

  const trulyDeleteConversation = async (id) => {
    if (ai.deleteConversation) {
      try {
        await ai.deleteConversation(id);
      } catch {}
    }
    const nextList = conversations.filter((c) => c.id !== id);
    setConversations(sortByUpdatedAtDesc(nextList));

    if (id === activeId) {
      if (nextList.length > 0) setActiveId(nextList[0].id);
      else {
        const c = await ai.createConversation("New Chat");
        setConversations([c]);
        setActiveId(c.id);
      }
      setMessages([]);
    }
  };

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    const removed = conversations.find((c) => c.id === id) || null;
    lastDeletedRef.current = removed ? { convo: removed } : null;

    setConfirmDelete({ open: false, id: null });
    await trulyDeleteConversation(id);

    setToast({
      open: true,
      message: "Conversation deleted.",
      actionText: "Undo",
      onAction: handleUndoDelete,
    });
  };

  const handleUndoDelete = async () => {
    const deleted = lastDeletedRef.current?.convo;
    if (!deleted) return;

    try {
      const recreated = await ai.createConversation(
        deleted.title || "New Chat"
      );
      setConversations((prev) => sortByUpdatedAtDesc([recreated, ...prev]));
      setActiveId(recreated.id);
    } catch (e) {
      console.error("Undo failed:", e);
    }
  };

  const selectConversation = (id) => {
    if (id === activeId) return;
    setActiveId(id);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !activeId) return;

    setInput("");
    const optimistic = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setLoading(true);

    try {
      const resp = await ai.chat({ threadId: activeId, message: text });
      setMessages((m) => [
        ...m,
        { role: "assistant", content: resp.content, createdAt: resp.createdAt },
      ]);

      setConversations((prev) => {
        const copy = [...prev];
        const idx = copy.findIndex((c) => c.id === activeId);
        if (idx >= 0)
          copy[idx] = { ...copy[idx], updatedAt: new Date().toISOString() };
        return sortByUpdatedAtDesc(copy);
      });
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠️ ${e.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      setTimeout(
        () =>
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          }),
        50
      );
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 top-[64px] bg-white">
      <div className="h-full flex bg-white text-gray-900">
        {/* Sidebar */}
        <Sidebar
          conversations={conversations}
          activeId={activeId}
          onNewChat={startNewChat}
          onSelect={selectConversation}
          onDelete={onDelete}
          onRename={() => {}}
          onRegenerateTitle={() => {}}
        />

        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <header className="h-12 px-4 flex items-center justify-end text-xs text-gray-500">
            <div className="opacity-75">Role: {role}</div>
          </header>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-auto">
              <div className="w-full px-6 md:px-10 lg:px-16 py-4 space-y-3">
                {messages.length === 0 && !loading && (
                  <div className="text-gray-500 text-sm pt-10">
                    Start a conversation. Example:{" "}
                    <em>“Explain the Pythagorean theorem.”</em>
                  </div>
                )}

                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={
                      "flex " +
                      (m.role === "user" ? "justify-end" : "justify-start")
                    }
                  >
                    <div
                      className={
                        "max-w-[90%] sm:max-w-[80%] lg:max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-6 " +
                        (m.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-900")
                      }
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex justify-start">
                    <div className="px-3 py-2 rounded-2xl bg-gray-100 text-gray-900">
                      <Spinner />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Composer */}
            <div
              ref={composerRef}
              className="sticky bottom-0 px-6 md:px-10 lg:px-16 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/80 to-transparent"
            >
              <div className="w-full">
                <div className="flex items-end gap-2 rounded-full ring-1 ring-gray-300 bg-white shadow-sm focus-within:ring-2 focus-within:ring-indigo-500">
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={onKeyDown}
                    onFocus={ensureComposerVisible}
                    placeholder="Ask anything"
                    className="flex-1 resize-none outline-none bg-transparent border-0 px-4 py-3 min-h-[44px] max-h-40 text-gray-900 placeholder:text-gray-400"
                    rows={1}
                  />
                  <button
                    onClick={send}
                    disabled={loading || !input.trim()}
                    className="m-1 mr-2 h-10 w-10 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Send"
                  >
                    {loading ? (
                      <Spinner />
                    ) : (
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        className="h-5 w-5"
                      >
                        <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-2 text-[11px] text-gray-400 text-center">
                  {APP_NAME} can make mistakes — verify important info.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirm Delete Modal */}
      <ConfirmModal
        open={confirmDelete.open}
        title="Delete conversation?"
        message="This will remove the conversation. You can undo right after."
        confirmText="Delete"
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete({ open: false, id: null })}
      />

      {/* Toast */}
      <Toast
        open={toast.open}
        message={toast.message}
        actionText={toast.actionText}
        onAction={toast.onAction}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
      />
    </div>
  );
}

/* ─────────────── UI Helpers ─────────────── */
function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-xl p-4 w-80 shadow-lg">
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-sm text-neutral-600 mb-4">{message}</div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-3 py-1.5 rounded bg-neutral-200"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-3 py-1.5 rounded bg-red-600 text-white"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({
  open,
  message,
  actionText,
  onAction,
  onClose,
  duration = 4500,
}) {
  const timerRef = useRef();
  useEffect(() => {
    if (!open) return;
    timerRef.current = setTimeout(() => onClose?.(), duration);
    return () => clearTimeout(timerRef.current);
  }, [open, duration, onClose]);

  if (!open) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-neutral-900 text-white rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
        <span className="text-sm">{message}</span>
        {actionText && (
          <button
            className="text-sm underline"
            onClick={() => {
              clearTimeout(timerRef.current);
              onAction?.();
              onClose?.();
            }}
          >
            {actionText}
          </button>
        )}
      </div>
    </div>
  );
}
