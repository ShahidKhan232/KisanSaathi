import express from 'express';
import { getProfile, updateProfile, getProfileStats } from '../controllers/profileController.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// All profile routes require authentication
router.get('/stats', authRequired, getProfileStats);
router.get('/', authRequired, getProfile);
router.put('/', authRequired, updateProfile);

export default router;
