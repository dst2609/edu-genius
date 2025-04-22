const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const getChatHistory = async (conversationId) => {
  try {
    return await prisma.chat.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    throw error;
  }
};

const saveChatMessage = async (conversationId, prompt, response) => {
  try {
    const newMessage = await prisma.chat.create({
      data: {
        conversationId,
        prompt,
        response,
      },
    });
    return newMessage; // Optionally return the newly created message
  } catch (error) {
    console.error("Error saving chat message:", error);
    throw error;
  }
};

module.exports = {
  getChatHistory,
  saveChatMessage,
};
