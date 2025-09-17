import ConversationItem from "./ConversationItem";

export default function Sidebar({ conversations, activeId, onNewChat, onSelect, onDelete }) {
  return (
    <aside className="w-64 border-r bg-white flex flex-col">
      <div className="p-3 border-b flex items-center justify-between">
        <div className="text-sm font-semibold">Conversations</div>
        <button
          onClick={onNewChat}
          className="rounded-full w-8 h-8 flex items-center justify-center bg-indigo-600 text-white hover:bg-indigo-700"
          title="New chat"
        >
          +
        </button>
      </div>

      <div className="flex-1 overflow-auto p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-xs text-neutral-500 p-2">
            No conversations yet.
            <br />Click <strong>+</strong> to start.
          </div>
        ) : (
          conversations.map((c) => (
            <ConversationItem
              key={c.id}                     // 👈 stable key by id
              convo={c}
              active={c.id === activeId}
              onClick={() => onSelect(c.id)}
              onDelete={() => onDelete(c.id)}  // 👈 bind THIS row’s id
            />
          ))
        )}
      </div>
    </aside>
  );
}
