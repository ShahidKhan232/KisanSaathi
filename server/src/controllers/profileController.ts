import type { Response } from 'express';
import { UserModel, type IUser } from '../models/User.js';
import { usersMemory, userIdToProfile } from '../models/InMemoryStorage.js';
import { mongoReady } from '../config/database.js';
import { ProfileSchema, type ProfileInput } from '../utils/validation.js';
import type { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const { id } = req.user!;
    console.log(`Fetching profile for user ${id}`);

    try {
        if (mongoReady) {
            const user = await UserModel.findById(id).lean();
            if (!user) {
                console.log(`User ${id} not found in database`);
                res.status(404).json({ error: 'User not found' });
                return;
            }

            console.log(`Profile found in database for user ${id}`);
            const { _id, email, name, phone, location, landSize, crops, kccNumber, aadhaar, bankAccount } = user as any;

            res.json({
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
            return;
        }

        // In-memory fallback
        console.log('Using in-memory storage for profile fetch');
        const mem = usersMemory.find(u => u.id === id);
        if (!mem) {
            console.log(`User ${id} not found in memory`);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const prof = userIdToProfile[id] || {};
        console.log(`Profile found in memory for user ${id}`);

        res.json({
            id,
            email: mem.email,
            name: mem.name ?? null,
            ...prof,
            crops: prof.crops ?? []
        });
    } catch (error) {
        console.error('Profile fetch error:', error);
        res.status(500).json({ error: 'Failed to load profile' });
    }
};

export const updateProfile = async (req: AuthRequest, res: Response): Promise<void> => {
    const parsed = ProfileSchema.safeParse(req.body);

    if (!parsed.success) {
        console.log('Profile validation failed:', parsed.error.flatten());
        res.status(400).json({ error: 'Invalid profile data', details: parsed.error.flatten() });
        return;
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
                    res.status(409).json({ error: 'Email already in use' });
                    return;
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
                res.status(404).json({ error: 'User not found' });
                return;
            }

            console.log(`Profile updated successfully for user ${id}`);
            const { _id, email, name, phone, location, landSize, crops, kccNumber, aadhaar, bankAccount } = user as any;

            res.json({
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
            return;
        }

        // In-memory fallback
        console.log('Using in-memory storage for profile update');
        const mem = usersMemory.find(u => u.id === id);
        if (!mem) {
            console.log(`User ${id} not found in memory for profile update`);
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const existing = userIdToProfile[id] || {};
        const updated = { ...existing, ...parsed.data };
        userIdToProfile[id] = updated;

        console.log(`Profile updated in memory for user ${id}`);
        res.json({
            id,
            email: mem.email,
            name: mem.name ?? null,
            ...updated,
            crops: updated.crops ?? []
        });
    } catch (error) {
        console.error('Profile update error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
};
