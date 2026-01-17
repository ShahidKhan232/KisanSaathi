import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer } from 'http';
import { WebSocketManager } from './services/WebSocketManager.js';

import { fileURLToPath } from 'url';
import { dirname } from 'path';


const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import type { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';
import mongoose, { Schema, model } from 'mongoose';
import type { Model, Document } from 'mongoose';
import { z } from 'zod';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import userRoutes from './routes/userRoutes.js';

const app = express();

app.use(helmet());
app.use(cors({
  origin: (process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173']),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Explicitly handle preflight
app.options('*', cors({
  origin: (process.env.CLIENT_ORIGIN?.split(',') || ['http://localhost:5173']),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: '10mb' }));
app.use(morgan('dev'));
app.use(compression());

// Register API routes
app.use('/api/users', userRoutes);

// Basic rate limiting for public endpoints
const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 });
app.use('/api/', limiter);

// Health
app.get('/api/health', (_req: Request, res: Response) => res.json({ ok: true, time: new Date().toISOString() }));

// AI service health check
app.get('/api/health/ai', (_req: Request, res: Response) => {
  const geminiState = geminiCircuitBreaker.getState();
  const openaiState = openaiCircuitBreaker.getState();
  
  res.json({
    provider: AI_PROVIDER,
    services: {
      gemini: {
        configured: !!genAI,
        circuitBreaker: geminiState,
        status: geminiState.state === 'OPEN' ? 'degraded' : 'healthy'
      },
      openai: {
        configured: !!openai,
        circuitBreaker: openaiState,
        status: openaiState.state === 'OPEN' ? 'degraded' : 'healthy'
      }
    },
    overall: (AI_PROVIDER === 'gemini' && geminiState.state === 'OPEN') || 
             (AI_PROVIDER === 'openai' && openaiState.state === 'OPEN') ? 'degraded' : 'healthy'
  });
});

// Debug endpoint to list available Gemini models
app.get('/api/debug/gemini-models', async (_req: Request, res: Response) => {
  if (!genAI) {
    return res.status(503).json({ 
      error: 'Gemini not configured',
      message: 'GEMINI_API_KEY environment variable not set'
    });
  }
  
  try {
    const availableModels = await listAvailableGeminiModels();
    res.json({
      configured_model: GEMINI_MODEL,
      runtime_model: GEMINI_RUNTIME_MODEL,
      available_models: availableModels,
      api_key_prefix: geminiKey ? geminiKey.substring(0, 10) + '...' : 'not set'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch models',
      message: (error as Error).message
    });
  }
});

// Database health check endpoint
app.get('/api/debug/database', async (_req: Request, res: Response) => {
  try {
    const dbStatus: any = {
      mongodb_configured: !!MONGO_URI,
      mongodb_uri: MONGO_URI ? MONGO_URI.replace(/\/\/.*@/, '//***:***@') : null, // Hide credentials
      mongodb_connected: mongoReady,
      connection_state: mongoose.connection.readyState,
      connection_states: {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting'
      }
    };

    if (mongoReady) {
      // Test database operations
      try {
        const userCount = await UserModel.countDocuments();
        const alertCount = await PriceAlertModel.countDocuments();
        dbStatus.collections = {
          users: userCount,
          price_alerts: alertCount
        };
      } catch (err) {
        dbStatus.collections_error = (err as Error).message;
      }
    }

    res.json(dbStatus);
  } catch (error) {
    res.status(500).json({
      error: 'Failed to check database status',
      message: (error as Error).message
    });
  }
});

// Mongo connection (optional)
const MONGO_URI = process.env.MONGO_URI || '';
let mongoReady = false;
if (MONGO_URI) {
  mongoose.connect(MONGO_URI).then(() => {
    mongoReady = true;
    console.log('Mongo connected');
  }).catch((err: unknown) => {
    console.warn('Mongo connection failed, using in-memory storage. Error:', (err as Error)?.message ?? err);
  });
} else {
  console.warn('MONGO_URI not set. Using in-memory storage.');
}

// Interfaces and Models
interface IUser {
  name?: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  phone?: string;
  location?: string;
  landSize?: string;
  crops?: string[];
  kccNumber?: string;
  aadhaar?: string;
  bankAccount?: string;
}
interface IUserDoc extends Document, IUser { _id: mongoose.Types.ObjectId }
const UserSchema = new Schema<IUserDoc>({
  name: { type: String, trim: true },
  email: { type: String, unique: true, required: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  phone: { type: String, trim: true },
  location: { type: String, trim: true },
  landSize: { type: String, trim: true },
  crops: { type: [String], default: [] },
  kccNumber: { type: String, trim: true },
  aadhaar: { type: String, trim: true },
  bankAccount: { type: String, trim: true }
});
const UserModel: Model<IUserDoc> = (mongoose.models.User as Model<IUserDoc>) || model<IUserDoc>('User', UserSchema);

interface IAlert { userId: string; crop: string; targetPrice: number; createdAt: Date }
interface IAlertDoc extends Document, IAlert {}
const PriceAlertSchema = new Schema<IAlertDoc>({
  userId: { type: String, required: true },
  crop: { type: String, required: true },
  targetPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});
const PriceAlertModel: Model<IAlertDoc> = (mongoose.models.PriceAlert as Model<IAlertDoc>) || model<IAlertDoc>('PriceAlert', PriceAlertSchema);

// In-memory fallback stores
const alertsMemory: IAlert[] = [];

type MemUser = { id: string; name?: string; email: string; passwordHash: string; createdAt: Date };
const usersMemory: MemUser[] = [];
type MemProfile = {
  phone?: string;
  location?: string;
  landSize?: string;
  crops?: string[];
  kccNumber?: string;
  aadhaar?: string;
  bankAccount?: string;
};
const userIdToProfile: Record<string, MemProfile> = {};

// JWT helpers
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
interface JwtPayload { id: string; email: string; name?: string; iat?: number; exp?: number }
const signToken = (payload: JwtPayload) => jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
function getTokenPayload(req: Request): JwtPayload | null {
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch {
    return null;
  }
}

// Auth middleware
function authRequired(req: Request & { user?: JwtPayload }, res: Response, next: NextFunction) {
  const payload = getTokenPayload(req);
  if (!payload) return res.status(401).json({ error: 'Unauthorized' });
  req.user = payload;
  next();
}

// Validation schemas
const RegisterSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email(),
  password: z.string().min(6)
});
const LoginSchema = z.object({ email: z.string().email(), password: z.string().min(1) });
const AlertSchema = z.object({
  userId: z.string().min(1).optional(), // will be overridden by token if present
  crop: z.string().min(1),
  targetPrice: z.number().positive(),
});

// Development helper - create test user
app.post('/api/auth/create-test-user', async (req: Request, res: Response) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }
  
  const testEmail = 'test@example.com';
  const testPassword = 'password123';
  const testName = 'Test User';
  
  try {
    if (mongoReady) {
      const existing = await UserModel.findOne({ email: testEmail }).lean();
      if (existing) return res.json({ message: 'Test user already exists', email: testEmail });
      
      const passwordHash = await bcrypt.hash(testPassword, 10);
      const user = await UserModel.create({ 
        email: testEmail, 
        passwordHash, 
        name: testName, 
        createdAt: new Date() 
      });
      const id = (user._id as mongoose.Types.ObjectId).toString();
      return res.status(201).json({ 
        message: 'Test user created', 
        email: testEmail, 
        password: testPassword,
        id 
      });
    }
    
    const exists = usersMemory.some(u => u.email === testEmail);
    if (exists) return res.json({ message: 'Test user already exists', email: testEmail });
    
    const passwordHash = await bcrypt.hash(testPassword, 10);
    const user: MemUser = { 
      id: Date.now().toString(), 
      email: testEmail, 
      name: testName, 
      passwordHash, 
      createdAt: new Date() 
    };
    usersMemory.push(user);
    userIdToProfile[user.id] = { crops: [] };
    
    return res.status(201).json({ 
      message: 'Test user created', 
      email: testEmail, 
      password: testPassword,
      id: user.id 
    });
  } catch (err) {
    console.error('Test user creation failed:', err);
    return res.status(500).json({ error: 'Failed to create test user' });
  }
});

