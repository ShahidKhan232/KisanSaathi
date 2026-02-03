import { Router } from 'express';
import { testCropDiseaseDB } from '../controllers/testCropDisease.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Test crop disease database operations
router.get('/test', authRequired, testCropDiseaseDB);

export default router;
