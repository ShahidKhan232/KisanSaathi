import express from 'express';
import { recommendCrop, getRecommendationHistory } from '../controllers/cropRecommendation.controller.js';
import { authOptional, authRequired } from '../middleware/auth.js';

const router = express.Router();

// Open endpoint with optional auth so the ML result is returned to all, but saved only for logged-in users
router.post('/recommend', authOptional, recommendCrop);

// Retrieves the logged-in user's past recommendations
router.get('/history', authRequired, getRecommendationHistory);

export default router;
