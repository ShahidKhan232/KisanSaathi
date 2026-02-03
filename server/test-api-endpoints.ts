import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import { CropRecommendationModel } from './src/models/CropRecommendation.js';
import { MarketPriceModel } from './src/models/MarketPrice.js';
import { GovernmentSchemeModel } from './src/models/GovernmentScheme.js';
import { PriceAlertModel } from './src/models/PriceAlert.js';

async function testDatabaseOperations() {
    try {
        console.log('🔍 Testing Database Operations...\n');

        // 1. Connect to MongoDB
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            process.exit(1);
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB successfully.');
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Host: ${mongoose.connection.host}\n`);

        // 2. Test Crop Recommendation
        console.log('📝 Testing Crop Recommendation Model...');
        try {
            const testCropRec = await CropRecommendationModel.create({
                userId: new mongoose.Types.ObjectId(),
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
            console.log(`✅ Crop Recommendation created: ${testCropRec._id}`);

            const foundCropRec = await CropRecommendationModel.findById(testCropRec._id);
            if (foundCropRec) {
                console.log(`✅ Crop Recommendation verified in DB`);
                await CropRecommendationModel.findByIdAndDelete(testCropRec._id);
                console.log(`✅ Crop Recommendation cleaned up\n`);
            }
        } catch (error: any) {
            console.error(`❌ Crop Recommendation test failed:`, error.message);
        }

        // 3. Test Market Price
        console.log('📝 Testing Market Price Model...');
        try {
            const testMarketPrice = await MarketPriceModel.create({
                commodity: 'Wheat',
                variety: 'HD-2967',
                market: 'Delhi',
                state: 'Delhi',
                district: 'Central Delhi',
                minPrice: 2000,
                maxPrice: 2200,
                modalPrice: 2100,
                priceDate: new Date(),
                arrivals: 500,
                source: 'agmarknet'
            });
            console.log(`✅ Market Price created: ${testMarketPrice._id}`);

            const foundMarketPrice = await MarketPriceModel.findById(testMarketPrice._id);
            if (foundMarketPrice) {
                console.log(`✅ Market Price verified in DB`);
                await MarketPriceModel.findByIdAndDelete(testMarketPrice._id);
                console.log(`✅ Market Price cleaned up\n`);
            }
        } catch (error: any) {
            console.error(`❌ Market Price test failed:`, error.message);
        }

        // 4. Test Government Scheme
        console.log('📝 Testing Government Scheme Model...');
        try {
            const testScheme = await GovernmentSchemeModel.create({
                schemeId: 'TEST-SCHEME-001',
                schemeName: 'Test Farmer Scheme',
                description: 'This is a test scheme for farmers',
                benefits: ['Subsidy', 'Training'],
                eligibility: ['Small farmers', 'Marginal farmers'],
                state: 'Test State',
                category: 'Agriculture',
                department: 'Department of Agriculture',
                documentsRequired: ['Aadhaar', 'Land Records'],
                isActive: true
            });
            console.log(`✅ Government Scheme created: ${testScheme._id}`);

            const foundScheme = await GovernmentSchemeModel.findById(testScheme._id);
            if (foundScheme) {
                console.log(`✅ Government Scheme verified in DB`);
                await GovernmentSchemeModel.findByIdAndDelete(testScheme._id);
                console.log(`✅ Government Scheme cleaned up\n`);
            }
        } catch (error: any) {
            console.error(`❌ Government Scheme test failed:`, error.message);
        }

        // 5. Test Price Alert
        console.log('📝 Testing Price Alert Model...');
        try {
            const testAlert = await PriceAlertModel.create({
                userId: new mongoose.Types.ObjectId(),
                crop: 'Wheat',
                targetPrice: 2500,
                market: 'Delhi',
                alertType: 'above',
                isActive: true,
                notificationSent: false
            });
            console.log(`✅ Price Alert created: ${testAlert._id}`);

            const foundAlert = await PriceAlertModel.findById(testAlert._id);
            if (foundAlert) {
                console.log(`✅ Price Alert verified in DB`);
                await PriceAlertModel.findByIdAndDelete(testAlert._id);
                console.log(`✅ Price Alert cleaned up\n`);
            }
        } catch (error: any) {
            console.error(`❌ Price Alert test failed:`, error.message);
        }

        // 6. Check existing data counts
        console.log('📊 Checking existing data in collections...');
        const cropRecCount = await CropRecommendationModel.countDocuments();
        const marketPriceCount = await MarketPriceModel.countDocuments();
        const schemeCount = await GovernmentSchemeModel.countDocuments();
        const alertCount = await PriceAlertModel.countDocuments();

        console.log(`   Crop Recommendations: ${cropRecCount}`);
        console.log(`   Market Prices: ${marketPriceCount}`);
        console.log(`   Government Schemes: ${schemeCount}`);
        console.log(`   Price Alerts: ${alertCount}\n`);

        console.log('✅ All database tests completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB.');
    }
}

testDatabaseOperations();
