const express = require("express");
const router = express.Router();
//import controller
const {
  chatHandler,
  createConversationHandler,
  listConversationsHandler,
  getChatHistoryHandler,
  deleteConversationHandler,
} = require("../controllers/chatController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/conversations", listConversationsHandler);
router.post("/conversations", createConversationHandler);
router.get("/conversations/:conversationId", getChatHistoryHandler);
router.delete("/conversations/:conversationId", deleteConversationHandler);
router.post("/", chatHandler);

module.exports = router;
