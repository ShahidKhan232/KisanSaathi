import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import { testDatabaseConnections, createSampleData } from '../controllers/databaseTest.controller.js';

const router = Router();

// Test database connections (requires authentication to see user-specific data)
router.get('/test', authRequired, testDatabaseConnections);

// Create sample data (requires authentication)
router.post('/sample-data', authRequired, createSampleData);

export default router;
