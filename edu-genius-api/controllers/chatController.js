const {
  createConversation,
  listConversations,
  getChatHistory,
  saveChatMessage,
  deleteConversation,
  updateConversationCourse,
} = require("../models/chatModel");

// Provider switch: 'ollama' (default) or 'openai (for online)'
const CHAT_PROVIDER = (process.env.CHAT_PROVIDER || 'ollama').toLowerCase();
// const CHAT_PROVIDER = (process.env.CHAT_PROVIDER || 'openai').toLowerCase();


// Ollama config
const OLLAMA_API_URL =
  process.env.OLLAMA_API_URL || "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3";

// OpenAI config
const OPENAI_API_URL = process.env.OPENAI_API_URL || "https://api.openai.com/v1/chat/completions";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-3.5-turbo";
const HISTORY_WINDOW = Number(process.env.CHAT_HISTORY_WINDOW || 8);
const MAX_PROMPT_CHARS = Number(process.env.MAX_PROMPT_CHARS || 12000);

const fetchFn = (...args) => {
  if (typeof fetch !== "function") {
    throw new Error("Fetch API is not available in this environment.");
  }

  return fetch(...args);
};

const readOllamaStream = async (response) => {
  const decoder = new TextDecoder();
  const reader = response.body.getReader();
  let accumulatedText = "";
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;

      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch (err) {
        console.error("Failed to parse Ollama stream chunk", err, line);
        continue;
      }

      if (parsed.error) {
        throw new Error(parsed.error);
      }

      if (parsed.response) {
        accumulatedText += parsed.response;
      }
    }
  }

  if (buffer.trim()) {
    try {
      const parsed = JSON.parse(buffer);
      if (parsed.error) {
        throw new Error(parsed.error);
      }
      if (parsed.response) {
        accumulatedText += parsed.response;
      }
    } catch (err) {
      console.error("Failed to parse trailing Ollama stream chunk", err, buffer);
    }
  }

  return accumulatedText.trim();
};

// Build OpenAI messages array from recent history + current prompt
const buildOpenAIMessages = (currentPrompt, history) => {
  const recent = Array.isArray(history) && history.length > 0
    ? history.slice(-HISTORY_WINDOW)
    : [];

  const messages = [];
  for (const msg of recent) {
    if (msg?.prompt) messages.push({ role: 'user', content: msg.prompt });
    if (msg?.response) messages.push({ role: 'assistant', content: msg.response });
  }
  messages.push({ role: 'user', content: currentPrompt });
  return messages;
};

// Build a single prompt string including recent conversation turns
const buildPromptWithHistory = (currentPrompt, history) => {
  // history is ascending by createdAt; take only the last N exchanges
  const recent = Array.isArray(history) && history.length > 0
    ? history.slice(-HISTORY_WINDOW)
    : [];

  const parts = [];
  for (const msg of recent) {
    if (msg?.prompt) parts.push(`User: ${msg.prompt}`);
    if (msg?.response) parts.push(`Assistant: ${msg.response}`);
  }
  // Append the current user prompt and leave Assistant cue
  parts.push(`User: ${currentPrompt}`);
  parts.push("Assistant:");

  // Join and enforce a max size cap to avoid overlong prompts
  let promptText = parts.join("\n\n");
  if (promptText.length > MAX_PROMPT_CHARS) {
    // Trim from the start, keep the tail which includes the latest context
    promptText = promptText.slice(promptText.length - MAX_PROMPT_CHARS);
  }

  return promptText;
};

