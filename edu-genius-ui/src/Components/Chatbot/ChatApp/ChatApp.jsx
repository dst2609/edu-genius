import React, { useEffect, useRef, useState } from "react";
import "./ChatApp.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Spinner from "../Spinner/Spinner.jsx";

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"
).replace(/\/+$/, "");

class ChatApiClient {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  buildUrl(path) {
    const normalizedBase = this.baseUrl.replace(/\/+$/, "");
    return path.startsWith("/")
      ? `${normalizedBase}${path}`
      : `${normalizedBase}/${path}`;
  }

  async request(path, { method = "GET", body } = {}) {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("You must be logged in to chat.");
    }

    const res = await fetch(this.buildUrl(path), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!res.ok) {
      let message = `Request failed with status ${res.status}`;
      try {
        const errorData = await res.json();
        if (typeof errorData === "string" && errorData.trim()) {
          message = errorData;
        } else if (errorData?.message) {
          message = errorData.message;
        } else if (errorData?.error) {
          message = errorData.error;
        }
      } catch {
        const text = await res.text();
        if (text) {
          message = text;
        }
      }
      throw new Error(message);
    }

    if (res.status === 204) {
      return null;
    }

    return res.json();
  }

  async listConversations() {
    const data = await this.request("/chat/conversations");
    return data?.conversations ?? [];
  }

  async createConversation(title) {
    return this.request("/chat/conversations", {
      method: "POST",
      body: { title },
    });
  }

  async getMessages(conversationId) {
    const data = await this.request(`/chat/conversations/${conversationId}`);
    return data?.messages ?? [];
  }

  async chat({ threadId, message, title }) {
    return this.request("/chat", {
      method: "POST",
      body: {
        conversationId: threadId,
        prompt: message,
        title,
      },
    });
  }

  async deleteConversation(conversationId) {
    await this.request(`/chat/conversations/${conversationId}`, {
      method: "DELETE",
    });
  }
}

const chatApi = new ChatApiClient(API_BASE_URL);

/* ─────────────── App Name from .env ─────────────── */
const APP_NAME = import.meta.env.VITE_APP_NAME || "Chatbot";

const sortByUpdatedAtDesc = (arr) =>
  [...arr].sort(
    (a, b) => new Date(b?.updatedAt || 0) - new Date(a?.updatedAt || 0)
  );

