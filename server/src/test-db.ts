
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { CropDiseaseModel } from './models/CropDisease.js';

// Load env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const MONGO_URI = process.env.MONGO_URI || '';

console.log('🧪 Testing Database Connection and Write...');
console.log(`Pinging URI: ${MONGO_URI}`);

async function testDB() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Initial Count
        const initialCount = await CropDiseaseModel.countDocuments();
        console.log(`📊 Initial CropDisease count: ${initialCount}`);

        // Create Dummy
        console.log('📝 Attempting to write a test document...');
        const testDoc = await CropDiseaseModel.create({
            userId: new mongoose.Types.ObjectId(), // Random ID
            cropName: 'TEST_ENTRY',
            detectedDisease: 'Test Disease',
            confidence: 99.9,
            symptoms: ['Test symptom'],
            treatment: 'Ignore this',
            preventionTips: ['None']
        });
        console.log('✅ Test document saved. ID:', testDoc._id);

        // New Count
        const newCount = await CropDiseaseModel.countDocuments();
        console.log(`📊 New CropDisease count: ${newCount}`);

        if (newCount > initialCount) {
            console.log('🎉 SUCCESS: Database update confirmed!');
        } else {
            console.error('❌ FAILURE: Count did not increase!');
        }

        // Cleanup
        console.log('🧹 Cleaning up test document...');
        await CropDiseaseModel.deleteOne({ _id: testDoc._id });
        console.log('✅ Cleanup done');

    } catch (error) {
        console.error('❌ Database Test Failed:', error);
    } finally {
        await mongoose.disconnect();
    }
}

testDB();
