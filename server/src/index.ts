// CRITICAL: Load environment variables FIRST before any other imports
import './loadEnv.js';

import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

// Database
import { connectDatabase, getDatabaseStatus, createIndexes } from './config/database.js';

// Import all models to ensure they are registered
import './models/index.js';

// Routes
import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import userRoutes from './routes/userRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import cropRoutes from './routes/cropRecommendation.routes.js';
import marketPriceRoutes from './routes/marketPrice.routes.js';
import governmentSchemeRoutes from './routes/governmentScheme.routes.js';
import priceAlertRoutes from './routes/priceAlert.routes.js';

// Services
import { WebSocketManager } from './services/WebSocketManager.js';

// Initialize Express app
const app = express();

// Security middleware
app.use(helmet());

// CORS configuration
const allowedOrigins = process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173'];
app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Explicitly handle preflight
app.options('*', cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use(morgan('dev'));

// Compression middleware
app.use(compression());

// Basic rate limiting for all API endpoints
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // Limit each IP to 120 requests per minute
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', apiLimiter);

// Health check endpoints
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    ok: true,
    time: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health/database', (_req: Request, res: Response) => {
  const dbStatus = getDatabaseStatus();
  res.json(dbStatus);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/users', userRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/crop', cropRoutes);

app.api_routes_registered = true; // Flag for debug

app.use('/api/alerts', priceAlertRoutes);
app.use('/api/prices', marketPriceRoutes);
app.use('/api/schemes', governmentSchemeRoutes);

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: any) => {
  console.error('Server error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialize database connection
connectDatabase()
  .then(async () => {
    // Create indexes for all models after successful connection
    await createIndexes();
  })
  .catch(err => {
    console.error('Failed to connect to database:', err);
  });

// Create HTTP server
const httpServer = createServer(app);

// Initialize WebSocket
const wsManager = new WebSocketManager(httpServer);
app.set('wsManager', wsManager);
console.log('✅ WebSocket manager initialized');

// Start server
const PORT = Number(process.env.PORT) || 5001;
httpServer.listen(PORT, () => {
  console.log('');
  console.log('🚀 ========================================');
  console.log(`   KisanSaathi Server`);
  console.log('   ========================================');
  console.log(`   🌐 Server running on port ${PORT}`);
  console.log(`   📍 http://localhost:${PORT}`);
  console.log(`   🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('   ========================================');
  console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
