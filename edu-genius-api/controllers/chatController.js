const {
  createConversation,
  listConversations,
  getChatHistory,
  saveChatMessage,
  deleteConversation,
  updateConversationCourse,
} = require("../models/chatModel");

const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    let previousMessages = [];

    if (!activeConversationId) {
      const conversation = await createConversation(userId, title);
      activeConversationId = conversation.id;
    } else {
      previousMessages = await getChatHistory(activeConversationId, userId);
    }

    const messages = [
      { role: "system", content: "You are a helpful assistant." },
      ...previousMessages.flatMap((msg) => [
        { role: "user", content: msg.prompt },
        { role: "assistant", content: msg.response },
      ]),
      { role: "user", content: prompt },
    ];


    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    const chatResponse = completion.choices[0].message.content.trim();

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
