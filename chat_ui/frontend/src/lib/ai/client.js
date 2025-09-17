import {
  USE_API_SERVER,
  API_SERVER_BASE,
  API_SERVER_CHAT_PATH,
  OPENAI_BASE_URL,
  OPENAI_MODEL,
  OPENAI_API_KEY
} from "../config";

// --- Simple local store for dev (OpenAI direct) ---
const localStore = {
  conversations: [], // {id,title,updatedAt}
  messages: {},      // id -> [{role, content, createdAt}]
};

function makeId() { return crypto.randomUUID?.() || String(Date.now() + Math.random()); }
function titleFrom(text) {
  const t = (text || "").replace(/\s+/g, " ").trim();
  return t.length > 40 ? t.slice(0, 40) + "…" : t || "New Chat";
}

export class AIClient {
  // --- Conversation APIs ---
  async listConversations() {
    if (USE_API_SERVER) {
      const res = await fetch(API_SERVER_BASE.replace(/\/$/, "") + "/conversations");
      if (!res.ok) throw new Error(`API server error ${res.status}`);
      return res.json();
    }
    return localStore.conversations;
  }

  async createConversation(initialTitle = "New Chat") {
    if (USE_API_SERVER) {
      const res = await fetch(API_SERVER_BASE.replace(/\/$/, "") + "/conversations", {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ title: initialTitle })
      });
      if (!res.ok) throw new Error(`API server error ${res.status}`);
      return res.json();
    }
    const id = makeId();
    const now = new Date().toISOString();
    const convo = { id, title: initialTitle, updatedAt: now };
    localStore.conversations.unshift(convo);
    localStore.messages[id] = [];
    return convo;
  }

  async getMessages(threadId) {
    if (USE_API_SERVER) {
      const res = await fetch(API_SERVER_BASE.replace(/\/$/, "") + `/conversations/${threadId}/messages`);
      if (!res.ok) throw new Error(`API server error ${res.status}`);
      return res.json();
    }
    return localStore.messages[threadId] || [];
  }

  async renameConversation(threadId, title) {
    if (USE_API_SERVER) {
      await fetch(API_SERVER_BASE.replace(/\/$/, "") + `/conversations/${threadId}`, {
        method: "PATCH",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({ title })
      });
      return;
    }
    const c = localStore.conversations.find(x => x.id === threadId);
    if (c) c.title = title;
  }

  // --- Chat ---
  async chat({ threadId, message }) {
    if (!threadId) throw new Error("Missing threadId");

    if (USE_API_SERVER) {
      const res = await fetch(API_SERVER_BASE.replace(/\/$/, "") + API_SERVER_CHAT_PATH, {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({ threadId, message })
      });
      if (!res.ok) throw new Error(`API server error ${res.status}`);
      return res.json();
    }

    // Direct OpenAI (DEV ONLY)
    const key = (OPENAI_API_KEY || "").trim();
    if (!key) throw new Error("OPENAI_API_KEY missing. Set VITE_OPENAI_API_KEY or use API server.");

    const history = (localStore.messages[threadId] || []).map(m => ({ role: m.role, content: m.content }));

    const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type":"application/json",
        "Authorization":`Bearer ${key}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: "system", content: "You are EduGenius, an AI learning assistant. Be clear and concise." },
          ...history,
          { role: "user", content: message }
        ],
        temperature: 0.2
      })
    });

    if (!res.ok) {
      const text = await res.text().catch(()=>"");
      throw new Error(`OpenAI error ${res.status}: ${text}`);
    }
    const data = await res.json();
    const assistantText = data?.choices?.[0]?.message?.content ?? "";

    // Update local store
    const now = new Date().toISOString();
    localStore.messages[threadId] = [
      ...(localStore.messages[threadId] || []),
      { role: "user", content: message, createdAt: now },
      { role: "assistant", content: assistantText, createdAt: new Date().toISOString() }
    ];
    const convo = localStore.conversations.find(c => c.id === threadId);
    if (convo) {
      convo.updatedAt = new Date().toISOString();
      if (!convo._titled && message) {
        convo.title = titleFrom(message);
        convo._titled = true;
      }
    }

    return {
      id: makeId(),
      role: "assistant",
      content: assistantText,
      createdAt: new Date().toISOString(),
      usage: data.usage || null
    };
  }
}
