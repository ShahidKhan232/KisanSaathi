import { Response } from 'express';
import { CropDiseaseModel } from '../models/CropDisease.js';
import { UserModel } from '../models/User.js';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';

/**
 * Resolve a user ID to a MongoDB ObjectId.
 * Handles both legacy MongoDB ObjectIds and Firebase UIDs.
 */
async function resolveMongoId(userId: string): Promise<mongoose.Types.ObjectId | null> {
    if (mongoose.Types.ObjectId.isValid(userId)) {
        return new mongoose.Types.ObjectId(userId);
    }
    // Firebase UID — look up user by firebaseUid
    const user = await UserModel.findOne({ firebaseUid: userId }).lean();
    if (!user) return null;
    return user._id as mongoose.Types.ObjectId;
}

// Get disease detection history for a user
export const getDiseaseHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { cropName, limit = 20, skip = 0 } = req.query;

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) {
            return res.json([]); // New Firebase user with no history yet
        }

        const query: any = { userId: mongoId };
        if (cropName) {
            query.cropName = new RegExp(String(cropName), 'i');
        }

        const history = await CropDiseaseModel
            .find(query)
            .sort({ detectedAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        console.log(`🌾 Fetched ${history.length} disease detections for user ${userId}`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching disease history:', error);
        res.status(500).json({ error: 'Failed to fetch disease history' });
    }
};

// Save disease detection result
export const saveDiseaseDetection = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;

        console.log('📥 Received disease detection save request');
        console.log('   User ID:', userId);

        if (!userId) {
            console.error('❌ Unauthorized: No user ID found in request');
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const {
            cropName,
            imageUrl,
            detectedDisease,
            confidence,
            symptoms,
            treatment,
            preventionTips,
            location
        } = req.body;

        if (!cropName || !detectedDisease || confidence === undefined) {
            const missingFields = [];
            if (!cropName) missingFields.push('cropName');
            if (!detectedDisease) missingFields.push('detectedDisease');
            if (confidence === undefined) missingFields.push('confidence');

            console.error('❌ Validation failed - Missing fields:', missingFields);
            return res.status(400).json({
                error: 'Crop name, detected disease, and confidence are required',
                missingFields,
                receivedData: { cropName, detectedDisease, confidence }
            });
        }

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log('💾 Saving disease detection:', cropName, '-', detectedDisease);

        const detection = await CropDiseaseModel.create({
            userId: mongoId,
            cropName,
            imageUrl,
            detectedDisease,
            confidence,
            symptoms: symptoms || [],
            treatment: treatment || 'Consult agricultural expert',
            preventionTips: preventionTips || [],
            location
        });

        console.log(`✅ Saved disease detection ${detection._id} for user ${userId}`);
        res.status(201).json(detection);
    } catch (error) {
        console.error('❌ Error saving disease detection:', error instanceof Error ? error.message : error);
        res.status(500).json({
            error: 'Failed to save disease detection',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get disease detection by ID
export const getDiseaseById = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const detection = await CropDiseaseModel.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: mongoId
        });

        if (!detection) {
            return res.status(404).json({ error: 'Detection not found' });
        }

        res.json(detection);
    } catch (error) {
        console.error('Error fetching disease detection:', error);
        res.status(500).json({ error: 'Failed to fetch disease detection' });
    }
};

// Delete disease detection
export const deleteDiseaseDetection = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { id } = req.params;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const result = await CropDiseaseModel.deleteOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: mongoId
        });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Detection not found' });
        }

        console.log(`🗑️  Deleted disease detection ${id} for user ${userId}`);
        res.json({ message: 'Detection deleted successfully' });
    } catch (error) {
        console.error('Error deleting disease detection:', error);
        res.status(500).json({ error: 'Failed to delete disease detection' });
    }
};
