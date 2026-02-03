import { Router } from 'express';
import { testAPI } from '../controllers/testAPI.controller.js';

const router = Router();

// Test API endpoint
router.get('/test', testAPI);

export default router;
