import { Request, Response } from 'express';
import { PriceAlertModel } from '../models/PriceAlert.js';
import { AuthRequest } from '../middleware/auth.js';

// Get alerts for the authenticated user
export const getMyAlerts = async (req: Request, res: Response) => {
    try {
        const userId = (req as AuthRequest).user?.id;

        const alerts = await PriceAlertModel.find({ userId }).sort({ createdAt: -1 });
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
        const alertData = req.body;

        const alert = await PriceAlertModel.create({
            ...alertData,
            userId, // Force userId from token
            isActive: true
        });

        res.status(201).json(alert);
    } catch (error) {
        console.error('Error creating alert:', error);
        res.status(500).json({ error: 'Failed to create alert' });
    }
};

// Delete an alert
export const deleteAlert = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as AuthRequest).user?.id;

        const result = await PriceAlertModel.deleteOne({ _id: id, userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Alert not found or unauthorized' });
        }

        res.json({ message: 'Alert deleted successfully' });
    } catch (error) {
        console.error('Error deleting alert:', error);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
};
