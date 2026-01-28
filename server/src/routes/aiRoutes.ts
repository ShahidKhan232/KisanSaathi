import { Router } from 'express';
import * as aiController from '../controllers/aiController.js';
import { authOptional } from '../middleware/auth.js';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiter for AI endpoints (more restrictive than general API)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // Limit each IP to 10 AI requests per minute
    message: 'Too many AI requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
});

// Apply rate limiting to all AI routes
router.use(aiLimiter);

/**
 * POST /api/ai/chat
 * Chat with AI assistant
 * Body: { message: string, systemPrompt?: string }
 */
router.post('/chat', authOptional, aiController.chat);

/**
 * POST /api/ai/analyze-image
 * Analyze crop image for disease detection
 * Body: { imageBase64: string, query: string, systemPrompt?: string }
 */
router.post('/analyze-image', authOptional, aiController.analyzeImage);

export default router;