// Auth routes
app.post('/api/auth/register', async (req: Request, res: Response) => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password, name } = parsed.data;
  try {
    if (mongoReady) {
      const existing = await UserModel.findOne({ email }).lean();
      if (existing) return res.status(409).json({ error: 'Email already registered' });
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await UserModel.create({ email, passwordHash, name, createdAt: new Date() });
      const id = (user._id as mongoose.Types.ObjectId).toString();
      const token = signToken({ id, email, name: user.name });
      return res.status(201).json({ token, user: { id, email, name: user.name ?? null } });
    }
    const exists = usersMemory.some(u => u.email === email);
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user: MemUser = { id: Date.now().toString(), email, name, passwordHash, createdAt: new Date() };
    usersMemory.push(user);
    userIdToProfile[user.id] = { crops: [] };
    const token = signToken({ id: user.id, email, name });
    return res.status(201).json({ token, user: { id: user.id, email, name: user.name ?? null } });
  } catch (_err) {
    console.error(_err);
    return res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { email, password } = parsed.data;
  try {
    if (mongoReady) {
      const user = await UserModel.findOne({ email });
      if (!user) return res.status(401).json({ error: 'Invalid credentials' });
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
      const id = (user._id as mongoose.Types.ObjectId).toString();
      const token = signToken({ id, email, name: user.name });
      return res.json({ token, user: { id, email, name: user.name ?? null } });
    }
    const user = usersMemory.find(u => u.email === email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
    const token = signToken({ id: user.id, email, name: user.name });
    return res.json({ token, user: { id: user.id, email, name: user.name ?? null } });
  } catch (_err) {
    console.error(_err);
    return res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authRequired, async (req: Request & { user?: JwtPayload }, res: Response) => {
  const { id } = req.user!;
  try {
    if (mongoReady) {
      const user = await UserModel.findById(id);
      if (!user) return res.status(404).json({ error: 'Not found' });
      const uid = (user._id as mongoose.Types.ObjectId).toString();
      return res.json({ id: uid, email: user.email, name: user.name ?? null });
    }
    const user = usersMemory.find(u => u.id === id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    return res.json({ id: user.id, email: user.email, name: user.name ?? null });
  } catch (_err) {
    console.error(_err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

// Profile routes
const ProfileSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().min(3).optional(),
  email: z.string().email().optional(),
  location: z.string().min(1).optional(),
  landSize: z.string().min(1).optional(),
  crops: z.array(z.string()).optional(),
  kccNumber: z.string().optional(),
  aadhaar: z.string().optional(),
  bankAccount: z.string().optional()
});

app.get('/api/profile', authRequired, async (req: Request & { user?: JwtPayload }, res: Response) => {
  const { id } = req.user!;
  console.log(`Fetching profile for user ${id}`);
  
  try {
    if (mongoReady) {
      const user = await UserModel.findById(id).lean();
      if (!user) {
        console.log(`User ${id} not found in database`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log(`Profile found in database for user ${id}`);
      const { _id, email, name, phone, location, landSize, crops, kccNumber, aadhaar, bankAccount } = user as any;
      return res.json({ 
        id: String(_id), 
        email, 
        name: name ?? null, 
        phone: phone ?? null,
        location: location ?? null,
        landSize: landSize ?? null,
        crops: crops ?? [], 
        kccNumber: kccNumber ?? null,
        aadhaar: aadhaar ?? null,
        bankAccount: bankAccount ?? null
      });
    } else {
      console.log('Using in-memory storage for profile fetch');
      const mem = usersMemory.find(u => u.id === id);
      if (!mem) {
        console.log(`User ${id} not found in memory`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const prof = userIdToProfile[id] || {};
      console.log(`Profile found in memory for user ${id}`);
      return res.json({ 
        id, 
        email: mem.email, 
        name: mem.name ?? null, 
        ...prof, 
        crops: prof.crops ?? [] 
      });
    }
  } catch (err) {
    console.error('Profile fetch error:', err);
    return res.status(500).json({ error: 'Failed to load profile' });
  }
});

app.put('/api/profile', authRequired, async (req: Request & { user?: JwtPayload }, res: Response) => {
  const parsed = ProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    console.log('Profile validation failed:', parsed.error.flatten());
    return res.status(400).json({ error: 'Invalid profile data', details: parsed.error.flatten() });
  }
  
  const { id } = req.user!;
  console.log(`Updating profile for user ${id}:`, parsed.data);
  
  try {
    if (mongoReady) {
      const update: Partial<IUser> = parsed.data as Partial<IUser>;
      
      // If email change requested, ensure uniqueness
      if (update.email) {
        const exists = await UserModel.findOne({ email: update.email, _id: { $ne: id } }).lean();
        if (exists) {
          console.log(`Email ${update.email} already in use by another user`);
          return res.status(409).json({ error: 'Email already in use' });
        }
      }
      
      // Trim string fields
      Object.keys(update).forEach(key => {
        if (typeof update[key as keyof IUser] === 'string') {
          (update[key as keyof IUser] as any) = (update[key as keyof IUser] as string).trim();
        }
      });
      
      const user = await UserModel.findByIdAndUpdate(
        id, 
        { $set: update }, 
        { new: true, runValidators: true }
      );
      
      if (!user) {
        console.log(`User ${id} not found for profile update`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      console.log(`Profile updated successfully for user ${id}`);
      const { _id, email, name, phone, location, landSize, crops, kccNumber, aadhaar, bankAccount } = user as any;
      return res.json({ 
        id: String(_id), 
        email, 
        name: name ?? null, 
        phone: phone ?? null,
        location: location ?? null,
        landSize: landSize ?? null,
        crops: crops ?? [], 
        kccNumber: kccNumber ?? null,
        aadhaar: aadhaar ?? null,
        bankAccount: bankAccount ?? null
      });
    } else {
      console.log('Using in-memory storage for profile update');
      const mem = usersMemory.find(u => u.id === id);
      if (!mem) {
        console.log(`User ${id} not found in memory for profile update`);
        return res.status(404).json({ error: 'User not found' });
      }
      
      const existing = userIdToProfile[id] || {};
      const updated = { ...existing, ...parsed.data };
      userIdToProfile[id] = updated;
      
      console.log(`Profile updated in memory for user ${id}`);
      return res.json({ 
        id, 
        email: mem.email, 
        name: mem.name ?? null, 
        ...updated, 
        crops: updated.crops ?? [] 
      });
    }
  } catch (err) {
    console.error('Profile update error:', err);
    return res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Routes: Alerts (auth optional; if token present, use token user)
app.post('/api/alerts', async (req: Request, res: Response) => {
  const parsed = AlertSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const payload = getTokenPayload(req);
  const userId = payload?.id || parsed.data.userId;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  try {
    if (mongoReady) {
      const alert = await PriceAlertModel.create({ userId, crop: parsed.data.crop, targetPrice: parsed.data.targetPrice, createdAt: new Date() });
      return res.status(201).json(alert);
    }
    const alert: IAlert = { userId, crop: parsed.data.crop, targetPrice: parsed.data.targetPrice, createdAt: new Date() };
    alertsMemory.push(alert);
    return res.status(201).json(alert);
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to create alert' });
  }
});

app.get('/api/alerts/:userId', async (req: Request, res: Response) => {
  try {
    const payload = getTokenPayload(req);
    const param = req.params.userId;
    const resolvedUserId = param === 'me' ? payload?.id : param;
    if (!resolvedUserId) return res.status(401).json({ error: 'Unauthorized' });

    if (mongoReady) {
      const alerts = await PriceAlertModel.find({ userId: resolvedUserId }).sort({ createdAt: -1 });
      return res.json(alerts);
    }
    const alerts = alertsMemory
      .filter(a => a.userId === resolvedUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return res.json(alerts);
  } catch (_err) {
    console.error(_err);
    res.status(500).json({ error: 'Failed to load alerts' });
  }
});

// Routes: Price data (mock)
app.get('/api/prices', (_req: Request, res: Response) => {
  const today = new Date().toISOString().split('T')[0];
  const items = [
    { crop: 'टमाटर', market: 'अज़ादपुर मंडी', currentPrice: 4520, predictedPrice: 4630, change: 2.4, trend: 'up', date: today, confidence: 84, image: 'https://images.pexels.com/photos/1327373/pexels-photo-1327373.jpeg?auto=compress&cs=tinysrgb&w=100' },
    { crop: 'प्याज', market: 'नासिक मंडी', currentPrice: 3420, predictedPrice: 3380, change: -1.2, trend: 'down', date: today, confidence: 79, image: 'https://images.pexels.com/photos/1323712/pexels-photo-1323712.jpeg?auto=compress&cs=tinysrgb&w=100' },
  ];
  res.json(items);
});

app.get('/api/prediction-details', (req: Request, res: Response) => {
  const crop = String(req.query.crop || 'टमाटर');
  const market = String(req.query.market || 'अज़ादपुर मंडी');
  const today = new Date();

  const historical = Array.from({ length: 31 }).map((_, idx) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (30 - idx));
    return { date: d.toISOString().split('T')[0], price: Math.round(4000 + 500 * Math.sin(idx / 6) + Math.random() * 150) };
  });

  const forecast = [1, 2, 3].map(i => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return { date: d.toISOString().split('T')[0], price: Math.round(historical[historical.length - 1].price * (1 + i * 0.01)) };
  });

  const analysis = `${crop} analysis:\n\n` +
    (forecast[2].price > historical[historical.length - 1].price
      ? '📈 Price likely to increase\n• Demand is rising\n• Supply may be limited\n• Good time to sell'
      : '➡️ Price likely to remain stable\n• Market is balanced');

  res.json({ historical, forecast, analysis, crop, market });
});

// Government schemes with enhanced data structure
interface ExtendedScheme {
  id: string;
  name: string;
  nameEn: string;
  nameMr: string;
  description: string;
  descriptionEn: string;
  descriptionMr: string;
  benefit: string;
  benefitEn: string;
  benefitMr: string;
  eligibility: string[];
  eligibilityEn: string[];
  eligibilityMr: string[];
  documents: string[];
  documentsEn: string[];
  documentsMr: string[];
  applicationStatus: 'available' | 'applied' | 'approved';
  deadline: string;
  category: 'direct-benefit' | 'subsidy' | 'loan' | 'insurance' | 'digital' | 'infrastructure';
  matchScore: number;
  launchDate: string;
  websiteUrl: string;
  applicationSteps: string[];
  applicationStepsEn: string[];
  applicationStepsMr: string[];
  successRate: number;
  avgProcessingDays: number;
  beneficiariesCount: number;
  budgetAllocated: string;
  regionalAvailability: string[];
  lastUpdated: string;
  features: string[];
  featuresEn: string[];
  featuresMr: string[];
}

app.get('/api/schemes', (_req: Request, res: Response) => {
  const schemes: ExtendedScheme[] = [
    {
      id: '1',
      name: 'PM-KISAN योजना',
      nameEn: 'PM-KISAN Scheme',
      nameMr: 'PM-KISAN योजना',
      description: 'छोटे और सीमांत किसानों को प्रति वर्ष ₹6000 की प्रत्यक्ष आर्थिक सहायता',
      descriptionEn: 'Direct financial assistance of ₹6000 per year to small and marginal farmers',
      descriptionMr: 'लहान व सीमांत शेतकऱ्यांना दरवर्षी ₹6000 प्रत्यक्ष आर्थिक मदत',
      benefit: '₹6000 प्रति वर्ष (₹2000 की 3 किस्त)',
      benefitEn: '₹6000 per year (3 installments of ₹2000)',
      benefitMr: 'दरवर्षी ₹6000 (₹2000 च्या 3 हप्त्यात)',
      eligibility: ['2 हेक्टेयर तक कृषि भूमि', 'आधार कार्ड आवश्यक', 'बैंक खाता आवश्यक'],
      eligibilityEn: ['Up to 2 hectares agricultural land', 'Aadhaar card required', 'Bank account required'],
      eligibilityMr: ['2 हेक्टर पर्यंत शेतजमीन', 'आधार कार्ड आवश्यक', 'बँक खाते आवश्यक'],
      documents: ['आधार कार्ड', 'बैंक पासबुक', 'भूमि दस्तावेज'],
      documentsEn: ['Aadhaar Card', 'Bank Passbook', 'Land Documents'],
      documentsMr: ['आधार कार्ड', 'बँक पासबुक', 'जमीन कागदपत्रे'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'direct-benefit',
      matchScore: 95,
      launchDate: '2019-02-24',
      websiteUrl: 'https://pmkisan.gov.in',
      applicationSteps: ['ऑनलाइन पंजीकरण', 'दस्तावेज अपलोड', 'सत्यापन', 'अनुमोदन'],
      applicationStepsEn: ['Online Registration', 'Document Upload', 'Verification', 'Approval'],
      applicationStepsMr: ['ऑनलाइन नोंदणी', 'कागदपत्रे अपलोड', 'पडताळणी', 'मंजूरी'],
      successRate: 92.5,
      avgProcessingDays: 15,
      beneficiariesCount: 11000000,
      budgetAllocated: '₹60,000 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-10-01',
      features: ['प्रत्यक्ष लाभ हस्तांतरण', 'आधार लिंकेज', 'मोबाइल वेरिफिकेशन'],
      featuresEn: ['Direct Benefit Transfer', 'Aadhaar Linkage', 'Mobile Verification'],
      featuresMr: ['प्रत्यक्ष फायदा हस्तांतरण', 'आधार लिंकेज', 'मोबाइल पडताळणी']
    },
    {
      id: '2',
      name: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
      nameEn: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      nameMr: 'प्रधानमंत्री फसल विमा योजना (PMFBY)',
      description: 'प्राकृतिक आपदाओं से होने वाले फसल नुकसान का व्यापक बीमा कवरेज',
      descriptionEn: 'Comprehensive insurance coverage for crop loss due to natural calamities',
      descriptionMr: 'नैसर्गिक आपत्तींमुळे पिकांचे नुकसान झाल्यास सर्वसमावेशक विमा संरक्षण',
      benefit: 'फसल मूल्य का 100% तक मुआवजा',
      benefitEn: 'Up to 100% compensation of crop value',
      benefitMr: 'पीक मूल्याच्या 100% पर्यंत नुकसानभरपाई',
      eligibility: ['सभी किसान', 'अधिसूचित फसलें', 'निर्धारित समय सीमा में आवेदन'],
      eligibilityEn: ['All farmers', 'Notified crops', 'Application within specified timeline'],
      eligibilityMr: ['सर्व शेतकरी', 'अधिसूचित पिके', 'निर्दिष्ट वेळेत अर्ज'],
      documents: ['आधार कार्ड', 'भूमि दस्तावेज', 'बैंक पासबुक', 'बुवाई प्रमाण'],
      documentsEn: ['Aadhaar Card', 'Land Documents', 'Bank Passbook', 'Sowing Certificate'],
      documentsMr: ['आधार कार्ड', 'जमीन कागदपत्रे', 'बँक पासबुक', 'पेरणी प्रमाणपत्र'],
      applicationStatus: 'available',
      deadline: '2025-07-31',
      category: 'insurance',
      matchScore: 88,
      launchDate: '2016-04-13',
      websiteUrl: 'https://pmfby.gov.in',
      applicationSteps: ['बैंक/CSC में आवेदन', 'प्रीमियम भुगतान', 'फसल निरीक्षण', 'क्लेम सेटलमेंट'],
      applicationStepsEn: ['Apply at Bank/CSC', 'Premium Payment', 'Crop Inspection', 'Claim Settlement'],
      applicationStepsMr: ['बँक/CSC मध्ये अर्ज', 'प्रीमियम भरणा', 'पीक तपासणी', 'क्लेम सेटलमेंट'],
      successRate: 78.3,
      avgProcessingDays: 45,
      beneficiariesCount: 5500000,
      budgetAllocated: '₹15,695 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-09-15',
      features: ['व्यापक जोखिम कवरेज', 'कम प्रीमियम', 'तकनीकी सहायता'],
      featuresEn: ['Comprehensive Risk Coverage', 'Low Premium', 'Technology Support'],
      featuresMr: ['सर्वसमावेशक जोखीम संरक्षण', 'कमी प्रीमियम', 'तंत्रज्ञान साहाय्य']
    },
    {
      id: '3',
      name: 'किसान क्रेडिट कार्ड (KCC)',
      nameEn: 'Kisan Credit Card (KCC)',
      nameMr: 'किसान क्रेडिट कार्ड (KCC)',
      description: 'कृषि और संबंधित गतिविधियों के लिए आसान क्रेडिट सुविधा',
      descriptionEn: 'Easy credit facility for agriculture and allied activities',
      descriptionMr: 'शेती आणि संबंधित क्रियाकलापांसाठी सुलभ पत क्रेडिट सुविधा',
      benefit: '₹3 लाख तक 4% ब्याज दर पर लोन',
      benefitEn: 'Loan up to ₹3 lakh at 4% interest rate',
      benefitMr: '4% व्याजदराने ₹3 लाख पर्यंत कर्ज',
      eligibility: ['कृषि भूमि का मालिक', 'बैंक खाता', 'CIBIL स्कोर 650+'],
      eligibilityEn: ['Agricultural land owner', 'Bank account', 'CIBIL score 650+'],
      eligibilityMr: ['शेतजमीन मालक', 'बँक खाते', 'CIBIL स्कोअर 650+'],
      documents: ['आधार कार्ड', 'भूमि दस्तावेज', 'आय प्रमाण', 'बैंक स्टेटमेंट'],
      documentsEn: ['Aadhaar Card', 'Land Documents', 'Income Certificate', 'Bank Statement'],
      documentsMr: ['आधार कार्ड', 'जमीन कागदपत्रे', 'उत्पन्न प्रमाणपत्र', 'बँक स्टेटमेंट'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'loan',
      matchScore: 85,
      launchDate: '1998-08-01',
      websiteUrl: 'https://kcc.gov.in',
      applicationSteps: ['बैंक में आवेदन', 'दस्तावेज सत्यापन', 'क्रेडिट मूल्यांकन', 'कार्ड जारी'],
      applicationStepsEn: ['Bank Application', 'Document Verification', 'Credit Assessment', 'Card Issue'],
      applicationStepsMr: ['बँकेत अर्ज', 'कागदपत्रांची पडताळणी', 'क्रेडिट मूल्यांकन', 'कार्ड जारी'],
      successRate: 82.7,
      avgProcessingDays: 30,
      beneficiariesCount: 8900000,
      budgetAllocated: '₹75,000 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-08-20',
      features: ['डिजिटल KCC', 'RuPay डेबिट कार्ड', 'मोबाइल बैंकिंग'],
      featuresEn: ['Digital KCC', 'RuPay Debit Card', 'Mobile Banking'],
      featuresMr: ['डिजिटल KCC', 'RuPay डेबिट कार्ड', 'मोबाइल बँकिंग']
    },
    {
      id: '4',
      name: 'e-NAM (राष्ट्रीय कृषि बाजार)',
      nameEn: 'e-NAM (National Agriculture Market)',
      nameMr: 'e-NAM (राष्ट्रीय कृषि बाजार)',
      description: 'ऑनलाइन कृषि उत्पाद विपणन मंच',
      descriptionEn: 'Online agricultural produce marketing platform',
      descriptionMr: 'ऑनलाइन कृषी उत्पादन विपणन प्लॅटफॉर्म',
      benefit: 'बेहतर मूल्य प्राप्ति, पारदर्शी नीलामी',
      benefitEn: 'Better price realization, transparent auction',
      benefitMr: 'चांगले दर मिळणे, पारदर्शक लिलाव',
      eligibility: ['पंजीकृत किसान', 'FPO सदस्य', 'कृषि उत्पादक'],
      eligibilityEn: ['Registered farmer', 'FPO member', 'Agricultural producer'],
      eligibilityMr: ['नोंदणीकृत शेतकरी', 'FPO सदस्य', 'कृषी उत्पादक'],
      documents: ['आधार कार्ड', 'बैंक खाता', 'मोबाइल नंबर', 'भूमि दस्तावेज'],
      documentsEn: ['Aadhaar Card', 'Bank Account', 'Mobile Number', 'Land Documents'],
      documentsMr: ['आधार कार्ड', 'बँक खाते', 'मोबाइल नंबर', 'जमीन कागदपत्रे'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'digital',
      matchScore: 80,
      launchDate: '2016-04-14',
      websiteUrl: 'https://enam.gov.in',
      applicationSteps: ['ऑनलाइन पंजीकरण', 'दस्तावेज अपलोड', 'सत्यापन', 'ट्रेडिंग शुरू'],
      applicationStepsEn: ['Online Registration', 'Document Upload', 'Verification', 'Start Trading'],
      applicationStepsMr: ['ऑनलाइन नोंदणी', 'कागदपत्रे अपलोड', 'पडताळणी', 'व्यापार सुरू'],
      successRate: 75.8,
      avgProcessingDays: 7,
      beneficiariesCount: 1800000,
      budgetAllocated: '₹200 करोड़',
      regionalAvailability: ['585 Markets', '18 States'],
      lastUpdated: '2024-09-30',
      features: ['मोबाइल ऐप', 'QR कोड भुगतान', 'मार्केट इंटेलिजेंस'],
      featuresEn: ['Mobile App', 'QR Code Payment', 'Market Intelligence'],
      featuresMr: ['मोबाइल अॅप', 'QR कोड पेमेंट', 'मार्केट इंटेलिजन्स']
    },
    {
      id: '5',
      name: 'प्रधानमंत्री किसान FPO योजना',
      nameEn: 'PM Farmer Producer Organization Scheme',
      nameMr: 'प्रधानमंत्री शेतकरी उत्पादक संघटना योजना',
      description: 'किसान उत्पादक संगठनों को प्रोत्साहन और वित्तीय सहायता',
      descriptionEn: 'Promotion and financial support to Farmer Producer Organizations',
      descriptionMr: 'शेतकरी उत्पादक संघटनांना प्रोत्साहन आणि आर्थिक मदत',
      benefit: '₹15 लाख तक वित्तीय सहायता',
      benefitEn: 'Financial assistance up to ₹15 lakh',
      benefitMr: '₹15 लाख पर्यंत आर्थिक सहाय्य',
      eligibility: ['न्यूनतम 300 सदस्य', 'कृषि उत्पादन', 'पंजीकृत FPO'],
      eligibilityEn: ['Minimum 300 members', 'Agricultural production', 'Registered FPO'],
      eligibilityMr: ['किमान 300 सदस्य', 'कृषी उत्पादन', 'नोंदणीकृत FPO'],
      documents: ['FPO पंजीकरण', 'सदस्य सूची', 'बैंक खाता', 'बिजनेस प्लान'],
      documentsEn: ['FPO Registration', 'Member List', 'Bank Account', 'Business Plan'],
      documentsMr: ['FPO नोंदणी', 'सदस्य यादी', 'बँक खाते', 'बिझनेस प्लॅन'],
      applicationStatus: 'available',
      deadline: '2025-08-31',
      category: 'subsidy',
      matchScore: 78,
      launchDate: '2020-02-29',
      websiteUrl: 'https://pmfpo.gov.in',
      applicationSteps: ['FPO गठन', 'पंजीकरण', 'बिजनेस प्लान', 'फंडिंग'],
      applicationStepsEn: ['FPO Formation', 'Registration', 'Business Plan', 'Funding'],
      applicationStepsMr: ['FPO स्थापना', 'नोंदणी', 'बिझनेस प्लॅन', 'फंडिंग'],
      successRate: 68.5,
      avgProcessingDays: 60,
      beneficiariesCount: 10000,
      budgetAllocated: '₹6,865 करोड़',
      regionalAvailability: ['All States', 'Focus on Aspirational Districts'],
      lastUpdated: '2024-07-15',
      features: ['कलेक्टिव फार्मिंग', 'वैल्यू चेन विकास', 'मार्केट लिंकेज'],
      featuresEn: ['Collective Farming', 'Value Chain Development', 'Market Linkage'],
      featuresMr: ['सामूहिक शेती', 'व्हॅल्यू चेन विकास', 'मार्केट लिंकेज']
    },
    {
      id: '6',
      name: 'सोलर पंप सब्सिडी योजना (KUSUM)',
      nameEn: 'Solar Pump Subsidy Scheme (KUSUM)',
      nameMr: 'सोलर पंप सबसिडी योजना (KUSUM)',
      description: 'किसानों के लिए सौर ऊर्जा संचालित सिंचाई पंप',
      descriptionEn: 'Solar powered irrigation pumps for farmers',
      descriptionMr: 'शेतकऱ्यांसाठी सौर ऊर्जेवर चालणारे सिंचन पंप',
      benefit: '60% सब्सिडी + 30% लोन सहायता',
      benefitEn: '60% subsidy + 30% loan assistance',
      benefitMr: '60% सबसिडी + 30% कर्ज सहाय्य',
      eligibility: ['कृषि भूमि स्वामी', '7.5 HP तक', 'ग्रिड कनेक्शन नहीं'],
      eligibilityEn: ['Agricultural land owner', 'Up to 7.5 HP', 'No grid connection'],
      eligibilityMr: ['शेतजमीन मालक', '7.5 HP पर्यंत', 'ग्रिड कनेक्शन नाही'],
      documents: ['भूमि दस्तावेज', 'आधार कार्ड', 'बैंक पासबुक', 'नो डुएस सर्टिफिकेट'],
      documentsEn: ['Land Documents', 'Aadhaar Card', 'Bank Passbook', 'No Dues Certificate'],
      documentsMr: ['जमीन कागदपत्रे', 'आधार कार्ड', 'बँक पासबुक', 'नो ड्यूज सर्टिफिकेट'],
      applicationStatus: 'available',
      deadline: '2025-06-30',
      category: 'infrastructure',
      matchScore: 82,
      launchDate: '2019-03-08',
      websiteUrl: 'https://kusum.gov.in',
      applicationSteps: ['ऑनलाइन आवेदन', 'साइट सर्वे', 'अप्रूवल', 'इंस्टॉलेशन'],
      applicationStepsEn: ['Online Application', 'Site Survey', 'Approval', 'Installation'],
      applicationStepsMr: ['ऑनलाइन अर्ज', 'साइट सर्व्हे', 'मंजूरी', 'स्थापना'],
      successRate: 71.2,
      avgProcessingDays: 90,
      beneficiariesCount: 280000,
      budgetAllocated: '₹34,422 करोड़',
      regionalAvailability: ['Rajasthan', 'Gujarat', 'Maharashtra', 'MP'],
      lastUpdated: '2024-06-10',
      features: ['ग्रिन एनर्जी', 'कम ऑपरेटिंग कॉस्ट', '25 साल वारंटी'],
      featuresEn: ['Green Energy', 'Low Operating Cost', '25 Years Warranty'],
      featuresMr: ['हरित ऊर्जा', 'कमी ऑपरेटिंग खर्च', '25 वर्ष वॉरंटी']
    },
    {
      id: '7',
      name: 'मुद्रा योजना (कृषि)',
      nameEn: 'MUDRA Scheme (Agriculture)',
      nameMr: 'मुद्रा योजना (कृषी)',
      description: 'कृषि और संबंधित गतिविधियों के लिए माइक्रो क्रेडिट',
      descriptionEn: 'Micro credit for agriculture and allied activities',
      descriptionMr: 'शेती आणि संबंधित क्रियाकलापांसाठी सूक्ष्म पत',
      benefit: '₹50,000 से ₹10 लाख तक लोन',
      benefitEn: 'Loan from ₹50,000 to ₹10 lakh',
      benefitMr: '₹50,000 ते ₹10 लाख पर्यंत कर्ज',
      eligibility: ['18-65 आयु', 'कृषि आधारित व्यवसाय', 'गारंटी नहीं चाहिए'],
      eligibilityEn: ['18-65 age', 'Agriculture based business', 'No collateral required'],
      eligibilityMr: ['18-65 वय', 'शेती आधारित व्यवसाय', 'गहाण नको'],
      documents: ['आधार कार्ड', 'PAN कार्ड', 'बैंक स्टेटमेंट', 'बिजनेस प्लान'],
      documentsEn: ['Aadhaar Card', 'PAN Card', 'Bank Statement', 'Business Plan'],
      documentsMr: ['आधार कार्ड', 'PAN कार्ड', 'बँक स्टेटमेंट', 'बिझनेस प्लॅन'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'loan',
      matchScore: 76,
      launchDate: '2015-04-08',
      websiteUrl: 'https://mudra.org.in',
      applicationSteps: ['बैंक में आवेदन', 'KYC सत्यापन', 'लोन अप्रूवल', 'डिस्बर्समेंट'],
      applicationStepsEn: ['Bank Application', 'KYC Verification', 'Loan Approval', 'Disbursement'],
      applicationStepsMr: ['बँकेत अर्ज', 'KYC पडताळणी', 'कर्ज मंजूरी', 'वितरण'],
      successRate: 84.3,
      avgProcessingDays: 21,
      beneficiariesCount: 2800000,
      budgetAllocated: '₹3,30,000 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-05-25',
      features: ['कोलैटरल फ्री', 'ऑनलाइन ट्रैकिंग', 'फास्ट अप्रूवल'],
      featuresEn: ['Collateral Free', 'Online Tracking', 'Fast Approval'],
      featuresMr: ['गहाण मुक्त', 'ऑनलाइन ट्रॅकिंग', 'जलद मंजूरी']
    },
    {
      id: '8',
      name: 'कृषि यंत्रीकरण योजना',
      nameEn: 'Farm Mechanization Scheme',
      nameMr: 'कृषी यंत्रीकरण योजना',
      description: 'आधुनिक कृषि उपकरणों पर सब्सिडी',
      descriptionEn: 'Subsidy on modern agricultural equipment',
      descriptionMr: 'आधुनिक कृषी उपकरणांवर सबसिडी',
      benefit: '40-50% सब्सिडी (अधिकतम ₹1.25 लाख)',
      benefitEn: '40-50% subsidy (maximum ₹1.25 lakh)',
      benefitMr: '40-50% सबसिडी (कमाल ₹1.25 लाख)',
      eligibility: ['कृषि भूमि 1 हेक्टेयर+', 'पहली बार खरीद', 'आय सीमा ₹2.5 लाख'],
      eligibilityEn: ['Agricultural land 1 hectare+', 'First time purchase', 'Income limit ₹2.5 lakh'],
      eligibilityMr: ['शेतजमीन 1 हेक्टर+', 'पहिल्यांदा खरेदी', 'उत्पन्न मर्यादा ₹2.5 लाख'],
      documents: ['भूमि दस्तावेज', 'आधार कार्ड', 'आय प्रमाण', 'उपकरण कोटेशन'],
      documentsEn: ['Land Documents', 'Aadhaar Card', 'Income Certificate', 'Equipment Quotation'],
      documentsMr: ['जमीन कागदपत्रे', 'आधार कार्ड', 'उत्पन्न प्रमाणपत्र', 'उपकरण कोटेशन'],
      applicationStatus: 'available',
      deadline: '2025-09-30',
      category: 'subsidy',
      matchScore: 73,
      launchDate: '2018-10-15',
      websiteUrl: 'https://agrimachinery.nic.in',
      applicationSteps: ['ऑनलाइन आवेदन', 'सब्सिडी अप्रूवल', 'उपकरण खरीदी', 'सब्सिडी रिलीज'],
      applicationStepsEn: ['Online Application', 'Subsidy Approval', 'Equipment Purchase', 'Subsidy Release'],
      applicationStepsMr: ['ऑनलाइन अर्ज', 'सबसिडी मंजूरी', 'उपकरण खरेदी', 'सबसिडी रिलीझ'],
      successRate: 79.6,
      avgProcessingDays: 45,
      beneficiariesCount: 420000,
      budgetAllocated: '₹3,050 करोड़',
      regionalAvailability: ['All States', 'Priority to Women'],
      lastUpdated: '2024-04-18',
      features: ['CHC सपोर्ट', 'कस्टम हायरिंग', 'ट्रेनिंग प्रोग्राम'],
      featuresEn: ['CHC Support', 'Custom Hiring', 'Training Program'],
      featuresMr: ['CHC सपोर्ट', 'कस्टम हायरिंग', 'प्रशिक्षण कार्यक्रम']
    }
  ];
  res.json(schemes);
});

// Language-specific schemes endpoint
app.get('/api/schemes/:lang', (req: Request, res: Response) => {
  const lang = req.params.lang as 'en' | 'hi' | 'mr';
  
  const schemes: ExtendedScheme[] = [
    {
      id: '1',
      name: 'PM-KISAN योजना',
      nameEn: 'PM-KISAN Scheme',
      nameMr: 'PM-KISAN योजना',
      description: 'छोटे और सीमांत किसानों को प्रति वर्ष ₹6000 की प्रत्यक्ष आर्थिक सहायता',
      descriptionEn: 'Direct financial assistance of ₹6000 per year to small and marginal farmers',
      descriptionMr: 'लहान व सीमांत शेतकऱ्यांना दरवर्षी ₹6000 प्रत्यक्ष आर्थिक मदत',
      benefit: '₹6000 प्रति वर्ष (₹2000 की 3 किस्त)',
      benefitEn: '₹6000 per year (3 installments of ₹2000)',
      benefitMr: 'दरवर्षी ₹6000 (₹2000 च्या 3 हप्त्यात)',
      eligibility: ['2 हेक्टेयर तक कृषि भूमि', 'आधार कार्ड आवश्यक', 'बैंक खाता आवश्यक'],
      eligibilityEn: ['Up to 2 hectares agricultural land', 'Aadhaar card required', 'Bank account required'],
      eligibilityMr: ['2 हेक्टर पर्यंत शेतजमीन', 'आधार कार्ड आवश्यक', 'बँक खाते आवश्यक'],
      documents: ['आधार कार्ड', 'बैंक पासबुक', 'भूमि दस्तावेज'],
      documentsEn: ['Aadhaar Card', 'Bank Passbook', 'Land Documents'],
      documentsMr: ['आधार कार्ड', 'बँक पासबुक', 'जमीन कागदपत्रे'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'direct-benefit',
      matchScore: 95,
      launchDate: '2019-02-24',
      websiteUrl: 'https://pmkisan.gov.in',
      applicationSteps: ['ऑनलाइन पंजीकरण', 'दस्तावेज अपलोड', 'सत्यापन', 'अनुमोदन'],
      applicationStepsEn: ['Online Registration', 'Document Upload', 'Verification', 'Approval'],
      applicationStepsMr: ['ऑनलाइन नोंदणी', 'कागदपत्रे अपलोड', 'पडताळणी', 'मंजूरी'],
      successRate: 92.5,
      avgProcessingDays: 15,
      beneficiariesCount: 11000000,
      budgetAllocated: '₹60,000 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-10-01',
      features: ['प्रत्यक्ष लाभ हस्तांतरण', 'आधार लिंकेज', 'मोबाइल वेरिफिकेशन'],
      featuresEn: ['Direct Benefit Transfer', 'Aadhaar Linkage', 'Mobile Verification'],
      featuresMr: ['प्रत्यक्ष फायदा हस्तांतरण', 'आधार लिंकेज', 'मोबाइल पडताळणी']
    },
    {
      id: '2',
      name: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
      nameEn: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)',
      nameMr: 'प्रधानमंत्री फसल विमा योजना (PMFBY)',
      description: 'प्राकृतिक आपदाओं से होने वाले फसल नुकसान का व्यापक बीमा कवरेज',
      descriptionEn: 'Comprehensive insurance coverage for crop loss due to natural calamities',
      descriptionMr: 'नैसर्गिक आपत्तींमुळे पिकांचे नुकसान झाल्यास सर्वसमावेशक विमा संरक्षण',
      benefit: 'फसल मूल्य का 100% तक मुआवजा',
      benefitEn: 'Up to 100% compensation of crop value',
      benefitMr: 'पीक मूल्याच्या 100% पर्यंत नुकसानभरपाई',
      eligibility: ['सभी किसान', 'अधिसूचित फसलें', 'निर्धारित समय सीमा में आवेदन'],
      eligibilityEn: ['All farmers', 'Notified crops', 'Application within specified timeline'],
      eligibilityMr: ['सर्व शेतकरी', 'अधिसूचित पिके', 'निर्दिष्ट वेळेत अर्ज'],
      documents: ['आधार कार्ड', 'भूमि दस्तावेज', 'बैंक पासबुक', 'बुवाई प्रमाण'],
      documentsEn: ['Aadhaar Card', 'Land Documents', 'Bank Passbook', 'Sowing Certificate'],
      documentsMr: ['आधार कार्ड', 'जमीन कागदपत्रे', 'बँक पासबुक', 'पेरणी प्रमाणपत्र'],
      applicationStatus: 'available',
      deadline: '2025-07-31',
      category: 'insurance',
      matchScore: 88,
      launchDate: '2016-04-13',
      websiteUrl: 'https://pmfby.gov.in',
      applicationSteps: ['बैंक/CSC में आवेदन', 'प्रीमियम भुगतान', 'फसल निरीक्षण', 'क्लेम सेटलमेंट'],
      applicationStepsEn: ['Apply at Bank/CSC', 'Premium Payment', 'Crop Inspection', 'Claim Settlement'],
      applicationStepsMr: ['बँक/CSC मध्ये अर्ज', 'प्रीमियम भरणा', 'पीक तपासणी', 'क्लेम सेटलमेंट'],
      successRate: 78.3,
      avgProcessingDays: 45,
      beneficiariesCount: 5500000,
      budgetAllocated: '₹15,695 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-09-15',
      features: ['व्यापक जोखिम कवरेज', 'कम प्रीमियम', 'तकनीकी सहायता'],
      featuresEn: ['Comprehensive Risk Coverage', 'Low Premium', 'Technology Support'],
      featuresMr: ['सर्वसमावेशक जोखीम संरक्षण', 'कमी प्रीमियम', 'तंत्रज्ञान साहाय्य']
    },
    {
      id: '3',
      name: 'किसान क्रेडिट कार्ड (KCC)',
      nameEn: 'Kisan Credit Card (KCC)',
      nameMr: 'किसान क्रेडिट कार्ड (KCC)',
      description: 'कृषि और संबंधित गतिविधियों के लिए आसान क्रेडिट सुविधा',
      descriptionEn: 'Easy credit facility for agriculture and allied activities',
      descriptionMr: 'शेती आणि संबंधित क्रियाकलापांसाठी सुलभ पत क्रेडिट सुविधा',
      benefit: '₹3 लाख तक 4% ब्याज दर पर लोन',
      benefitEn: 'Loan up to ₹3 lakh at 4% interest rate',
      benefitMr: '4% व्याजदराने ₹3 लाख पर्यंत कर्ज',
      eligibility: ['कृषि भूमि का मालिक', 'बैंक खाता', 'CIBIL स्कोर 650+'],
      eligibilityEn: ['Agricultural land owner', 'Bank account', 'CIBIL score 650+'],
      eligibilityMr: ['शेतजमीन मालक', 'बँक खाते', 'CIBIL स्कोअर 650+'],
      documents: ['आधार कार्ड', 'भूमि दस्तावेज', 'आय प्रमाण', 'बैंक स्टेटमेंट'],
      documentsEn: ['Aadhaar Card', 'Land Documents', 'Income Certificate', 'Bank Statement'],
      documentsMr: ['आधार कार्ड', 'जमीन कागदपत्रे', 'उत्पन्न प्रमाणपत्र', 'बँक स्टेटमेंट'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'loan',
      matchScore: 85,
      launchDate: '1998-08-01',
      websiteUrl: 'https://kcc.gov.in',
      applicationSteps: ['बैंक में आवेदन', 'दस्तावेज सत्यापन', 'क्रेडिट मूल्यांकन', 'कार्ड जारी'],
      applicationStepsEn: ['Bank Application', 'Document Verification', 'Credit Assessment', 'Card Issue'],
      applicationStepsMr: ['बँकेत अर्ज', 'कागदपत्रांची पडताळणी', 'क्रेडिट मूल्यांकन', 'कार्ड जारी'],
      successRate: 82.7,
      avgProcessingDays: 30,
      beneficiariesCount: 8900000,
      budgetAllocated: '₹75,000 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-08-20',
      features: ['डिजिटल KCC', 'RuPay डेबिट कार्ड', 'मोबाइल बैंकिंग'],
      featuresEn: ['Digital KCC', 'RuPay Debit Card', 'Mobile Banking'],
      featuresMr: ['डिजिटल KCC', 'RuPay डेबिट कार्ड', 'मोबाइल बँकिंग']
    },
    {
      id: '4',
      name: 'e-NAM (राष्ट्रीय कृषि बाजार)',
      nameEn: 'e-NAM (National Agriculture Market)',
      nameMr: 'e-NAM (राष्ट्रीय कृषि बाजार)',
      description: 'ऑनलाइन कृषि उत्पाद विपणन मंच',
      descriptionEn: 'Online agricultural produce marketing platform',
      descriptionMr: 'ऑनलाइन कृषी उत्पादन विपणन प्लॅटफॉर्म',
      benefit: 'बेहतर मूल्य प्राप्ति, पारदर्शी नीलामी',
      benefitEn: 'Better price realization, transparent auction',
      benefitMr: 'चांगले दर मिळणे, पारदर्शक लिलाव',
      eligibility: ['पंजीकृत किसान', 'FPO सदस्य', 'कृषि उत्पादक'],
      eligibilityEn: ['Registered farmer', 'FPO member', 'Agricultural producer'],
      eligibilityMr: ['नोंदणीकृत शेतकरी', 'FPO सदस्य', 'कृषी उत्पादक'],
      documents: ['आधार कार्ड', 'बैंक खाता', 'मोबाइल नंबर', 'भूमि दस्तावेज'],
      documentsEn: ['Aadhaar Card', 'Bank Account', 'Mobile Number', 'Land Documents'],
      documentsMr: ['आधार कार्ड', 'बँक खाते', 'मोबाइल नंबर', 'जमीन कागदपत्रे'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'digital',
      matchScore: 80,
      launchDate: '2016-04-14',
      websiteUrl: 'https://enam.gov.in',
      applicationSteps: ['ऑनलाइन पंजीकरण', 'दस्तावेज अपलोड', 'सत्यापन', 'ट्रेडिंग शुरू'],
      applicationStepsEn: ['Online Registration', 'Document Upload', 'Verification', 'Start Trading'],
      applicationStepsMr: ['ऑनलाइन नोंदणी', 'कागदपत्रे अपलोड', 'पडताळणी', 'व्यापार सुरू'],
      successRate: 75.8,
      avgProcessingDays: 7,
      beneficiariesCount: 1800000,
      budgetAllocated: '₹200 करोड़',
      regionalAvailability: ['585 Markets', '18 States'],
      lastUpdated: '2024-09-30',
      features: ['मोबाइल ऐप', 'QR कोड भुगतान', 'मार्केट इंटेलिजेंस'],
      featuresEn: ['Mobile App', 'QR Code Payment', 'Market Intelligence'],
      featuresMr: ['मोबाइल अॅप', 'QR कोड पेमेंट', 'मार्केट इंटेलिजन्स']
    },
    {
      id: '5',
      name: 'प्रधानमंत्री किसान FPO योजना',
      nameEn: 'PM Farmer Producer Organization Scheme',
      nameMr: 'प्रधानमंत्री शेतकरी उत्पादक संघटना योजना',
      description: 'किसान उत्पादक संगठनों को प्रोत्साहन और वित्तीय सहायता',
      descriptionEn: 'Promotion and financial support to Farmer Producer Organizations',
      descriptionMr: 'शेतकरी उत्पादक संघटनांना प्रोत्साहन आणि आर्थिक मदत',
      benefit: '₹15 लाख तक वित्तीय सहायता',
      benefitEn: 'Financial assistance up to ₹15 lakh',
      benefitMr: '₹15 लाख पर्यंत आर्थिक सहाय्य',
      eligibility: ['न्यूनतम 300 सदस्य', 'कृषि उत्पादन', 'पंजीकृत FPO'],
      eligibilityEn: ['Minimum 300 members', 'Agricultural production', 'Registered FPO'],
      eligibilityMr: ['किमान 300 सदस्य', 'कृषी उत्पादन', 'नोंदणीकृत FPO'],
      documents: ['FPO पंजीकरण', 'सदस्य सूची', 'बैंक खाता', 'बिजनेस प्लान'],
      documentsEn: ['FPO Registration', 'Member List', 'Bank Account', 'Business Plan'],
      documentsMr: ['FPO नोंदणी', 'सदस्य यादी', 'बँक खाते', 'बिझनेस प्लॅन'],
      applicationStatus: 'available',
      deadline: '2025-08-31',
      category: 'subsidy',
      matchScore: 78,
      launchDate: '2020-02-29',
      websiteUrl: 'https://pmfpo.gov.in',
      applicationSteps: ['FPO गठन', 'पंजीकरण', 'बिजनेस प्लान', 'फंडिंग'],
      applicationStepsEn: ['FPO Formation', 'Registration', 'Business Plan', 'Funding'],
      applicationStepsMr: ['FPO स्थापना', 'नोंदणी', 'बिझनेस प्लॅन', 'फंडिंग'],
      successRate: 68.5,
      avgProcessingDays: 60,
      beneficiariesCount: 10000,
      budgetAllocated: '₹6,865 करोड़',
      regionalAvailability: ['All States', 'Focus on Aspirational Districts'],
      lastUpdated: '2024-07-15',
      features: ['कलेक्टिव फार्मिंग', 'वैल्यू चेन विकास', 'मार्केट लिंकेज'],
      featuresEn: ['Collective Farming', 'Value Chain Development', 'Market Linkage'],
      featuresMr: ['सामूहिक शेती', 'व्हॅल्यू चेन विकास', 'मार्केट लिंकेज']
    },
    {
      id: '6',
      name: 'सोलर पंप सब्सिडी योजना (KUSUM)',
      nameEn: 'Solar Pump Subsidy Scheme (KUSUM)',
      nameMr: 'सोलर पंप सबसिडी योजना (KUSUM)',
      description: 'किसानों के लिए सौर ऊर्जा संचालित सिंचाई पंप',
      descriptionEn: 'Solar powered irrigation pumps for farmers',
      descriptionMr: 'शेतकऱ्यांसाठी सौर ऊर्जेवर चालणारे सिंचन पंप',
      benefit: '60% सब्सिडी + 30% लोन सहायता',
      benefitEn: '60% subsidy + 30% loan assistance',
      benefitMr: '60% सबसिडी + 30% कर्ज सहाय्य',
      eligibility: ['कृषि भूमि स्वामी', '7.5 HP तक', 'ग्रिड कनेक्शन नहीं'],
      eligibilityEn: ['Agricultural land owner', 'Up to 7.5 HP', 'No grid connection'],
      eligibilityMr: ['शेतजमीन मालक', '7.5 HP पर्यंत', 'ग्रिड कनेक्शन नाही'],
      documents: ['भूमि दस्तावेज', 'आधार कार्ड', 'बैंक पासबुक', 'नो डुएस सर्टिफिकेट'],
      documentsEn: ['Land Documents', 'Aadhaar Card', 'Bank Passbook', 'No Dues Certificate'],
      documentsMr: ['जमीन कागदपत्रे', 'आधार कार्ड', 'बँक पासबुक', 'नो ड्यूज सर्टिफिकेट'],
      applicationStatus: 'available',
      deadline: '2025-06-30',
      category: 'infrastructure',
      matchScore: 82,
      launchDate: '2019-03-08',
      websiteUrl: 'https://kusum.gov.in',
      applicationSteps: ['ऑनलाइन आवेदन', 'साइट सर्वे', 'अप्रूवल', 'इंस्टॉलेशन'],
      applicationStepsEn: ['Online Application', 'Site Survey', 'Approval', 'Installation'],
      applicationStepsMr: ['ऑनलाइन अर्ज', 'साइट सर्व्हे', 'मंजूरी', 'स्थापना'],
      successRate: 71.2,
      avgProcessingDays: 90,
      beneficiariesCount: 280000,
      budgetAllocated: '₹34,422 करोड़',
      regionalAvailability: ['Rajasthan', 'Gujarat', 'Maharashtra', 'MP'],
      lastUpdated: '2024-06-10',
      features: ['ग्रिन एनर्जी', 'कम ऑपरेटिंग कॉस्ट', '25 साल वारंटी'],
      featuresEn: ['Green Energy', 'Low Operating Cost', '25 Years Warranty'],
      featuresMr: ['हरित ऊर्जा', 'कमी ऑपरेटिंग खर्च', '25 वर्ष वॉरंटी']
    },
    {
      id: '7',
      name: 'मुद्रा योजना (कृषि)',
      nameEn: 'MUDRA Scheme (Agriculture)',
      nameMr: 'मुद्रा योजना (कृषी)',
      description: 'कृषि और संबंधित गतिविधियों के लिए माइक्रो क्रेडिट',
      descriptionEn: 'Micro credit for agriculture and allied activities',
      descriptionMr: 'शेती आणि संबंधित क्रियाकलापांसाठी सूक्ष्म पत',
      benefit: '₹50,000 से ₹10 लाख तक लोन',
      benefitEn: 'Loan from ₹50,000 to ₹10 lakh',
      benefitMr: '₹50,000 ते ₹10 लाख पर्यंत कर्ज',
      eligibility: ['18-65 आयु', 'कृषि आधारित व्यवसाय', 'गारंटी नहीं चाहिए'],
      eligibilityEn: ['18-65 age', 'Agriculture based business', 'No collateral required'],
      eligibilityMr: ['18-65 वय', 'शेती आधारित व्यवसाय', 'गहाण नको'],
      documents: ['आधार कार्ड', 'PAN कार्ड', 'बैंक स्टेटमेंट', 'बिजनेस प्लान'],
      documentsEn: ['Aadhaar Card', 'PAN Card', 'Bank Statement', 'Business Plan'],
      documentsMr: ['आधार कार्ड', 'PAN कार्ड', 'बँक स्टेटमेंट', 'बिझनेस प्लॅन'],
      applicationStatus: 'available',
      deadline: '2025-12-31',
      category: 'loan',
      matchScore: 76,
      launchDate: '2015-04-08',
      websiteUrl: 'https://mudra.org.in',
      applicationSteps: ['बैंक में आवेदन', 'KYC सत्यापन', 'लोन अप्रूवल', 'डिस्बर्समेंट'],
      applicationStepsEn: ['Bank Application', 'KYC Verification', 'Loan Approval', 'Disbursement'],
      applicationStepsMr: ['बँकेत अर्ज', 'KYC पडताळणी', 'कर्ज मंजूरी', 'वितरण'],
      successRate: 84.3,
      avgProcessingDays: 21,
      beneficiariesCount: 2800000,
      budgetAllocated: '₹3,30,000 करोड़',
      regionalAvailability: ['All States', 'All Districts'],
      lastUpdated: '2024-05-25',
      features: ['कोलैटरल फ्री', 'ऑनलाइन ट्रैकिंग', 'फास्ट अप्रूवल'],
      featuresEn: ['Collateral Free', 'Online Tracking', 'Fast Approval'],
      featuresMr: ['गहाण मुक्त', 'ऑनलाइन ट्रॅकिंग', 'जलद मंजूरी']
    },
    {
      id: '8',
      name: 'कृषि यंत्रीकरण योजना',
      nameEn: 'Farm Mechanization Scheme',
      nameMr: 'कृषी यंत्रीकरण योजना',
      description: 'आधुनिक कृषि उपकरणों पर सब्सिडी',
      descriptionEn: 'Subsidy on modern agricultural equipment',
      descriptionMr: 'आधुनिक कृषी उपकरणांवर सबसिडी',
      benefit: '40-50% सब्सिडी (अधिकतम ₹1.25 लाख)',
      benefitEn: '40-50% subsidy (maximum ₹1.25 lakh)',
      benefitMr: '40-50% सबसिडी (कमाल ₹1.25 लाख)',
      eligibility: ['कृषि भूमि 1 हेक्टेयर+', 'पहली बार खरीद', 'आय सीमा ₹2.5 लाख'],
      eligibilityEn: ['Agricultural land 1 hectare+', 'First time purchase', 'Income limit ₹2.5 lakh'],
      eligibilityMr: ['शेतजमीन 1 हेक्टर+', 'पहिल्यांदा खरेदी', 'उत्पन्न मर्यादा ₹2.5 लाख'],
      documents: ['भूमि दस्तावेज', 'आधार कार्ड', 'आय प्रमाण', 'उपकरण कोटेशन'],
      documentsEn: ['Land Documents', 'Aadhaar Card', 'Income Certificate', 'Equipment Quotation'],
      documentsMr: ['जमीन कागदपत्रे', 'आधार कार्ड', 'उत्पन्न प्रमाणपत्र', 'उपकरण कोटेशन'],
      applicationStatus: 'available',
      deadline: '2025-09-30',
      category: 'subsidy',
      matchScore: 73,
      launchDate: '2018-10-15',
      websiteUrl: 'https://agrimachinery.nic.in',
      applicationSteps: ['ऑनलाइन आवेदन', 'सब्सिडी अप्रूवल', 'उपकरण खरीदी', 'सब्सिडी रिलीज'],
      applicationStepsEn: ['Online Application', 'Subsidy Approval', 'Equipment Purchase', 'Subsidy Release'],
      applicationStepsMr: ['ऑनलाइन अर्ज', 'सबसिडी मंजूरी', 'उपकरण खरेदी', 'सबसिडी रिलीझ'],
      successRate: 79.6,
      avgProcessingDays: 45,
      beneficiariesCount: 420000,
      budgetAllocated: '₹3,050 करोड़',
      regionalAvailability: ['All States', 'Priority to Women'],
      lastUpdated: '2024-04-18',
      features: ['CHC सपोर्ट', 'कस्टम हायरिंग', 'ट्रेनिंग प्रोग्राम'],
      featuresEn: ['CHC Support', 'Custom Hiring', 'Training Program'],
      featuresMr: ['CHC सपोर्ट', 'कस्टम हायरिंग', 'प्रशिक्षण कार्यक्रम']
    }
  ];

  // Transform schemes based on language preference
  const localizedSchemes = schemes.map(scheme => {
    if (lang === 'en') {
      return {
        ...scheme,
        name: scheme.nameEn,
        description: scheme.descriptionEn,
        benefit: scheme.benefitEn,
        eligibility: scheme.eligibilityEn,
        documents: scheme.documentsEn,
        applicationSteps: scheme.applicationStepsEn,
        features: scheme.featuresEn
      };
    } else if (lang === 'mr') {
      return {
        ...scheme,
        name: scheme.nameMr,
        description: scheme.descriptionMr,
        benefit: scheme.benefitMr,
        eligibility: scheme.eligibilityMr,
        documents: scheme.documentsMr,
        applicationSteps: scheme.applicationStepsMr,
        features: scheme.featuresMr
      };
    } else {
      // Default to Hindi
      return {
        ...scheme,
        name: scheme.name,
        description: scheme.description,
        benefit: scheme.benefit,
        eligibility: scheme.eligibility,
        documents: scheme.documents,
        applicationSteps: scheme.applicationSteps,
        features: scheme.features
      };
    }
  });

  res.json(localizedSchemes);
});

// Government scheme official links and additional resources
app.get('/api/scheme-links', (_req: Request, res: Response) => {
  const schemeLinks = [
    {
      id: '1',
      schemeName: 'PM-KISAN',
      officialWebsite: 'https://pmkisan.gov.in/',
      applicationPortal: 'https://pmkisan.gov.in/RegistrationForm.aspx',
      statusCheck: 'https://pmkisan.gov.in/BeneficiaryStatus.aspx',
      helpline: '155261 / 011-24300606',
      email: 'pmkisan-ict@gov.in',
      documents: 'https://pmkisan.gov.in/Documents.aspx',
      guidelines: 'https://pmkisan.gov.in/Guidelines.aspx'
    },
    {
      id: '2',
      schemeName: 'PMFBY',
      officialWebsite: 'https://pmfby.gov.in/',
      applicationPortal: 'https://crop-insurance.gov.in/',
      statusCheck: 'https://pmfby.gov.in/policystatus',
      helpline: '1800-200-7710',
      email: 'support@pmfby.gov.in',
      documents: 'https://pmfby.gov.in/documents',
      guidelines: 'https://pmfby.gov.in/guidelines'
    },
    {
      id: '3',
      schemeName: 'KCC',
      officialWebsite: 'https://www.nabard.org/auth/writereaddata/tender/1608180164KCC.pdf',
      applicationPortal: 'https://www.digitalindiacorp.in/kisan-credit-card/',
      statusCheck: 'https://pmkisan.gov.in/KCCLink.aspx',
      helpline: '1800-180-1551',
      email: 'kcc-support@rbi.org.in',
      documents: 'https://www.rbi.org.in/Scripts/FAQView.aspx?Id=1248',
      guidelines: 'https://www.rbi.org.in/Scripts/BS_ViewMasCirculardetails.aspx?id=11816'
    },
    {
      id: '4',
      schemeName: 'e-NAM',
      officialWebsite: 'https://enam.gov.in/',
      applicationPortal: 'https://enam.gov.in/web/registration',
      statusCheck: 'https://enam.gov.in/web/fporegistration/home',
      helpline: '1800-270-0224',
      email: 'enamhelpdesk@gmail.com',
      documents: 'https://enam.gov.in/web/resources/documents',
      guidelines: 'https://enam.gov.in/web/resources/guidelines'
    },
    {
      id: '5',
      schemeName: 'PM-FPO',
      officialWebsite: 'https://sfac.in/FPO',
      applicationPortal: 'https://farmer.gov.in/',
      statusCheck: 'https://sfac.in/FPO/Data/Portal/Default.aspx',
      helpline: '1800-180-1551',
      email: 'fpo-cell-sfac@gov.in',
      documents: 'https://sfac.in/Content/Data/DocumentRepository/FPODOCS.aspx',
      guidelines: 'https://sfac.in/FPO/Data/Portal/Guidelines.aspx'
    },
    {
      id: '6',
      schemeName: 'KUSUM',
      officialWebsite: 'https://mnre.gov.in/solar/schemes/',
      applicationPortal: 'https://kusumyojana.com/',
      statusCheck: 'https://www.mnre.gov.in/kusum-application-status',
      helpline: '1800-180-3333',
      email: 'kusum-scheme@mnre.gov.in',
      documents: 'https://mnre.gov.in/img/documents/uploads/file_f-1585797108787.pdf',
      guidelines: 'https://mnre.gov.in/img/documents/uploads/file_f-1679548130660.pdf'
    },
    {
      id: '7',
      schemeName: 'MUDRA',
      officialWebsite: 'https://www.mudra.org.in/',
      applicationPortal: 'https://www.mudra.org.in/Default/Download/2/23',
      statusCheck: 'https://www.mudra.org.in/Default/UserControl',
      helpline: '1800-180-7777',
      email: 'mudra@sidbi.in',
      documents: 'https://www.mudra.org.in/Default/Download/2/23',
      guidelines: 'https://www.mudra.org.in/Default/Download/2/24'
    },
    {
      id: '8',
      schemeName: 'Farm Mechanization',
      officialWebsite: 'https://agrimachinery.nic.in/',
      applicationPortal: 'https://agrimachinery.nic.in/ApplicationForm.aspx',
      statusCheck: 'https://agrimachinery.nic.in/ApplicationStatus.aspx',
      helpline: '1800-180-1551',
      email: 'mechanization@dacnet.nic.in',
      documents: 'https://agrimachinery.nic.in/Downloads.aspx',
      guidelines: 'https://agrimachinery.nic.in/Guidelines.aspx'
    }
  ];
  
  res.json(schemeLinks);
});

// Scheme application endpoint
app.post('/api/schemes/apply', async (req: Request, res: Response) => {
  try {
    const { schemeId, applicationData, userId } = req.body;

    // Validate required fields
    if (!schemeId || !applicationData || !userId) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['schemeId', 'applicationData', 'userId']
      });
    }

    // Find the scheme
    const scheme = schemes.find(s => s.id === schemeId);
    if (!scheme) {
      return res.status(404).json({ error: 'Scheme not found' });
    }

    // Create application record
    const application = {
      id: Math.random().toString(36).substr(2, 9),
      schemeId,
      schemeName: scheme.name,
      userId,
      applicationData,
      status: 'submitted',
      submissionDate: new Date().toISOString(),
      applicationNumber: `APP${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
      estimatedProcessingDays: scheme.avgProcessingDays || 30,
      expectedCompletionDate: new Date(Date.now() + (scheme.avgProcessingDays || 30) * 24 * 60 * 60 * 1000).toISOString()
    };

    // Here you would typically save to database
    // For now, we'll simulate a successful submission
    console.log('Scheme application submitted:', application);

    res.json({
      success: true,
      message: 'Application submitted successfully',
      application: {
        id: application.id,
        applicationNumber: application.applicationNumber,
        status: application.status,
        submissionDate: application.submissionDate,
        estimatedProcessingDays: application.estimatedProcessingDays,
        expectedCompletionDate: application.expectedCompletionDate
      },
      nextSteps: [
        'Document verification will begin within 2-3 business days',
        'You will receive SMS/email updates on your application status',
        'Keep your application number for future reference',
        'Visit the official portal to track your application status'
      ]
    });

  } catch (error) {
    console.error('Scheme application error:', error);
    res.status(500).json({
      error: 'Application submission failed',
      message: 'Please try again later or contact support'
    });
  }
});

// Market prices proxy (uses server-side API key)
const MARKET_API_URL = process.env.MARKET_API_URL || process.env.AGMARK_API_URL || '';
const MARKET_API_KEY = process.env.MARKET_API_KEY || process.env.AGMARK_API_KEY || '';

app.get('/api/market/prices', async (req: Request, res: Response) => {
  try {
    if (!MARKET_API_URL || !MARKET_API_KEY) {
      return res.status(501).json({ error: 'Market API not configured' });
    }

    const url = new URL(MARKET_API_URL);
    // Forward all query params including nested like filters[State]
    for (const [key, value] of Object.entries(req.query)) {
      if (typeof value === 'string') url.searchParams.set(key, value);
    }
    // Inject API key as query param if not provided
    if (!url.searchParams.has('api-key')) url.searchParams.set('api-key', MARKET_API_KEY);
    // Default format=json unless specified (xml,csv supported)
    if (!url.searchParams.has('format')) url.searchParams.set('format', 'json');
    // Use higher default limit to get more data, but respect client's limit if provided
    if (!url.searchParams.has('limit')) url.searchParams.set('limit', '1000');

    const fmt = url.searchParams.get('format') || 'json';
    const accept = fmt === 'xml' ? 'application/xml' : fmt === 'csv' ? 'text/csv' : 'application/json';

    const response = await fetch(url.toString(), { headers: { Accept: accept } });

    if (!response.ok) {
      const text = await response.text().catch(() => '');
      return res.status(response.status).json({ error: 'Upstream error', detail: text.slice(0, 500) });
    }
    if (accept === 'application/xml' || accept === 'text/csv') {
      const text = await response.text();
      res.setHeader('Content-Type', accept);
      return res.status(200).send(text);
    } else {
      const data = await response.json();
      return res.json(data);
    }
  } catch (error) {
    console.error('Market prices proxy error:', error);
    return res.status(500).json({ error: 'Failed to fetch market prices' });
  }
});

// Error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// AI providers
const AI_PROVIDER = (process.env.AI_PROVIDER || 'openai').toLowerCase();
const openaiKey = process.env.OPENAI_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
// Allow overriding the Gemini model via env var. Default to a broadly supported model name.
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-pro';
const openai = openaiKey ? new OpenAI({ apiKey: openaiKey }) : null;
const genAI = geminiKey ? new GoogleGenerativeAI(geminiKey) : null;

// Runtime cache for the model we will actually use (may be updated after discovery)
let GEMINI_RUNTIME_MODEL = GEMINI_MODEL;

async function listAvailableGeminiModels(): Promise<string[]> {
  if (!genAI) return [];
  try {
    console.log('Fetching available Gemini models...');
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + geminiKey);
    if (!response.ok) {
      console.error('Failed to fetch models:', response.status, response.statusText);
      return [];
    }
    
    const data = await response.json();
    const models = data.models || [];
    const availableModels = models
      .filter((model: any) => 
        model.supportedGenerationMethods && 
        model.supportedGenerationMethods.includes('generateContent')
      )
      .map((model: any) => model.name.replace('models/', ''))
      .filter((name: string) => name.includes('gemini'));
    
    console.log('Available Gemini models:', availableModels);
    return availableModels;
  } catch (err) {
    console.error('Error fetching available models:', err);
    return [];
  }
}

async function findSupportedGeminiModel(): Promise<string | null> {
  if (!genAI) return null;
  try {
    console.log('Testing Gemini models to find a working one...');
    
    // First try to get actual available models
    const availableModels = await listAvailableGeminiModels();
    
    let modelsToTest: string[] = [];
    if (availableModels.length > 0) {
      console.log('Using models from API listing...');
      modelsToTest = availableModels;
    } else {
      console.log('Falling back to current model names...');
      // Fallback to current Gemini model names based on 2024/2025 API
      modelsToTest = [
        'gemini-2.5-flash',
        'gemini-2.5-pro',
        'gemini-2.0-flash',
        'gemini-flash-latest',
        'gemini-pro-latest',
        'gemini-2.5-flash-lite',
        'gemini-2.0-flash-001',
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro',
        'models/gemini-2.5-flash',
        'models/gemini-2.5-pro',
        'models/gemini-2.0-flash',
        'models/gemini-flash-latest',
        'models/gemini-pro-latest'
      ];
    }
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing model: ${modelName}`);
        // Actually test the model with a simple request
        const testModel = genAI.getGenerativeModel({ model: modelName });
        const result = await testModel.generateContent('test');
        if (result && result.response) {
          console.log('Found working Gemini model:', modelName);
          return modelName;
        }
      } catch (err: any) {
        console.log(`Model ${modelName} failed:`, err?.message || err);
        // Continue to next model
        continue;
      }
    }
    
    console.warn('No suitable Gemini model found from tested models');
    return null;
  } catch (err) {
    console.warn('Failed to discover Gemini models:', err);
    return null;
  }
}

async function getGeminiModelInstance() {
  if (!genAI) throw new Error('Gemini not configured');

  // Try runtime-configured model first, but only if we haven't already discovered it's broken
  if (GEMINI_RUNTIME_MODEL === GEMINI_MODEL) {
    try {
      console.log(`Trying configured model: ${GEMINI_RUNTIME_MODEL}`);
      const model = genAI.getGenerativeModel({ model: GEMINI_RUNTIME_MODEL });
      console.log(`Using configured model ${GEMINI_RUNTIME_MODEL}`);
      return model;
    } catch (err: any) {
      console.warn(`Configured Gemini model ${GEMINI_RUNTIME_MODEL} failed to instantiate:`, err?.message || err);
      
      // If the configured model fails, try to find a working one
      console.log('404 Model Not Found - failing immediately to try fallback');
      const workingModel = await findSupportedGeminiModel();
      if (workingModel) {
        console.log(`Switching to discovered working model: ${workingModel}`);
        GEMINI_RUNTIME_MODEL = workingModel;
        return genAI.getGenerativeModel({ model: workingModel });
      }
      
      throw new Error(`No working Gemini model found. Error: ${err?.message || err}`);
    }
  } else {
    // We already discovered a working model, use it
    try {
      return genAI.getGenerativeModel({ model: GEMINI_RUNTIME_MODEL });
    } catch (err: any) {
      console.error('Previously working Gemini model now fails:', err?.message || err);
      throw err;
    }
  }
}

// Circuit breaker for AI services
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  
  constructor(
    private readonly maxFailures = 5,
    private readonly resetTimeout = 30000 // 30 seconds
  ) {}
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN - service temporarily unavailable');
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }
  
  private onFailure() {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
    }
  }
  
  getState() {
    return {
      state: this.state,
      failures: this.failures,
      lastFailureTime: this.lastFailureTime
    };
  }
}

// Retry utility with exponential backoff
async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries = 1, // Reduced from 2 to 1 for faster fallback when models don't exist
  initialDelay = 500 // Reduced from 1000 to 500ms
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      // For 404 errors (model not found), don't retry - fail immediately
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 404) {
          console.log(`404 Model Not Found - failing immediately to try fallback`);
          throw lastError;
        }
        if (status === 503 && attempt >= 1) {
          console.log(`503 Service Unavailable - failing fast after ${attempt + 1} attempts to use fallback`);
          throw lastError;
        }
        if (status && status !== 503 && status !== 502 && status !== 504 && status !== 429) {
          throw error; // Don't retry 4xx errors (except 429) or other non-server errors
        }
      }
      
      // For "No working Gemini model found" errors, don't retry
      if (lastError.message.includes('No working Gemini model found')) {
        console.log('No working Gemini model found - failing immediately to try fallback');
        throw lastError;
      }
      
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      const delay = initialDelay * Math.pow(1.5, attempt) + Math.random() * 500; // Reduced backoff multiplier
      console.log(`AI request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${Math.round(delay)}ms...`, {
        error: lastError.message,
        status: (lastError as any).status || 'unknown'
      });
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
}

// Circuit breakers for AI services
const geminiCircuitBreaker = new CircuitBreaker();
const openaiCircuitBreaker = new CircuitBreaker();

// Fallback knowledge base for common crop diseases
const cropDiseaseKnowledgeBase = {
  hi: [
    {
      symptoms: ['पत्तियों पर भूरे धब्बे', 'पत्तियों का पीला होना', 'धान की फसल'],
      diagnosis: '**धान का भूरा धब्बा रोग (Brown Spot)**\n\n**लक्षण:**\n- पत्तियों पर छोटे भूरे धब्बे\n- धब्बे धीरे-धीरे बड़े होते जाते हैं\n- पत्तियां पीली पड़कर सूख जाती हैं\n\n**उपचार:**\n- प्रोपिकोनाज़ोल (Tilt 25 EC) 1ml प्रति लीटर पानी में मिलाकर स्प्रे करें\n- 15 दिन बाद दोबारा स्प्रे करें\n- मैंकोज़ेब (Dithane M-45) 2.5g प्रति लीटर का भी उपयोग कर सकते हैं\n\n**बचाव:**\n- खेत में पानी का जमाव न होने दें\n- संतुलित खाद का प्रयोग करें\n- प्रमाणित बीज का उपयोग करें\n- उचित दूरी पर बुआई करें'
    },
    {
      symptoms: ['टमाटर', 'पत्तियों पर काले धब्बे', 'फल सड़ना'],
      diagnosis: '**टमाटर का पछेता झुलसा (Late Blight)**\n\n**लक्षण:**\n- पत्तियों पर काले या भूरे धब्बे\n- फलों पर सफेद फफूंद\n- पौधे का तेजी से मुरझाना\n\n**उपचार:**\n- मैंकोज़ेब (Dithane M-45) 2.5g प्रति लीटर पानी में स्प्रे करें\n- कॉपर ऑक्सीक्लोराइड 3g प्रति लीटर का उपयोग करें\n- 7-10 दिन के अंतराल पर स्प्रे करते रहें\n\n**बचाव:**\n- हवा का अच्छा प्रवाह रखें\n- पत्तियों पर पानी न डालें\n- संक्रमित पत्तियों को तुरंत हटा दें\n- प्रतिरोधी किस्मों का चुनाव करें'
    }
  ],
  mr: [
    {
      symptoms: ['पानावर तपकिरी ठिपके', 'पानांचा पिवळसर होणे', 'भाताचे पीक'],
      diagnosis: '**भाताचा तपकिरी ठिपका रोग (Brown Spot)**\n\n**लक्षणे:**\n- पानांवर लहान तपकिरी ठिपके\n- ठिपके हळूहळू मोठे होत जातात\n- पाने पिवळी पडून सुकतात\n\n**उपचार:**\n- प्रोपिकोनाझोल (Tilt 25 EC) 1ml प्रति लिटर पाण्यात मिसळून फवारणी करा\n- 15 दिवसांनी पुन्हा फवारणी करा\n- मँकोझेब (Dithane M-45) 2.5g प्रति लिटर देखील वापरू शकता\n\n**बचाव:**\n- शेतात पाण्याचा साठा होऊ देऊ नका\n- संतुलित खताचा वापर करा\n- प्रमाणित बियाणे वापरा\n- योग्य अंतरावर पेरणी करा'
    }
  ],
  en: [
    {
      symptoms: ['brown spots on leaves', 'yellowing leaves', 'rice crop'],
      diagnosis: '**Rice Brown Spot Disease**\n\n**Symptoms:**\n- Small brown spots on leaves\n- Spots gradually enlarge\n- Leaves turn yellow and dry\n\n**Treatment:**\n- Spray Propiconazole (Tilt 25 EC) 1ml per liter water\n- Repeat spray after 15 days\n- Alternatively use Mancozeb (Dithane M-45) 2.5g per liter\n\n**Prevention:**\n- Avoid waterlogging in fields\n- Use balanced fertilizers\n- Use certified seeds\n- Maintain proper spacing during sowing'
    }
  ]
} as const;

function getFallbackDiagnosis(language: 'hi' | 'mr' | 'en' = 'hi'): string {
  const knowledge = cropDiseaseKnowledgeBase[language] || cropDiseaseKnowledgeBase.hi;
  const randomEntry = knowledge[Math.floor(Math.random() * knowledge.length)];
  return randomEntry.diagnosis;
}

// Log AI configuration status
console.log('AI Configuration:');
console.log(`- Provider: ${AI_PROVIDER}`);
console.log(`- OpenAI: ${openai ? 'Configured' : 'Not configured (missing OPENAI_API_KEY)'}`);
console.log(`- Gemini: ${genAI ? 'Configured' : 'Not configured (missing GEMINI_API_KEY)'}`);
console.log(`- Gemini model: ${genAI ? GEMINI_MODEL : '(n/a)'} `);

// Root route
app.get('/', (_req: Request, res: Response) => {
  res.json({ 
    message: 'Kisan Sathi API Server', 
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      ai: {
        chat: '/api/ai/chat',
        'analyze-image': '/api/ai/analyze-image'
      },
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login',
        me: '/api/auth/me'
      },
      alerts: '/api/alerts',
      prices: '/api/prices',
      schemes: '/api/schemes'
    }
  });
});

app.post('/api/ai/chat', async (req: Request, res: Response) => {
  try {
    const { message, systemPrompt } = req.body as { message?: unknown; systemPrompt?: unknown };
    if (typeof message !== 'string' || (systemPrompt !== undefined && typeof systemPrompt !== 'string')) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (AI_PROVIDER === 'gemini') {
      if (!genAI) {
        console.warn('Gemini AI not configured - missing GEMINI_API_KEY');
        return res.status(503).json({ 
          error: 'AI service not configured', 
          provider: 'gemini',
          message: 'GEMINI_API_KEY environment variable not set'
        });
      }

      try {
        const result = await geminiCircuitBreaker.execute(async () => {
          return await retryWithBackoff(async () => {
            const model = await getGeminiModelInstance();
            
            // Enhanced system prompt for agricultural guidance
            const defaultSystemPrompt = "You are an expert agricultural advisor helping farmers. Please provide clear, step-by-step instructions using bullet points or numbered lists. Use professional but simple language that farmers can easily understand. Provide practical, actionable advice based on modern farming practices. Format your response with clear headings using bold text, bullet points for lists, and numbered steps for procedures. Include timing information when relevant. Mention both traditional and modern techniques when applicable. Add safety precautions when dealing with chemicals or equipment. Keep responses comprehensive but concise, focusing on practical implementation.";

            const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
            
            const parts = [
              { text: finalSystemPrompt },
              { text: message }
            ];
            const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
            return result.response.text();
          });
        });

        return res.json({ text: result });
      } catch (error) {
        console.error('Gemini AI chat error:', error);
        
        // Check if this is a 404 model error and try to discover working models
        if (error && typeof error === 'object' && 'status' in error && (error as any).status === 404) {
          console.log('404 Model Not Found - failing immediately to try fallback');
          try {
            const workingModel = await findSupportedGeminiModel();
            if (workingModel) {
              console.log(`Discovered working model: ${workingModel}, retrying request...`);
              GEMINI_RUNTIME_MODEL = workingModel;
              
              // Retry with the discovered model
              const result = await retryWithBackoff(async () => {
                const model = genAI.getGenerativeModel({ model: workingModel });
                
                // Enhanced system prompt for agricultural guidance
                const defaultSystemPrompt = "You are an expert agricultural advisor helping farmers. Please provide clear, step-by-step instructions using bullet points or numbered lists. Use professional but simple language that farmers can easily understand. Provide practical, actionable advice based on modern farming practices. Format your response with clear headings using bold text, bullet points for lists, and numbered steps for procedures. Include timing information when relevant. Mention both traditional and modern techniques when applicable. Add safety precautions when dealing with chemicals or equipment. Keep responses comprehensive but concise, focusing on practical implementation.";

                const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
                
                const parts = [
                  { text: finalSystemPrompt },
                  { text: message }
                ];
                const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
                return result.response.text();
              });
              
              return res.json({ text: result });
            }
          } catch (discoveryError) {
            console.error('Model discovery also failed:', discoveryError);
          }
        }
        
        // Check if this is a circuit breaker error
        if ((error as Error).message.includes('Circuit breaker is OPEN')) {
          return res.status(503).json({ 
            error: 'AI service temporarily unavailable',
            message: 'The AI service is experiencing high load. Please try again in a few moments.',
            retryAfter: 30
          });
        }
        
        // Return a helpful fallback response when Gemini fails
        const language = systemPrompt?.includes('hindi') || systemPrompt?.includes('हिंदी') ? 'hi' :
                        systemPrompt?.includes('marathi') || systemPrompt?.includes('मराठी') ? 'mr' : 'en';
        
        const fallbackResponses = {
          hi: 'माफ करें, AI सेवा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें या स्थानीय कृषि विशेषज्ञ से सलाह लें। सामान्य सुझाव: संतुलित खाद का प्रयोग करें, नियमित सिंचाई करें, और फसल की निगरानी रखें।',
          mr: 'क्षमस्व, AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा किंवा स्थानिक शेती तज्ञांचा सल्ला घ्या. सामान्य सूचना: संतुलित खताचा वापर करा, नियमित पाणी द्या आणि पिकांची देखभाल करा.',
          en: 'Sorry, AI service is currently unavailable. Please try again later or consult local agricultural experts. General advice: Use balanced fertilizers, maintain regular irrigation, and monitor your crops regularly.'
        };
        
        return res.json({ 
          text: fallbackResponses[language],
          fallback: true,
          reason: 'AI service unavailable'
        });
      }
    }

    if (!openai) {
      console.warn('OpenAI not configured - missing OPENAI_API_KEY');
      return res.status(503).json({ 
        error: 'AI service not configured', 
        provider: 'openai',
        message: 'OPENAI_API_KEY environment variable not set'
      });
    }

    try {
      const result = await openaiCircuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
              ...(systemPrompt ? [{ role: 'system' as const, content: String(systemPrompt) }] : []),
              { role: 'user', content: message },
            ],
            max_tokens: 500,
            temperature: 0.7,
          });
          return completion.choices[0]?.message?.content ?? '';
        });
      });

      return res.json({ text: result });
    } catch (error) {
      console.error('OpenAI chat error:', error);
      
      if ((error as Error).message.includes('Circuit breaker is OPEN')) {
        return res.status(503).json({ 
          error: 'AI service temporarily unavailable',
          message: 'The AI service is experiencing high load. Please try again in a few moments.',
          retryAfter: 30
        });
      }
      
      return res.status(500).json({ 
        error: 'AI chat failed',
        message: 'Unable to process your request right now. Please try again later.'
      });
    }
  } catch (_err) {
    console.error('AI chat error:', _err);
    res.status(500).json({ 
      error: 'AI chat failed', 
      message: 'An unexpected error occurred. Please try again later.'
    });
  }
});

