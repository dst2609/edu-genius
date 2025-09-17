export default function ConversationItem({ convo, active, onClick, onDelete }) {
  return (
    <div
      className={
        "flex items-center justify-between px-3 py-2 rounded-md " +
        (active ? "bg-neutral-200" : "hover:bg-neutral-100")
      }
      title={convo.title || "New Chat"}
    >
      {/* Row click = select */}
      <button onClick={onClick} className="flex-1 text-left truncate">
        <div className="text-sm font-medium truncate">{convo.title || "New Chat"}</div>
        <div className="text-[11px] text-neutral-500">
          {new Date(convo.updatedAt || Date.now()).toLocaleString()}
        </div>
      </button>

      {/* ✕ click = delete (without selecting) */}
      <button
        onClick={(e) => {
          e.stopPropagation();      // 👈 critical!
          onDelete();               // id is bound in Sidebar
        }}
        className="ml-2 text-red-500 hover:text-red-700 text-xs"
        title="Delete conversation"
        aria-label={`Delete ${convo.title || "conversation"}`}
      >
        ✕
      </button>
    </div>
  );
}
