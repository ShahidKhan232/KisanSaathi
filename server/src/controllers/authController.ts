import type { Response } from 'express';
import bcrypt from 'bcryptjs';
import { UserModel } from '../models/User.js';
import { usersMemory, userIdToProfile } from '../models/InMemoryStorage.js';
import { mongoReady } from '../config/database.js';
import { signToken } from '../utils/jwt.js';
import { RegisterSchema, LoginSchema, type RegisterInput, type LoginInput } from '../utils/validation.js';
import type { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = RegisterSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
    }

    const { email, password, name }: RegisterInput = parsed.data;

    try {
        if (mongoReady) {
            const existing = await UserModel.findOne({ email }).lean();
            if (existing) {
                res.status(409).json({ error: 'Email already registered' });
                return;
            }

            const passwordHash = await bcrypt.hash(password, 10);
            const user = await UserModel.create({
                email,
                passwordHash,
                name,
                createdAt: new Date()
            });

            const id = (user._id as mongoose.Types.ObjectId).toString();
            const token = signToken({ id, email, name: user.name });

            res.status(201).json({
                token,
                user: { id, email, name: user.name ?? null }
            });
            return;
        }

        // In-memory fallback
        const exists = usersMemory.some(u => u.email === email);
        if (exists) {
            res.status(409).json({ error: 'Email already registered' });
            return;
        }

        const passwordHash = await bcrypt.hash(password, 10);
        const user = {
            id: Date.now().toString(),
            email,
            name,
            passwordHash,
            createdAt: new Date()
        };

        usersMemory.push(user);
        userIdToProfile[user.id] = { crops: [] };

        const token = signToken({ id: user.id, email, name });

        res.status(201).json({
            token,
            user: { id: user.id, email, name: user.name ?? null }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
};

export const login = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = LoginSchema.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
        return;
    }

    const { email, password }: LoginInput = parsed.data;

    try {
        if (mongoReady) {
            const user = await UserModel.findOne({ email });
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            const ok = await bcrypt.compare(password, user.passwordHash);
            if (!ok) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }

            const id = (user._id as mongoose.Types.ObjectId).toString();
            const token = signToken({ id, email, name: user.name });

            res.json({
                token,
                user: { id, email, name: user.name ?? null }
            });
            return;
        }

        // In-memory fallback
        const user = usersMemory.find(u => u.email === email);
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const ok = await bcrypt.compare(password, user.passwordHash);
        if (!ok) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        const token = signToken({ id: user.id, email, name: user.name });

        res.json({
            token,
            user: { id: user.id, email, name: user.name ?? null }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
};

export const getCurrentUser = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.user!;

    try {
        if (mongoReady) {
            const user = await UserModel.findById(id);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }

            const uid = (user._id as mongoose.Types.ObjectId).toString();
            res.json({ id: uid, email: user.email, name: user.name ?? null });
            return;
        }

        // In-memory fallback
        const user = usersMemory.find(u => u.id === id);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ id: user.id, email: user.email, name: user.name ?? null });
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({ error: 'Failed to load user' });
    }
};

// Development helper - create test user
export const createTestUser = async (req: AuthRequest, res: Response): Promise<void> => {
    if (process.env.NODE_ENV === 'production') {
        res.status(403).json({ error: 'Not available in production' });
        return;
    }

    const testEmail = 'test@example.com';
    const testPassword = 'password123';
    const testName = 'Test User';

    try {
        if (mongoReady) {
            const existing = await UserModel.findOne({ email: testEmail }).lean();
            if (existing) {
                res.json({ message: 'Test user already exists', email: testEmail });
                return;
            }

            const passwordHash = await bcrypt.hash(testPassword, 10);
            const user = await UserModel.create({
                email: testEmail,
                passwordHash,
                name: testName,
                createdAt: new Date()
            });

            const id = (user._id as mongoose.Types.ObjectId).toString();
            res.status(201).json({
                message: 'Test user created',
                email: testEmail,
                password: testPassword,
                id
            });
            return;
        }

        const exists = usersMemory.some(u => u.email === testEmail);
        if (exists) {
            res.json({ message: 'Test user already exists', email: testEmail });
            return;
        }

        const passwordHash = await bcrypt.hash(testPassword, 10);
        const user = {
            id: Date.now().toString(),
            email: testEmail,
            name: testName,
            passwordHash,
            createdAt: new Date()
        };

        usersMemory.push(user);
        userIdToProfile[user.id] = { crops: [] };

        res.status(201).json({
            message: 'Test user created',
            email: testEmail,
            password: testPassword,
            id: user.id
        });
    } catch (error) {
        console.error('Test user creation failed:', error);
        res.status(500).json({ error: 'Failed to create test user' });
    }
};
