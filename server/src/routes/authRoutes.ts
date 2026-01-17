import express from 'express';
import { register, login, getCurrentUser, createTestUser } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/create-test-user', createTestUser); // Development only

// Protected routes
router.get('/me', authRequired, getCurrentUser);

export default router;
