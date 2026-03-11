import express from 'express';
import { getSchemes, getSchemeById, createScheme } from '../controllers/governmentScheme.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getSchemes);
router.get('/:id', getSchemeById);
router.post('/', authRequired, createScheme); // Admin: requires authentication

export default router;
