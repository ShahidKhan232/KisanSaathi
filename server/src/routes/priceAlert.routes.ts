import express from 'express';
import { getMyAlerts, createAlert, deleteAlert, getAlertPreferences, updateAlert } from '../controllers/priceAlert.controller.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.get('/', authRequired, getMyAlerts);
router.get('/preferences', authRequired, getAlertPreferences);
router.post('/', authRequired, createAlert);
router.put('/:id', authRequired, updateAlert);
router.delete('/:id', authRequired, deleteAlert);

export default router;
