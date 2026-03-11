import { Router } from 'express';
import {
    getAllCrops,
    getCropByName,
    getCropById,
    createCrop,
    updateCrop,
    deleteCrop
} from '../controllers/cropInfo.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = Router();

// Public routes - anyone can view crop information
router.get('/', getAllCrops);
router.get('/name/:name', getCropByName);
router.get('/:id', getCropById);

// Admin routes - require authentication
router.post('/', authRequired, createCrop);
router.put('/:id', authRequired, updateCrop);
router.delete('/:id', authRequired, deleteCrop);

export default router;
