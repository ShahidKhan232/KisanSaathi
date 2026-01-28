import express from 'express';
import { recommendCrop } from '../controllers/cropRecommendation.controller.js';

import { authOptional } from '../middleware/auth.js';

const router = express.Router();

router.post('/recommend', authOptional, recommendCrop);

export default router;
