import React, { useEffect, useRef, useState } from "react";

export default function ConversationItem({
  convo,
  active,
  onClick,
  onDelete,
  onRename,           // (title) => void
  onRegenerateTitle,  // () => void
  onAddCourse,        
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(convo.title || "New Chat");
  const [menuOpen, setMenuOpen] = useState(false);

  const containerRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (isEditing) {
      setDraft(convo.title || "New Chat");
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing, convo.title]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const commit = () => {
    const name = draft.trim() || "New Chat";
    setIsEditing(false);
    if (name !== (convo.title || "New Chat")) onRename && onRename(name);
  };
  const cancel = () => {
    setIsEditing(false);
    setDraft(convo.title || "New Chat");
  };

  return (
    <div
      ref={containerRef}
      className={
        "group relative flex items-center justify-between px-3 py-2 rounded-md " +
        (active ? "bg-neutral-200" : "hover:bg-neutral-100")
      }
      title={convo.title || "New Chat"}
      onContextMenu={(e) => {
        e.preventDefault();
        setMenuOpen(true);
      }}
    >
      {/* Title area */}
      <button onClick={onClick} className="flex-1 text-left truncate">
        {isEditing ? (
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commit();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  cancel();
                }
              }}
              className="w-full px-2 py-1 text-sm border rounded outline-none"
            />
            <button
              className="text-xs px-2 py-1 rounded bg-indigo-600 text-white"
              onClick={(e) => {
                e.stopPropagation();
                commit();
              }}
            >
              Save
            </button>
            <button
              className="text-xs px-2 py-1 rounded bg-neutral-200"
              onClick={(e) => {
                e.stopPropagation();
                cancel();
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            <div className="text-sm font-medium truncate">{convo.title || "New Chat"}</div>
            <div className="text-[11px] text-neutral-500">
              {new Date(convo.updatedAt || Date.now()).toLocaleString()}
            </div>
          </>
        )}
      </button>

      {!isEditing && (
        <div className="flex items-center gap-2 ml-2">
          {/* Add Course icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddCourse && onAddCourse(convo);  // ✅ trigger parent callback
            }}
            className="text-blue-500 hover:text-blue-700 text-xs rounded-full border border-blue-400 h-5 w-5 flex items-center justify-center"
            title="Add Course"
            aria-label="Add Course"
          >
            +
          </button>

          {/* Rename icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsEditing(true);
            }}
            className="text-neutral-500 hover:text-neutral-700 text-xs"
            title="Rename"
            aria-label="Rename"
          >
            ✎
          </button>

          {/* Delete icon */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete && onDelete();
            }}
            className="text-red-500 hover:text-red-700 text-xs"
            title="Delete"
            aria-label="Delete"
          >
            ✕
          </button>
        </div>
      )}

      {/* Context menu */}
      {menuOpen && !isEditing && (
        <div className="absolute right-2 top-8 z-10 w-44 rounded-md border bg-white shadow-lg">
          <button
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              setIsEditing(true);
            }}
          >
            Rename
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onRegenerateTitle && onRegenerateTitle();
            }}
          >
            Regenerate title
          </button>
          <div className="h-px bg-neutral-200" />
          <button
            className="w-full text-left px-3 py-2 hover:bg-neutral-100 text-sm text-red-600"
            onClick={(e) => {
              e.stopPropagation();
              setMenuOpen(false);
              onDelete && onDelete();
            }}
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
