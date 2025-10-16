const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const DEFAULT_TITLE = "New Chat";

const truncateTitle = (prompt = "") => {
  const trimmed = prompt.trim();
  if (!trimmed) return DEFAULT_TITLE;
  if (trimmed.length <= 60) return trimmed;
  return `${trimmed.slice(0, 57)}…`;
};

/**
 * Create a conversation.
 * Optionally pass { courseId, courseName } if you want to create it already linked to a course.
 */
const createConversation = async (userId, title = DEFAULT_TITLE, opts = {}) => {
  try {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: (title || "").trim() || DEFAULT_TITLE,
        // NEW (optional on create)
        courseId: opts.courseId || null,
        courseName: opts.courseName || null,
      },
    });
    return conversation;
  } catch (error) {
    console.error("Error creating conversation:", error);
    throw error;
  }
};

/**
 * List conversations for a user.
 * Now returns courseId / courseName as well.
 */
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
      // NEW
      courseId: conversation.courseId || null,
      courseName: conversation.courseName || null,
    }));
  } catch (error) {
    console.error("Error listing conversations:", error);
    throw error;
  }
};

/**
 * Fetch chat history for a conversation, verifying ownership.
 */
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

/**
 * Save a chat message and (optionally) update the conversation title on first message.
 */
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

      const shouldUpdateTitle =
        !conversation.title || conversation.title === DEFAULT_TITLE;
      const title = shouldUpdateTitle ? truncateTitle(prompt) : conversation.title;

      const updatedConversation = await tx.conversation.update({
        where: { id: conversationId },
        data: { title },
      });

      return { chatMessage, conversation: updatedConversation };
    });

    return result;
  } catch (error) {
    console.error("Error saving chat message:", error);
    throw error;
  }
};

/**
 * Delete a conversation and its messages.
 */
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

/**
 * NEW: Set or clear a course on a conversation.
 * Pass { courseId, courseName } to set; pass { courseId: null, courseName: null } to clear.
 */
const updateConversationCourse = async (conversationId, userId, { courseId, courseName }) => {
  try {
    const conversation = await prisma.conversation.findFirst({
      where: { id: conversationId, userId },
    });

    if (!conversation) {
      const err = new Error("Conversation not found");
      err.status = 404;
      throw err;
    }

    const updated = await prisma.conversation.update({
      where: { id: conversationId },
      data: {
        courseId: courseId || null,
        courseName: courseName || null,
      },
    });

    return {
      id: updated.id,
      userId: updated.userId,
      title: updated.title,
      courseId: updated.courseId || null,
      courseName: updated.courseName || null,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  } catch (error) {
    console.error("Error updating conversation course:", error);
    throw error;
  }
};

module.exports = {
  createConversation,
  listConversations,
  getChatHistory,
  saveChatMessage,
  deleteConversation,
  // NEW
  updateConversationCourse,
};
