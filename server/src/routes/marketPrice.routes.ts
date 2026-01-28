import express from 'express';
import { getMarketPrices, addMarketPrice } from '../controllers/marketPrice.controller.js';
import { authOptional } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getMarketPrices);
router.post('/', authOptional, addMarketPrice); // Allow script/admin to add prices

export default router;
