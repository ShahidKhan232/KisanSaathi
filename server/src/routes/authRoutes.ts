import express from 'express';
import { register, login, getCurrentUser, createTestUser, firebaseSync } from '../controllers/authController.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Firebase Auth sync (called right after Firebase sign-in on the client)
router.post('/firebase-sync', firebaseSync);

// Legacy JWT routes (kept for backward compatibility)
router.post('/register', register);
router.post('/login', login);
router.post('/create-test-user', createTestUser); // Development only

// Protected routes
router.get('/me', authRequired, getCurrentUser);

export default router;
