import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { CropDiseaseModel } from '../models/CropDisease.js';
import mongoose from 'mongoose';

// Test crop disease database operations
export const testCropDiseaseDB = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        console.log('🧪 Testing crop disease database operations...');
        
        // Test 1: Check if we can read existing data
        const existingDetections = await CropDiseaseModel.find({ 
            userId: new mongoose.Types.ObjectId(userId) 
        }).sort({ detectedAt: -1 }).limit(5);
        
        console.log(`📊 Found ${existingDetections.length} existing disease detections for user ${userId}`);
        
        // Test 2: Create a sample detection
        const sampleDetection = {
            userId: new mongoose.Types.ObjectId(userId),
            cropName: 'Test Wheat',
            imageUrl: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/8A8A',
            detectedDisease: 'Test Leaf Rust',
            confidence: 85,
            symptoms: ['Orange-brown pustules on leaves', 'Yellowing of leaves'],
            treatment: 'Apply fungicide spray with propiconazole',
            preventionTips: ['Use resistant varieties', 'Proper field sanitation']
        };

        const savedDetection = await CropDiseaseModel.create(sampleDetection);
        console.log('✅ Sample detection created successfully:', savedDetection._id);

        // Test 3: Read it back
        const retrievedDetection = await CropDiseaseModel.findById(savedDetection._id);
        if (retrievedDetection) {
            console.log('✅ Detection retrieved successfully');
        } else {
            console.error('❌ Failed to retrieve created detection');
        }

        // Test 4: Clean up - delete the test detection
        await CropDiseaseModel.findByIdAndDelete(savedDetection._id);
        console.log('🧹 Test detection cleaned up');

        res.json({
            success: true,
            message: 'Crop disease database test completed successfully',
            tests: {
                existingDetections: existingDetections.length,
                sampleDetectionCreated: !!savedDetection,
                sampleDetectionRetrieved: !!retrievedDetection,
                cleanupSuccessful: true
            },
            existingData: existingDetections.map(d => ({
                id: d._id,
                crop: d.cropName,
                disease: d.detectedDisease,
                date: d.detectedAt,
                hasImage: !!d.imageUrl
            }))
        });

    } catch (error) {
        console.error('❌ Crop disease database test failed:', error);
        res.status(500).json({ 
            error: 'Database test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
