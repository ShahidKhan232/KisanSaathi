import { Router } from 'express';
import {
    getChatHistory,
    getChatSession,
    saveChatMessage,
    deleteChatSession
} from '../controllers/chatHistory.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// All chat history routes require authentication
router.get('/', authRequired, getChatHistory);
router.get('/:sessionId', authRequired, getChatSession);
router.post('/message', authRequired, saveChatMessage);
router.delete('/:sessionId', authRequired, deleteChatSession);

export default router;
