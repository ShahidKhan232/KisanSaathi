import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    getCurrentMarketPrices,
    getPriceHistory,
    getUserPreferredPrices,
    saveMarketPrice,
    getPriceStatistics,
    cleanupOldPriceData,
    fetchDailyPricesFromAI,
    getAIPriceStatus
} from '../controllers/marketPriceData.controller.js';

const router = Router();

// Public routes - anyone can view market prices
router.get('/current', getCurrentMarketPrices);
router.get('/history', getPriceHistory);
router.get('/statistics', getPriceStatistics);

// AI price generation routes
router.get('/ai-status', getAIPriceStatus); // Public - check AI price status
router.post('/fetch-ai-prices', authRequired, fetchDailyPricesFromAI); // Admin - manual trigger

// User-specific routes - require authentication
router.get('/user/preferred', authRequired, getUserPreferredPrices);

// Admin/Service routes - for saving and managing price data
router.post('/', authRequired, saveMarketPrice);
router.delete('/cleanup', authRequired, cleanupOldPriceData);

export default router;
