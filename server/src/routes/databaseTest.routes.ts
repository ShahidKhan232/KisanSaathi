import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { testDatabaseConnections, createSampleData } from '../controllers/databaseTest.controller.js';

const router = Router();

// Test database connections (public - no auth required for basic test)
router.get('/test', testDatabaseConnections);

// Create sample data (requires authentication)
router.post('/sample-data', authRequired, createSampleData);

export default router;