app.post('/api/ai/analyze-image', async (req: Request, res: Response) => {
  try {
    const { imageBase64, query, systemPrompt } = req.body as { imageBase64?: unknown; query?: unknown; systemPrompt?: unknown };
    if (typeof imageBase64 !== 'string' || typeof query !== 'string' || (systemPrompt !== undefined && typeof systemPrompt !== 'string')) {
      return res.status(400).json({ error: 'Invalid request body' });
    }

    if (AI_PROVIDER === 'gemini') {
      if (!genAI) {
        console.warn('Gemini AI not configured - missing GEMINI_API_KEY');
        return res.status(503).json({ 
          error: 'AI service not configured', 
          provider: 'gemini',
          message: 'GEMINI_API_KEY environment variable not set'
        });
      }

      try {
        const result = await geminiCircuitBreaker.execute(async () => {
          return await retryWithBackoff(async () => {
            const model = await getGeminiModelInstance();
            
            // Enhanced system prompt for crop disease diagnosis
            const defaultSystemPrompt = "You are an expert agricultural pathologist and crop disease specialist. When analyzing crop images, please provide: Disease/Problem Identification with Disease Name (if identifiable), Affected Crop (specify the plant/crop type), and Severity Level (Mild/Moderate/Severe). Include Detailed Analysis with Symptoms Observed and Likely Causes (environmental, pathogenic, or nutritional factors). Provide Treatment Recommendations including Immediate Actions, Chemical Treatment with specific fungicides/pesticides and dosage, Organic Alternatives, and Application Method. Add Prevention Measures with Future Prevention steps, Best Practices for crop management, and Timing for preventive measures. Include Important Notes about Safety Precautions when using chemicals and Follow-up timing. Provide practical, actionable advice that farmers can implement immediately using clear, simple language with proper formatting.";

            const finalSystemPrompt = systemPrompt || defaultSystemPrompt;
            
            type Part = { text: string } | { inlineData: { mimeType: string; data: string } };
            const parts: Part[] = [];
            parts.push({ text: finalSystemPrompt });
            parts.push({ text: query });
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: imageBase64 } });
            const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
            return result.response.text();
          });
        });

        return res.json({ text: result });
      } catch (error) {
        console.error('Gemini AI vision error:', error);
        
        // Check if this is a circuit breaker error
        if ((error as Error).message.includes('Circuit breaker is OPEN')) {
          const language = systemPrompt?.includes('hindi') || systemPrompt?.includes('हिंदी') ? 'hi' :
                          systemPrompt?.includes('marathi') || systemPrompt?.includes('मराठी') ? 'mr' : 'en';
          const fallbackDiagnosis = getFallbackDiagnosis(language);
          
          console.log('Circuit breaker is OPEN, returning fallback diagnosis');
          return res.json({ 
            text: `${fallbackDiagnosis}\n\n⚠️ **${language === 'hi' ? 'सूचना' : language === 'mr' ? 'सूचना' : 'Notice'}:** ${
              language === 'hi' ? 'AI सेवा अधिक लोड के कारण बंद है। यह सामान्य निदान है। 30 सेकंड बाद पुनः प्रयास करें।' :
              language === 'mr' ? 'AI सेवा अधिक लोडमुळे बंद आहे. हे सामान्य निदान आहे. 30 सेकंदांनंतर पुन्हा प्रयत्न करा.' :
              'AI service is temporarily disabled due to high load. This is a general diagnosis. Please try again in 30 seconds.'
            }`,
            fallback: true,
            reason: 'Circuit breaker activated'
          });
        }
        
        // For persistent errors after retries, return fallback diagnosis
        const language = systemPrompt?.includes('hindi') || systemPrompt?.includes('हिंदी') ? 'hi' :
                        systemPrompt?.includes('marathi') || systemPrompt?.includes('मराठी') ? 'mr' : 'en';
        const fallbackDiagnosis = getFallbackDiagnosis(language);
        
        console.log('AI service failed after retries, returning fallback diagnosis');
        
        // Return fallback as successful response so frontend can display it
        return res.json({ 
          text: `${fallbackDiagnosis}\n\n⚠️ **${language === 'hi' ? 'सूचना' : language === 'mr' ? 'सूचना' : 'Notice'}:** ${
            language === 'hi' ? 'यह एक सामान्य निदान है क्योंकि AI सेवा अस्थायी रूप से अनुपलब्ध है। सटीक निदान के लिए कृपया बाद में पुनः प्रयास करें या स्थानीय कृषि विशेषज्ञ से संपर्क करें।' :
            language === 'mr' ? 'ही एक सामान्य निदान आहे कारण AI सेवा तात्पुरती अउपलब्ध आहे. अचूक निदानासाठी कृपया नंतर पुन्हा प्रयत्न करा किंवा स्थानिक कृषी तज्ञांशी संपर्क करा.' :
            'This is a general diagnosis as the AI service is temporarily unavailable. For accurate diagnosis, please try again later or contact local agricultural experts.'
          }`,
          fallback: true,
          reason: 'AI service overloaded after retries'
        });
      }
    }

    if (!openai) {
      console.warn('OpenAI not configured - missing OPENAI_API_KEY');
      return res.status(503).json({ 
        error: 'AI service not configured', 
        provider: 'openai',
        message: 'OPENAI_API_KEY environment variable not set'
      });
    }

    try {
      const result = await openaiCircuitBreaker.execute(async () => {
        return await retryWithBackoff(async () => {
          const completion = await openai.chat.completions.create({
            model: 'gpt-4o',
            messages: [
              ...(systemPrompt ? [{ role: 'system' as const, content: String(systemPrompt) }] : []),
              {
                role: 'user',
                content: [
                  { type: 'text', text: query },
                  { type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } }
                ]
              }
            ],
            max_tokens: 600,
            temperature: 0.4,
          });
          return completion.choices[0]?.message?.content ?? '';
        });
      });

      return res.json({ text: result });
    } catch (error) {
      console.error('OpenAI vision error:', error);
      
      if ((error as Error).message.includes('Circuit breaker is OPEN')) {
        return res.status(503).json({ 
          error: 'AI service temporarily unavailable',
          message: 'The AI service is experiencing high load. Please try again in a few moments.',
          retryAfter: 30
        });
      }
      
      // Return fallback diagnosis when AI fails
      const language = systemPrompt?.includes('hindi') || systemPrompt?.includes('हिंदी') ? 'hi' :
                      systemPrompt?.includes('marathi') || systemPrompt?.includes('मराठी') ? 'mr' : 'en';
      const fallbackDiagnosis = getFallbackDiagnosis(language);
      
      console.log('Returning fallback diagnosis due to AI service failure');
      return res.json({ 
        text: `${fallbackDiagnosis}\n\n⚠️ **सूचना:** यह एक सामान्य निदान है क्योंकि AI सेवा अस्थायी रूप से अनुपलब्ध है। सटीक निदान के लिए कृपया बाद में पुनः प्रयास करें या स्थानीय कृषि विशेषज्ञ से संपर्क करें।`
      });
    }
  } catch (_err) {
    console.error('AI vision error:', _err);
    
    // Return fallback diagnosis for unexpected errors
    const fallbackDiagnosis = getFallbackDiagnosis('hi');
    console.log('Returning fallback diagnosis due to unexpected error');
    
    res.json({ 
      text: `${fallbackDiagnosis}\n\n⚠️ **सूचना:** यह एक सामान्य निदान है क्योंकि AI सेवा अस्थायी रूप से अनुपलब्ध है। सटीक निदान के लिए कृपया बाद में पुनः प्रयास करें या स्थानीय कृषि विशेषज्ञ से संपर्क करें।`
    });
  }
});

const port = Number(process.env.PORT || 5001);

// Create HTTP server for WebSocket support
const server = createServer(app);

// Initialize WebSocket manager
const wsManager = new WebSocketManager(server);

// 404 error handler - only for unmatched routes
app.use((req: Request, res: Response) => {
  res.status(404).json({ 
    error: 'Not found',
    path: req.originalUrl,
    availableEndpoints: {
      root: '/',
      health: '/api/health',
      ai: {
        chat: '/api/ai/chat',
        'analyze-image': '/api/ai/analyze-image'
      }
    }
  });
});

server.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
  console.log(`WebSocket server ready for connections`);
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down...');
  server.close(() => {
    if (mongoReady) mongoose.connection.close(false).finally(() => process.exit(0));
    else process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
