import { Response } from 'express';
import { CropDiseaseModel } from '../models/CropDisease.js';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';

// Get disease detection history for a user
export const getDiseaseHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { cropName, limit = 20, skip = 0 } = req.query;

        const query: any = { userId: new mongoose.Types.ObjectId(userId) };
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

        // Enhanced logging: Log incoming request
        console.log('📥 Received disease detection save request');
        console.log('   User ID:', userId);
        console.log('   Request body:', JSON.stringify(req.body, null, 2));

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

        // Enhanced validation with detailed error messages
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

        // Log data being saved
        console.log('💾 Attempting to save disease detection:');
        console.log('   Crop:', cropName);
        console.log('   Disease:', detectedDisease);
        console.log('   Confidence:', confidence);
        console.log('   Symptoms count:', symptoms?.length || 0);
        console.log('   Has treatment:', !!treatment);
        console.log('   Prevention tips count:', preventionTips?.length || 0);

        const detection = await CropDiseaseModel.create({
            userId: new mongoose.Types.ObjectId(userId),
            cropName,
            imageUrl,
            detectedDisease,
            confidence,
            symptoms: symptoms || [],
            treatment: treatment || 'Consult agricultural expert',
            preventionTips: preventionTips || [],
            location
        });

        console.log(`✅ Successfully saved disease detection!`);
        console.log(`   ID: ${detection._id}`);
        console.log(`   Disease: ${detectedDisease} on ${cropName}`);
        console.log(`   User: ${userId}`);
        console.log(`   Timestamp: ${detection.detectedAt}`);

        res.status(201).json(detection);
    } catch (error) {
        console.error('❌ Error saving disease detection:');
        console.error('   Error type:', error instanceof Error ? error.name : typeof error);
        console.error('   Error message:', error instanceof Error ? error.message : String(error));
        console.error('   Full error:', error);

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

        const detection = await CropDiseaseModel.findOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId)
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

        const result = await CropDiseaseModel.deleteOne({
            _id: new mongoose.Types.ObjectId(id),
            userId: new mongoose.Types.ObjectId(userId)
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
