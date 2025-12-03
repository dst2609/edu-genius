const express = require("express");
const router = express.Router();
//import controller
const {
  chatHandler,
  createConversationHandler,
  listConversationsHandler,
  getChatHistoryHandler,
  deleteConversationHandler,
  updateConversationTitleHandler,
  updateConversationCourseHandler,
  conversationAnalyticsHandler,
} = require("../controllers/chatController");
const authMiddleware = require("../middleware/auth");

router.use(authMiddleware);

router.get("/conversations", listConversationsHandler);
router.post("/conversations", createConversationHandler);
router.get("/conversations/:conversationId", getChatHistoryHandler);
router.patch("/conversations/:conversationId", updateConversationTitleHandler);
router.delete("/conversations/:conversationId", deleteConversationHandler);
router.patch("/conversations/:id/course", updateConversationCourseHandler);
router.get("/analytics", conversationAnalyticsHandler);
router.post("/", chatHandler);

module.exports = router;
