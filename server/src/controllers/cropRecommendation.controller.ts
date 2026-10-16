import { Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import { CropRecommendationModel } from '../models/CropRecommendation.js';
import { UserModel } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const recommendCrop = async (req: Request, res: Response) => {
    try {
        const { N, P, K, temperature, humidity, ph, rainfall } = req.body;
        const user = (req as AuthRequest).user;

        // Validation
        if ([N, P, K, temperature, humidity, ph, rainfall].some(val => val === undefined || val === null)) {
            return res.status(400).json({ error: 'All 7 parameters (N, P, K, temperature, humidity, ph, rainfall) are required.' });
        }

        // Path to python script
        // Assumes server is running from d:\KisanSaathi\server and script is in d:\KisanSaathi\Crop-Recommendation-System
        // Adjust path resolution to be robust
        const scriptPath = path.resolve(__dirname, '../../../Crop-Recommendation-System/predict_wrapper.py');

        // Check if script exists (optional, mostly for debugging)
        // console.log(`Executing python script at: ${scriptPath}`);

        const args = [String(N), String(P), String(K), String(temperature), String(humidity), String(ph), String(rainfall)];

        const pythonProcess = spawn('py', [scriptPath, ...args]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
        });

        pythonProcess.on('close', async (code) => {
            if (code !== 0) {
                console.error(`Python script exited with code ${code}. Error: ${errorString}`);
                return res.status(500).json({ error: 'Failed to process recommendation.', details: errorString });
            }

            try {
                const result = JSON.parse(dataString);
                if (result.success) {
                    // Save to database if user is authenticated
                    if (user && user.id) {
                        try {
                            // Resolve MongoDB ObjectId — consistent with all other controllers
                            let mongoId: mongoose.Types.ObjectId;
                            if (mongoose.Types.ObjectId.isValid(user.id)) {
                                mongoId = new mongoose.Types.ObjectId(user.id);
                            } else {
                                const dbUser = await UserModel.findOne({ firebaseUid: user.id }).lean();
                                if (!dbUser) {
                                    throw new Error(`No user found for Firebase UID ${user.id}`);
                                }
                                mongoId = dbUser._id as mongoose.Types.ObjectId;
                            }

                            const topRecommendation = result.recommendations?.[0];
                            if (topRecommendation) {
                                await CropRecommendationModel.create({
                                    userId: mongoId,
                                    nitrogen: Number(N),
                                    phosphorus: Number(P),
                                    potassium: Number(K),
                                    temperature: Number(temperature),
                                    humidity: Number(humidity),
                                    ph: Number(ph),
                                    rainfall: Number(rainfall),
                                    recommendedCrop: topRecommendation.crop,
                                    confidence: topRecommendation.probability || 0
                                });
                                console.log(`✅ Recommendation saved for user ${user.id}`);
                            }
                        } catch (dbError) {
                            console.error('❌ Error saving recommendation history:', dbError);
                            // Don't fail the request if saving history fails
                        }
                    }

                    return res.status(200).json(result);
                } else {
                    return res.status(500).json({ error: result.error || 'Unknown error from prediction model.' });
                }
            } catch (parseError) {
                console.error('Failed to parse Python output:', dataString);
                return res.status(500).json({ error: 'Invalid response from prediction model.' });
            }
        });

    } catch (error) {
        console.error('Error in recommendCrop:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
export const getRecommendationHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { limit = 20 } = req.query;

        // Resolve the MongoDB ObjectId — userId may be a Firebase UID
        let mongoId: mongoose.Types.ObjectId;
        if (mongoose.Types.ObjectId.isValid(userId)) {
            mongoId = new mongoose.Types.ObjectId(userId);
        } else {
            // Firebase UID — look up the user document to get their MongoDB _id
            const user = await UserModel.findOne({ firebaseUid: userId }).lean();
            if (!user) {
                return res.json([]); // No user yet = no history
            }
            mongoId = (user._id as mongoose.Types.ObjectId);
        }

        const history = await CropRecommendationModel
            .find({ userId: mongoId })
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        console.log(`📋 Fetched ${history.length} recommendation records for user ${userId}`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching recommendation history:', error);
        res.status(500).json({ error: 'Failed to fetch recommendation history' });
    }
};
