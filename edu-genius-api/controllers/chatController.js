//import model
const {
  createConversation,
  listConversations,
  getChatHistory,
  saveChatMessage,
  deleteConversation,
} = require("../models/chatModel");

const OpenAI = require("openai");

// get the OpenAI api key from env file
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// chat handler function to handle chat prompts and response
const chatHandler = async (req, res) => {
  const userId = req.user;
  const { prompt, conversationId, title } = req.body;

  //check if prompt is  empty?
  if (!prompt) {
    return res.status(400).send("Prompt is empty - it is required");
  }

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  // try to conenct to openAI API
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

    // interact with OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
    });

    // process the response - specific to OpenAI Api resoponse
    const chatResponse = completion.choices[0].message.content.trim();

    //new conversation id and save the chat message to DB
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
  const { title } = req.body;

  if (!userId) {
    return res.status(401).send("Unauthorized");
  }

  try {
    const conversation = await createConversation(userId, title);
    res.status(201).json({
      id: conversation.id,
      title: conversation.title,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
    });
  } catch (error) {
    console.error(error);
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

module.exports = {
  chatHandler,
  createConversationHandler,
  listConversationsHandler,
  getChatHistoryHandler,
  deleteConversationHandler,
};
