const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_TITLE = "New Chat";

const truncateTitle = (prompt = "") => {
  const trimmed = prompt.trim();
  if (!trimmed) {
    return DEFAULT_TITLE;
  }

  if (trimmed.length <= 60) {
    return trimmed;
  }

  return `${trimmed.slice(0, 57)}…`;
};

const createConversation = async (userId, title = DEFAULT_TITLE) => {
  try {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title.trim() || DEFAULT_TITLE,
      },
    });
    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

const listConversations = async (userId) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
    });

    return conversations.map((conversation) => ({
      id: conversation.id,
      title: conversation.title,
      updatedAt: conversation.updatedAt,
    }));
  } catch (error) {
    console.error("Error listing conversations:", error);
    throw error;
  }
};

const getChatHistory = async (conversationId, userId) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      const err = new Error("Conversation not found");
      err.status = 404;
      throw err;
    }

    return await prisma.chat.findMany({
      where: { conversationId, userId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

const saveChatMessage = async ({ conversationId, userId, prompt, response }) => {
  try {
    const result = await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        const err = new Error("Conversation not found");
        err.status = 404;
        throw err;
      }

      const chatMessage = await tx.chat.create({
        data: {
          conversationId,
          userId,
          prompt,
          response,
        },
      });

      const shouldUpdateTitle = !conversation.title || conversation.title === DEFAULT_TITLE;
      const title = shouldUpdateTitle
        ? truncateTitle(prompt)
        : conversation.title;

      await tx.conversation.update({
        where: { id: conversationId },
        data: {
          title,
        },
      });

      return chatMessage;
    });

    return result;
  } catch (error) {
    console.error("Error saving chat message:", error);
    throw error;
  }
};

const deleteConversation = async (conversationId, userId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const conversation = await tx.conversation.findFirst({
        where: { id: conversationId, userId },
      });

      if (!conversation) {
        return false;
      }

      await tx.chat.deleteMany({
        where: { conversationId, userId },
      });

      await tx.conversation.delete({
        where: { id: conversationId },
      });

      return true;
    });
  } catch (error) {
    console.error("Error deleting conversation:", error);
    throw error;
  }
};

module.exports = {
  createConversation,
  listConversations,
  getChatHistory,
  saveChatMessage,
  deleteConversation,
};
