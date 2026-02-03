import { Router } from 'express';
import {
    getAllCrops,
    getCropByName,
    getCropById,
    createCrop,
    updateCrop,
    deleteCrop
} from '../controllers/cropInfo.controller.js';

const router = Router();

// Public routes - anyone can view crop information
router.get('/', getAllCrops);
router.get('/name/:name', getCropByName);
router.get('/:id', getCropById);

// Admin routes - can add auth middleware later
router.post('/', createCrop);
router.put('/:id', updateCrop);
router.delete('/:id', deleteCrop);

export default router;
