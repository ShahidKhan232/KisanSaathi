import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { CropRecommendationModel } from './src/models/CropRecommendation';
import { PriceAlertModel } from './src/models/PriceAlert';
import { UserModel } from './src/models/User';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

async function verify() {
    try {
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            process.exit(1);
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB successfully.');

        console.log('Verifying models...');

        // 1. Check User (Existing)
        const userCount = await UserModel.countDocuments();
        console.log(`Users count: ${userCount}`);

        if (userCount > 0) {
            const user = await UserModel.findOne();
            console.log(`Sample user ID: ${user?._id}`);
        }

        // 2. Create a test recommendation
        console.log('Creating test crop recommendation...');
        const testRec = await CropRecommendationModel.create({
            userId: new mongoose.Types.ObjectId(), // Random ID if no user exists, or use real one
            nitrogen: 50,
            phosphorus: 50,
            potassium: 50,
            temperature: 25,
            humidity: 60,
            ph: 6.5,
            rainfall: 100,
            recommendedCrop: 'Rice',
            confidence: 0.95
        });
        console.log(`✅ Created test recommendation: ${testRec._id}`);

        // 3. Verify it exists
        const foundRec = await CropRecommendationModel.findById(testRec._id);
        if (foundRec) {
            console.log(`✅ Verified test recommendation exists in DB.`);

            // Cleanup
            await CropRecommendationModel.findByIdAndDelete(testRec._id);
            console.log(`✅ Cleaned up test recommendation.`);
        } else {
            console.error('❌ Failed to retrieve test recommendation.');
        }

    } catch (error) {
        console.error('❌ Verification failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('Disconnected.');
    }
}

verify();