export default function App() {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role") || "student";

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);

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

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!token) {
        setConversations([]);
        setMessages([]);
        setActiveId(null);
        setInitializing(false);
        return;
      }

      setInitializing(true);

      try {
        const list = await chatApi.listConversations();
        if (cancelled) return;

        if (list.length > 0) {
          const sorted = sortByUpdatedAtDesc(list);
          setConversations(sorted);
          setActiveId(sorted[0].id);
        } else {
          const conversation = await chatApi.createConversation("New Chat");
          if (cancelled) return;
          setConversations([conversation]);
          setActiveId(conversation.id);
        }
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setToast({
          open: true,
          message: e.message || "Unable to load conversations.",
          actionText: "",
          onAction: null,
        });
      } finally {
        if (!cancelled) {
          setInitializing(false);
        }
      }
    };

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!token || !activeId) {
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setMessages([]);

    (async () => {
      try {
        const msgs = await chatApi.getMessages(activeId);
        if (cancelled) return;
        setMessages(msgs);
        setTimeout(() =>
          listRef.current?.scrollTo({
            top: listRef.current.scrollHeight,
            behavior: "smooth",
          }), 50);
      } catch (e) {
        if (cancelled) return;
        console.error(e);
        setToast({
          open: true,
          message: e.message || "Unable to load chat history.",
          actionText: "",
          onAction: null,
        });
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeId, token]);

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
    try {
      const conversation = await chatApi.createConversation("New Chat");
      setConversations((prev) =>
        sortByUpdatedAtDesc([
          conversation,
          ...prev.filter((c) => c.id !== conversation.id),
        ])
      );
      setActiveId(conversation.id);
      setMessages([]);
      setInput("");
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        message: e.message || "Unable to create a new chat.",
        actionText: "",
        onAction: null,
      });
    }
  };

  const onDelete = (id) => setConfirmDelete({ open: true, id });

  const handleConfirmDelete = async () => {
    const id = confirmDelete.id;
    if (!id) return;

    const removed = conversations.find((c) => c.id === id) || null;
    lastDeletedRef.current = null;
    setConfirmDelete({ open: false, id: null });

    try {
      await chatApi.deleteConversation(id);
      const remaining = conversations.filter((c) => c.id !== id);

      if (remaining.length > 0) {
        const sorted = sortByUpdatedAtDesc(remaining);
        setConversations(sorted);
        if (id === activeId) {
          setActiveId(sorted[0].id);
          setMessages([]);
        }
      } else {
        const conversation = await chatApi.createConversation("New Chat");
        setConversations([conversation]);
        setActiveId(conversation.id);
        setMessages([]);
      }

      lastDeletedRef.current = removed ? { convo: removed } : null;
      setToast({
        open: true,
        message: "Conversation deleted.",
        actionText: "Undo",
        onAction: handleUndoDelete,
      });
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        message: e.message || "Unable to delete conversation.",
        actionText: "",
        onAction: null,
      });
    }
  };

  const handleUndoDelete = async () => {
    const deleted = lastDeletedRef.current?.convo;
    if (!deleted) return;

    try {
      const recreated = await chatApi.createConversation(
        deleted.title || "New Chat"
      );
      setConversations((prev) =>
        sortByUpdatedAtDesc([
          recreated,
          ...prev.filter((c) => c.id !== recreated.id),
        ])
      );
      setActiveId(recreated.id);
      lastDeletedRef.current = null;
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        message: e.message || "Unable to restore conversation.",
        actionText: "",
        onAction: null,
      });
    }
  };

  const selectConversation = (id) => {
    if (id === activeId) return;
    setActiveId(id);
    setInput("");
  };

  const send = async () => {
    const text = input.trim();
    if (!text || !activeId || loading || historyLoading || initializing) return;

    const optimistic = {
      role: "user",
      content: text,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, optimistic]);
    setInput("");
    setLoading(true);
    setTimeout(ensureComposerVisible, 0);

    try {
      const activeConversation = conversations.find((c) => c.id === activeId);
      const resp = await chatApi.chat({
        threadId: activeId,
        message: text,
        title: activeConversation?.title,
      });

      const assistantMessage = resp?.message
        ? {
            role: resp.message.role || "assistant",
            content: resp.message.content,
            createdAt: resp.message.createdAt,
          }
        : {
            role: "assistant",
            content: resp?.response || "(no reply)",
            createdAt: new Date().toISOString(),
          };

      setMessages((m) => [...m, assistantMessage]);

      const meta = resp?.conversation;
      if (meta) {
        setConversations((prev) => {
          const idx = prev.findIndex((c) => c.id === meta.id);
          const next = idx >= 0
            ? prev.map((c, index) => (index === idx ? { ...c, ...meta } : c))
            : [meta, ...prev];
          return sortByUpdatedAtDesc(next);
        });
      } else {
        setConversations((prev) => {
          const copy = [...prev];
          const idx = copy.findIndex(
            (c) => c.id === (resp?.conversationId || activeId)
          );
          if (idx >= 0) {
            copy[idx] = {
              ...copy[idx],
              updatedAt: new Date().toISOString(),
            };
          }
          return sortByUpdatedAtDesc(copy);
        });
      }

      if (resp?.conversationId && resp.conversationId !== activeId) {
        setActiveId(resp.conversationId);
      }
    } catch (e) {
      console.error(e);
      setMessages((m) => [
        ...m,
        {
          role: "assistant",
          content: `⚠️ ${e.message}`,
          createdAt: new Date().toISOString(),
        },
      ]);
      setToast({
        open: true,
        message: e.message || "Unable to send message.",
        actionText: "",
        onAction: null,
      });
    } finally {
      setLoading(false);
      setTimeout(() =>
        listRef.current?.scrollTo({
          top: listRef.current.scrollHeight,
          behavior: "smooth",
        }), 50);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  if (!token) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-[64px] flex items-center justify-center bg-white text-gray-500">
        Please log in to access the chat.
      </div>
    );
  }

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
                {initializing && (
                  <div className="flex justify-start text-gray-500 text-sm pt-10">
                    <Spinner />
                  </div>
                )}

                {messages.length === 0 &&
                  !loading &&
                  !historyLoading &&
                  !initializing && (
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

                {(loading || historyLoading) && (
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
                    disabled={loading || historyLoading || initializing}
                  />
                  <button
                    onClick={send}
                    disabled={
                      loading ||
                      historyLoading ||
                      initializing ||
                      !input.trim()
                    }
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
