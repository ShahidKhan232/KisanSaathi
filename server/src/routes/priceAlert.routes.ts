import express from 'express';
import { getMyAlerts, createAlert, deleteAlert } from '../controllers/priceAlert.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authRequired, getMyAlerts);
router.post('/', authRequired, createAlert);
router.delete('/:id', authRequired, deleteAlert);

export default router;
