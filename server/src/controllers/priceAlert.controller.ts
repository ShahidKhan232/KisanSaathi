import { Request, Response } from 'express';
import { PriceAlertModel } from '../models/PriceAlert.js';
import { UserModel } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

/** Resolve Firebase UID or MongoDB ObjectId to a MongoDB ObjectId */
async function resolveMongoId(userId: string): Promise<mongoose.Types.ObjectId | null> {
    if (mongoose.Types.ObjectId.isValid(userId)) {
        return new mongoose.Types.ObjectId(userId);
    }
    const user = await UserModel.findOne({ firebaseUid: userId }).lean();
    if (!user) return null;
    return user._id as mongoose.Types.ObjectId;
}

// Get alerts for the authenticated user
export const getMyAlerts = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.json([]);

        const alerts = await PriceAlertModel.find({ userId: mongoId }).sort({ createdAt: -1 });
        res.json(alerts);
    } catch (error) {
        console.error('Error fetching alerts:', error);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

// Create a new alert
export const createAlert = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const alertData = req.body;

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.status(404).json({ error: 'User not found' });

        const alert = await PriceAlertModel.create({
            ...alertData,
            userId: mongoId, // Force userId from token
            isActive: true
        });

        res.status(201).json(alert);
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
};

// Get user's price alert preferences
export const getAlertPreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.json([]);

        const preferences = await PriceAlertModel.find({ 
            userId: mongoId, 
            isActive: true 
        }).select('crop targetPrice alertType market -_id');
        
        res.json(preferences);
    } catch (error) {
        console.error('Error fetching alert preferences:', error);
        res.status(500).json({ error: 'Failed to fetch alert preferences' });
    }
};

// Update alert preference
export const updateAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });
        const updateData = req.body;

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.status(404).json({ error: 'User not found' });

        const alert = await PriceAlertModel.findOneAndUpdate(
            { _id: id, userId: mongoId },
            { ...updateData },
            { new: true }
        );

        if (!alert) {
            return res.status(404).json({ error: 'Alert not found or unauthorized' });
        }

        res.json(alert);
    } catch (error) {
        console.error('Error updating alert:', error);
        res.status(500).json({ error: 'Failed to update alert' });
    }
};

// Delete an alert
export const deleteAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.status(404).json({ error: 'User not found' });

        const result = await PriceAlertModel.deleteOne({ _id: id, userId: mongoId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Alert not found or unauthorized' });
        }

        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
};
