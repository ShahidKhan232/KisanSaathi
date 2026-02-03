import { Router } from 'express';
import {
    getDiseaseHistory,
    saveDiseaseDetection,
    getDiseaseById,
    deleteDiseaseDetection
} from '../controllers/cropDisease.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// All disease detection routes require authentication
router.get('/', authRequired, getDiseaseHistory);
router.get('/:id', authRequired, getDiseaseById);
router.post('/', authRequired, saveDiseaseDetection);
router.delete('/:id', authRequired, deleteDiseaseDetection);

export default router;
