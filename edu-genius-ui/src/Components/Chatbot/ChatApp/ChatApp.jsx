import React, { useEffect, useRef, useState } from "react";
import "./ChatApp.css";
import Sidebar from "../Sidebar/Sidebar.jsx";
import Spinner from "../Spinner/Spinner.jsx";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, "");

/* ───────────────── Chat API Client ───────────────── */
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
    if (!token) throw new Error("You must be logged in to chat.");

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
        if (text) message = text;
      }
      throw new Error(message);
    }

    if (res.status === 204) return null;
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

  // NEW: link/clear course on a conversation
  async updateConversationCourse(conversationId, { courseId, courseName }) {
    return this.request(`/chat/conversations/${conversationId}/course`, {
      method: "PATCH",
      body: { courseId, courseName },
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

const escapeHtml = (str = "") =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const formatMessageContent = (text = "") => {
  // Preserve existing inline/display math (e.g., $x^2$ or \(x^2\)) intact so MathJax can typeset it.
  const segments = text.split(/(\$[^$]+\$|\\\([^\\]+\\\)|\\\[[^\\]+\\\])/g);

  const html = segments
    .map((segment) => {
      const isMath =
        segment.startsWith("$") ||
        segment.startsWith("\\(") ||
        segment.startsWith("\\[");

      if (isMath) {
        // Escape only HTML-reserved characters so MathJax still sees the TeX content.
        return escapeHtml(segment);
      }

      const escaped = escapeHtml(segment);
      const withSuperscript = escaped.replace(
        /([A-Za-z0-9]+)\^(?:\{([^}]+)\}|([A-Za-z0-9+-]+))/g,
        (match, base, bracedExp, exp) => `${base}<sup>${bracedExp || exp}</sup>`
      );

      return withSuperscript.replace(/\n/g, "<br/>");
    })
    .join("");

  return html;
};

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
  const mathJaxReady = useRef(false);
  const [isMobile, setIsMobile] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // NEW: course banner state (reflects active conversation)
  const [selectedCourse, setSelectedCourse] = useState(null);

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

  /* ───────────────── Responsive helpers ───────────────── */
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)");
    const updateIsMobile = (e) => setIsMobile(e.matches);
    updateIsMobile(mq);
    mq.addEventListener("change", updateIsMobile);
    return () => mq.removeEventListener("change", updateIsMobile);
  }, []);

  useEffect(() => {
    if (!isMobile) {
      setSidebarOpen(false);
    }
  }, [isMobile]);

  /* ───────────────── Bootstrap ───────────────── */
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      if (!token) {
        setConversations([]);
        setMessages([]);
        setActiveId(null);
        setSelectedCourse(null);
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
          // reflect course for the initially active conversation
          const c0 = sorted[0];
          setSelectedCourse(
            c0?.courseName
              ? { _id: c0.courseId || null, name: c0.courseName }
              : null
          );
        } else {
          const conversation = await chatApi.createConversation("New Chat");
          if (cancelled) return;
          setConversations([conversation]);
          setActiveId(conversation.id);
          setSelectedCourse(null);
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
        if (!cancelled) setInitializing(false);
      }
    };

    bootstrap();
    return () => {
      cancelled = true;
    };
  }, [token]);

  /* ───────────────── Load messages on active change ───────────────── */
  useEffect(() => {
    if (!token || !activeId) {
      setHistoryLoading(false);
      return;
    }

    let cancelled = false;
    setHistoryLoading(true);
    setMessages([]);

    // reflect selected course for the active conversation (from list)
    const activeMeta = conversations.find((c) => c.id === activeId);
    setSelectedCourse(
      activeMeta?.courseName
        ? { _id: activeMeta.courseId || null, name: activeMeta.courseName }
        : null
    );

    (async () => {
      try {
        const msgs = await chatApi.getMessages(activeId);
        if (cancelled) return;
        setMessages(msgs);
        setTimeout(
          () =>
            listRef.current?.scrollTo({
              top: listRef.current.scrollHeight,
              behavior: "smooth",
            }),
          50
        );
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
        if (!cancelled) setHistoryLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, token]);

  /* ───────────────── Math rendering ───────────────── */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mathJax = window.MathJax;
    if (!mathJaxReady.current || !mathJax?.typesetPromise) return;

    mathJax
      .typesetPromise([listRef.current])
      .catch((err) => console.warn("MathJax rendering failed", err));
  }, [messages]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const script = document.getElementById("mathjax-script");

    const markReadyAndTypeset = () => {
      mathJaxReady.current = true;
      window.MathJax?.typesetPromise?.([listRef.current]).catch((err) =>
        console.warn("MathJax initial render failed", err)
      );
    };

    if (window.MathJax?.typesetPromise) {
      markReadyAndTypeset();
      return undefined;
    }

    if (!script) return undefined;
    script.addEventListener("load", markReadyAndTypeset);
    return () => script.removeEventListener("load", markReadyAndTypeset);
  }, []);

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
      setSelectedCourse(null);
      if (isMobile) {
        setSidebarOpen(false);
      }
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
          const c0 = sorted[0];
          setSelectedCourse(
            c0?.courseName
              ? { _id: c0.courseId || null, name: c0.courseName }
              : null
          );
        }
      } else {
        const conversation = await chatApi.createConversation("New Chat");
        setConversations([conversation]);
        setActiveId(conversation.id);
        setMessages([]);
        setSelectedCourse(null);
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
      setSelectedCourse(null);
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
    // sync banner immediately from known list metadata
    const meta = conversations.find((c) => c.id === id);
    setSelectedCourse(
      meta?.courseName
        ? { _id: meta.courseId || null, name: meta.courseName }
        : null
    );
    if (isMobile) {
      setSidebarOpen(false);
    }
  };

  /* ───────────────── Send message ───────────────── */
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
          const next =
            idx >= 0
              ? prev.map((c, index) => (index === idx ? { ...c, ...meta } : c))
              : [meta, ...prev];
          // keep banner in sync if this is the active convo
          if (meta.id === activeId) {
            setSelectedCourse(
              meta?.courseName
                ? { _id: meta.courseId || null, name: meta.courseName }
                : null
            );
          }
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

  /* ───────────────── Course Creation Dialog ───────────────── */
  const [newCourseDialog, setNewCourseDialog] = useState({
    open: false,
    conversationId: null,
    name: "",
    percent: "",
    error: null,
  });

  const validateCourse = (name, percent) => {
    if (!name?.trim()) return "Course name is required";
    if (!percent?.toString()?.trim())
      return "Completion percentage is required";
    const pct = Number(percent);
    if (Number.isNaN(pct) || pct < 0 || pct > 100)
      return "Percentage must be between 0 and 100";
    return null;
  };

  const handleCreateCourse = async () => {
    const error = validateCourse(newCourseDialog.name, newCourseDialog.percent);
    if (error) {
      setNewCourseDialog((prev) => ({ ...prev, error }));
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/courses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          name: newCourseDialog.name,
          percent: Number(newCourseDialog.percent),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to create course");
      }

      const { course } = await response.json();

      // Now link the chat to the new course
      await handleAddCourse(newCourseDialog.conversationId, course);

      setNewCourseDialog({
        open: false,
        conversationId: null,
        name: "",
        percent: "",
        error: null,
      });

      setToast({
        open: true,
        message: `Created and linked to course: ${course.name}`,
        actionText: "",
        onAction: null,
      });
    } catch (e) {
      console.error(e);
      setNewCourseDialog((prev) => ({
        ...prev,
        error: e.message || "Failed to create course",
      }));
    }
  };

  /* ───────────────── onAddCourse from Sidebar ───────────────── */
  const handleAddCourse = async (conversationId, course) => {
    // If isNew flag is set, open the create course dialog
    if (course?.isNew) {
      setNewCourseDialog({
        open: true,
        conversationId,
        name: "",
        percent: "",
        error: null,
      });
      return;
    }

    try {
      await chatApi.updateConversationCourse(conversationId, {
        courseId: course?._id ?? null,
        courseName: course?.name ?? null,
      });

      // update list metadata so sidebar shows the chip
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === conversationId);
        if (idx < 0) return prev;
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          courseId: course?._id ?? null,
          courseName: course?.name ?? null,
          updatedAt: new Date().toISOString(),
        };
        return sortByUpdatedAtDesc(next);
      });

      // if we just updated the active conversation, reflect banner
      if (conversationId === activeId) {
        setSelectedCourse(
          course?.name ? { _id: course?._id ?? null, name: course.name } : null
        );
      }

      setToast({
        open: true,
        message: course?.name
          ? `Linked to course: ${course.name}`
          : "Course cleared",
        actionText: "",
        onAction: null,
      });
    } catch (e) {
      console.error(e);
      setToast({
        open: true,
        message: e.message || "Unable to update conversation course.",
        actionText: "",
        onAction: null,
      });
    }
  };

  /* ───────────────── Render ───────────────── */
  if (!token) {
    return (
      <div className="fixed inset-x-0 bottom-0 top-[64px] flex items-center justify-center bg-white text-gray-500">
        Please log in to access the chat.
      </div>
    );
  }

  const sidebar = (
    <Sidebar
      conversations={conversations}
      activeId={activeId}
      onNewChat={startNewChat}
      onSelect={selectConversation}
      onDelete={onDelete}
      onRename={() => {}}
      onRegenerateTitle={() => {}}
      onAddCourse={handleAddCourse}
      isMobile={isMobile}
    />
  );

  return (
    <div className="fixed inset-x-0 bottom-0 top-[64px] bg-white">
      <div className="h-full flex bg-white text-gray-900 relative">
        {!isMobile && sidebar}
        {isMobile && (
          <>
            <div
              className={`chat-sidebar-drawer ${sidebarOpen ? "open" : ""}`}
              aria-hidden={!sidebarOpen}
            >
              <div className="chat-sidebar-inner">
                <button
                  className="chat-close-button"
                  onClick={() => setSidebarOpen(false)}
                  aria-label="Close conversation list"
                >
                  ×
                </button>
                {sidebar}
              </div>
            </div>
            {sidebarOpen && (
              <div
                className="chat-sidebar-backdrop"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </>
        )}

        {/* Main Chat */}
        <div className="flex-1 flex flex-col min-h-0">
          <header className="chat-topbar h-12 px-3 sm:px-4 flex items-center justify-between text-xs text-gray-500">
            {isMobile && (
              <button
                className="chat-menu-button"
                onClick={() => setSidebarOpen(true)}
                aria-label="Open conversation list"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  width="20"
                  height="20"
                  fill="currentColor"
                >
                  <path d="M3 6h18v2H3V6zm0 5h18v2H3v-2zm0 5h18v2H3v-2z" />
                </svg>
              </button>
            )}
            <div className="flex-1 flex justify-end">
              <div className="opacity-75">Role: {role}</div>
            </div>
          </header>

          {/* Course banner (centered) */}
          {selectedCourse && (
            <div className="flex justify-center px-4">
              <div className="my-3 inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-4 py-1.5 text-indigo-700">
                <span className="text-xs opacity-70">Course:</span>
                <span className="font-medium text-sm">
                  {selectedCourse.name}
                </span>
                <button
                  onClick={() => handleAddCourse(activeId, null)}
                  className="ml-1 text-xs text-indigo-500 hover:text-indigo-700"
                  title="Clear selected course"
                  aria-label="Clear selected course"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-auto">
              <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 py-4 space-y-3">
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
                        "max-w-[90%] sm:max-w-[80%] lg-max-w-[70%] px-4 py-2 rounded-2xl text-sm leading-6 message-content " +
                        (m.role === "user"
                          ? "bg-indigo-600 text-white"
                          : "bg-gray-100 text-gray-900")
                      }
                      dangerouslySetInnerHTML={{
                        __html: formatMessageContent(m.content),
                      }}
                    />
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
              className="sticky bottom-0 px-4 sm:px-6 md:px-10 lg:px-16 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-white via-white/80 to-transparent"
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
                      loading || historyLoading || initializing || !input.trim()
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

      {/* Create Course Dialog */}
      <ConfirmModal
        open={newCourseDialog.open}
        title="Create New Course"
        message={
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Course Name
              </label>
              <input
                type="text"
                value={newCourseDialog.name}
                onChange={(e) =>
                  setNewCourseDialog((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="e.g., Operating Systems"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Completion Percentage
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={newCourseDialog.percent}
                onChange={(e) =>
                  setNewCourseDialog((prev) => ({
                    ...prev,
                    percent: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 border rounded-md text-sm"
                placeholder="0-100"
              />
            </div>
            {newCourseDialog.error && (
              <div className="text-sm text-red-600">
                {newCourseDialog.error}
              </div>
            )}
          </div>
        }
        confirmText="Create"
        onConfirm={handleCreateCourse}
        onCancel={() =>
          setNewCourseDialog((prev) => ({ ...prev, open: false }))
        }
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