const chatHandler = async (req, res) => {
  const userId = req.user;
  const { prompt, conversationId, title } = req.body;

  if (!prompt) {
    return res.status(400).send("Prompt is empty - it is required");
  }

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    let activeConversationId = conversationId;

    if (!activeConversationId) {
      const conversation = await createConversation(userId, title);
      activeConversationId = conversation.id;
    }

    // Load conversation history and build a context-aware prompt
    let history = [];
    try {
      history = await getChatHistory(activeConversationId, userId);
    } catch (e) {
      // If history can't be loaded, proceed without it
      console.warn("Unable to load chat history for context:", e?.message || e);
      history = [];
    }

    let chatResponse = "";
    if (CHAT_PROVIDER === 'openai') {
      const openaiKey = process.env.OPENAI_API_KEY;
      if (!openaiKey) {
        const err = new Error("OPENAI_API_KEY is required when CHAT_PROVIDER=openai");
        err.status = 400;
        throw err;
      }

      const messages = buildOpenAIMessages(prompt, history);
      const oaResp = await fetchFn(OPENAI_API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          messages,
          stream: false,
        }),
      });

      if (!oaResp.ok) {
        const text = await oaResp.text().catch(() => '');
        const message = `Failed to fetch response from OpenAI: ${oaResp.status} ${oaResp.statusText} ${text}`;
        throw new Error(message.trim());
      }

      const data = await oaResp.json();
      chatResponse = (data?.choices?.[0]?.message?.content || '').trim();
    } else {
      const finalPrompt = buildPromptWithHistory(prompt, history);

      const response = await fetchFn(OLLAMA_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          prompt: finalPrompt,
          stream: true,
        }),
      });

      if (!response.ok || !response.body) {
        const message = `Failed to fetch response from Ollama: ${response.status} ${response.statusText}`;
        throw new Error(message.trim());
      }

      chatResponse = await readOllamaStream(response);
    }

    const { chatMessage, conversation } = await saveChatMessage({
      conversationId: activeConversationId,
      userId,
      prompt,
      response: chatResponse,
    });

    const messagePayload = {
      role: "assistant",
      content: chatResponse,
      createdAt: chatMessage?.createdAt,
    };

    res.json({
      prompt: prompt,
      response: chatResponse,
      conversationId: activeConversationId,
      message: messagePayload,
      conversation: conversation
        ? {
            id: conversation.id,
            title: conversation.title,
            updatedAt: conversation.updatedAt,
          }
        : undefined,
    });
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    res.status(status).send(error.message || "Something went wrong");
  }
};

const createConversationHandler = async (req, res) => {
  const userId = req.user;
  const { title, courseId, courseName } = req.body;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    console.log('Creating conversation with:', { title, courseId, courseName });
    const conversation = await createConversation(userId, title, { courseId, courseName });
    console.log('Created conversation:', conversation);
    
    res.status(201).json({
      id: conversation.id,
      title: conversation.title,
      courseId: conversation.courseId,
      courseName: conversation.courseName,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).send("Unable to create conversation");
  }
};

const listConversationsHandler = async (req, res) => {
  const userId = req.user;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const conversations = await listConversations(userId);
    res.json({ conversations });
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to load conversations");
  }
};

const getChatHistoryHandler = async (req, res) => {
  const userId = req.user;
  const { conversationId } = req.params;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const history = await getChatHistory(conversationId, userId);
    const messages = history.flatMap((msg) => [
      {
        role: "user",
        content: msg.prompt,
        createdAt: msg.createdAt,
      },
      {
        role: "assistant",
        content: msg.response,
        createdAt: msg.createdAt,
      },
    ]);

    res.json({
      conversationId,
      messages,
    });
  } catch (error) {
    console.error(error);
    const status = error.status || 500;
    res.status(status).send(error.message || "Unable to load chat history");
  }
};

const deleteConversationHandler = async (req, res) => {
  const userId = req.user;
  const { conversationId } = req.params;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const deleted = await deleteConversation(conversationId, userId);
    if (!deleted) {
      return res.status(404).send("Conversation not found");
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).send("Unable to delete conversation");
  }
};

const updateConversationCourseHandler = async (req, res) => {
  try {
    const userId = req.user; // from auth middleware
    const { id } = req.params;
    const { courseId, courseName } = req.body || {};

    if (!id) return res.status(400).json({ message: "conversation id is required" });

    const updated = await updateConversationCourse(id, userId, { courseId, courseName });
    return res.status(200).json({ conversation: updated });
  } catch (error) {
    console.error(error);
    const status = error?.status || 500;
    return res.status(status).json({ message: error?.message || "Unable to update conversation" });
  }
};

module.exports = {
  chatHandler,
  createConversationHandler,
  listConversationsHandler,
  getChatHistoryHandler,
  deleteConversationHandler,
  updateConversationCourseHandler, 
};
