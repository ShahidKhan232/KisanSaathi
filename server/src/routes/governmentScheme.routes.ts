import express from 'express';
import { getSchemes, getSchemeById, createScheme } from '../controllers/governmentScheme.controller.js';
import { authOptional } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSchemes);
router.get('/:id', getSchemeById);
router.post('/', authOptional, createScheme); // Allow admin to create schemes

export default router;
