import { Router } from 'express';
import { validateChatRequest, chatResponseShape } from '../models/schemas.js';
import { handleChat } from '../services/chatService.js';

const router = Router();

router.post('/chat', async (req, res) => {
  try {
    const validated = validateChatRequest(req.body);
    const result = await handleChat(validated);
    res.json(chatResponseShape(result));
  } catch (e) {
    res.status(400).json({ error: String(e.message || e) });
  }
});

export default router;
