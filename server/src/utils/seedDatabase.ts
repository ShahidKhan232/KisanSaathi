/**
 * Database Seeding Script
 * Run this script to populate the database with sample data for testing
 * 
 * Usage: node dist/utils/seedDatabase.js
 */

import '../loadEnv.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import {
    UserModel,
    CropDiseaseModel,
    MarketPriceModel,
    GovernmentSchemeModel,
    ChatHistoryModel,
    CropInfoModel,
    WeatherDataModel,
    PriceAlertModel
} from '../models/index.js';
import bcrypt from 'bcryptjs';

const seedData = async () => {
    try {
        console.log('🌱 Starting database seeding...\n');

        // Connect to database
        await connectDatabase();

        // Clear existing data (optional - comment out if you want to keep existing data)
        console.log('🗑️  Clearing existing data...');
        await UserModel.deleteMany({});
        await CropDiseaseModel.deleteMany({});
        await MarketPriceModel.deleteMany({});
        await GovernmentSchemeModel.deleteMany({});
        await ChatHistoryModel.deleteMany({});
        await CropInfoModel.deleteMany({});
        await WeatherDataModel.deleteMany({});
        await PriceAlertModel.deleteMany({});
        console.log('✅ Existing data cleared\n');

        // Create sample users
        console.log('👤 Creating sample users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const users = await UserModel.create([
            {
                name: 'Ramesh Kumar',
                email: 'ramesh@example.com',
                passwordHash: hashedPassword,
                phone: '+91-9876543210',
                location: 'Pune, Maharashtra',
                landSize: '5 acres',
                crops: ['Wheat', 'Rice', 'Sugarcane'],
                preferredLanguage: 'mr',
                farmingExperience: 15,
                primaryCrops: ['Wheat', 'Rice'],
                soilType: 'Black soil',
                irrigationType: 'Drip irrigation',
                profileComplete: true
            },
            {
                name: 'Priya Sharma',
                email: 'priya@example.com',
                passwordHash: hashedPassword,
                phone: '+91-9876543211',
                location: 'Nashik, Maharashtra',
                landSize: '3 acres',
                crops: ['Grapes', 'Onion'],
                preferredLanguage: 'hi',
                farmingExperience: 8,
                primaryCrops: ['Grapes'],
                soilType: 'Red soil',
                irrigationType: 'Sprinkler',
                profileComplete: true
            }
        ]);
        console.log(`✅ Created ${users.length} users\n`);

        // Create sample crop info
        console.log('🌾 Creating crop information...');
        const crops = await CropInfoModel.create([
            {
                cropName: 'Wheat',
                scientificName: 'Triticum aestivum',
                category: 'cereal',
                season: ['rabi'],
                duration: 120,
                soilType: ['Loamy', 'Clay'],
                climate: 'Cool and moist',
                waterRequirement: 'medium',
                fertilizers: ['Urea', 'DAP', 'Potash'],
                commonDiseases: ['Rust', 'Smut', 'Blight'],
                commonPests: ['Aphids', 'Termites'],
                harvestingTips: 'Harvest when grain moisture is 20-25%',
                storageInfo: 'Store in cool, dry place with moisture below 12%',
                marketDemand: 'High demand year-round'
            },
            {
                cropName: 'Rice',
                scientificName: 'Oryza sativa',
                category: 'cereal',
                season: ['kharif'],
                duration: 120,
                soilType: ['Clay', 'Loamy'],
                climate: 'Hot and humid',
                waterRequirement: 'high',
                fertilizers: ['Urea', 'SSP', 'MOP'],
                commonDiseases: ['Blast', 'Sheath blight', 'Brown spot'],
                commonPests: ['Stem borer', 'Leaf folder'],
                harvestingTips: 'Harvest when 80% of grains turn golden yellow',
                storageInfo: 'Dry to 14% moisture before storage',
                marketDemand: 'Very high demand'
            },
            {
                cropName: 'Tomato',
                scientificName: 'Solanum lycopersicum',
                category: 'vegetable',
                season: ['kharif', 'rabi'],
                duration: 90,
                soilType: ['Loamy', 'Sandy loam'],
                climate: 'Warm temperate',
                waterRequirement: 'medium',
                fertilizers: ['NPK 19:19:19', 'Calcium nitrate'],
                commonDiseases: ['Early blight', 'Late blight', 'Leaf curl'],
                commonPests: ['Whitefly', 'Fruit borer'],
                harvestingTips: 'Harvest when fruits are firm and fully colored',
                storageInfo: 'Store at 10-15°C for best shelf life',
                marketDemand: 'High demand, especially in urban areas'
            }
        ]);
        console.log(`✅ Created ${crops.length} crop information entries\n`);

        // Create sample market prices
        console.log('💰 Creating market price data...');
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        const prices = await MarketPriceModel.create([
            {
                commodity: 'Wheat',
                market: 'Pune APMC',
                state: 'Maharashtra',
                district: 'Pune',
                minPrice: 2000,
                maxPrice: 2200,
                modalPrice: 2100,
                priceDate: today,
                arrivals: 500,
                source: 'agmarknet'
            },
            {
                commodity: 'Rice',
                market: 'Nashik APMC',
                state: 'Maharashtra',
                district: 'Nashik',
                minPrice: 2500,
                maxPrice: 2800,
                modalPrice: 2650,
                priceDate: today,
                arrivals: 300,
                source: 'agmarknet'
            },
            {
                commodity: 'Tomato',
                market: 'Pune APMC',
                state: 'Maharashtra',
                district: 'Pune',
                minPrice: 15,
                maxPrice: 25,
                modalPrice: 20,
                priceDate: today,
                arrivals: 1000,
                source: 'agmarknet'
            }
        ]);
        console.log(`✅ Created ${prices.length} market price entries\n`);

        // Create sample government schemes
        console.log('🏛️  Creating government schemes...');
        const schemes = await GovernmentSchemeModel.create([
            {
                schemeId: 'PM-KISAN-001',
                schemeName: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
                description: 'Income support of Rs. 6000 per year to all farmer families',
                benefits: ['Rs. 2000 per installment', 'Three installments per year', 'Direct bank transfer'],
                eligibility: ['All landholding farmer families', 'Valid Aadhaar card', 'Bank account'],
                state: 'All',
                category: 'subsidy',
                department: 'Ministry of Agriculture & Farmers Welfare',
                applicationProcess: 'Apply online at pmkisan.gov.in or through CSC',
                documentsRequired: ['Aadhaar card', 'Bank account details', 'Land ownership documents'],
                websiteUrl: 'https://pmkisan.gov.in',
                isActive: true
            },
            {
                schemeId: 'KCC-001',
                schemeName: 'Kisan Credit Card (KCC)',
                description: 'Credit facility for farmers to meet agricultural expenses',
                benefits: ['Easy credit access', 'Low interest rates', 'Flexible repayment'],
                eligibility: ['Farmers owning cultivable land', 'Tenant farmers', 'Sharecroppers'],
                state: 'All',
                category: 'loan',
                department: 'Ministry of Agriculture & Farmers Welfare',
                applicationProcess: 'Apply at nearest bank branch',
                documentsRequired: ['Land records', 'Identity proof', 'Address proof'],
                websiteUrl: 'https://www.india.gov.in/spotlight/kisan-credit-card-kcc',
                isActive: true
            }
        ]);
        console.log(`✅ Created ${schemes.length} government schemes\n`);

        // Create sample price alerts
        console.log('🔔 Creating price alerts...');
        const alerts = await PriceAlertModel.create([
            {
                userId: users[0]._id.toString(),
                crop: 'Wheat',
                targetPrice: 2200,
                market: 'Pune APMC',
                alertType: 'above',
                isActive: true
            },
            {
                userId: users[1]._id.toString(),
                crop: 'Grapes',
                targetPrice: 5000,
                market: 'Nashik APMC',
                alertType: 'above',
                isActive: true
            }
        ]);
        console.log(`✅ Created ${alerts.length} price alerts\n`);

        // Create sample crop disease records
        console.log('🦠 Creating crop disease records...');
        const diseases = await CropDiseaseModel.create([
            {
                userId: users[0]._id,
                cropName: 'Wheat',
                detectedDisease: 'Leaf Rust',
                confidence: 87,
                symptoms: ['Orange-brown pustules on leaves', 'Yellowing of leaves'],
                treatment: 'Apply fungicide like Propiconazole. Remove infected leaves.',
                preventionTips: ['Use resistant varieties', 'Proper spacing', 'Avoid excess nitrogen'],
                detectedAt: new Date()
            },
            {
                userId: users[1]._id,
                cropName: 'Tomato',
                detectedDisease: 'Early Blight',
                confidence: 92,
                symptoms: ['Dark spots with concentric rings', 'Yellowing of lower leaves'],
                treatment: 'Apply Mancozeb or Chlorothalonil fungicide',
                preventionTips: ['Crop rotation', 'Remove plant debris', 'Proper irrigation'],
                detectedAt: new Date()
            }
        ]);
        console.log(`✅ Created ${diseases.length} crop disease records\n`);

        // Create sample chat history
        console.log('💬 Creating chat history...');
        const chats = await ChatHistoryModel.create([
            {
                userId: users[0]._id,
                sessionId: 'session-001',
                messages: [
                    { role: 'user', content: 'What is the best time to plant wheat?', timestamp: new Date(), language: 'en' },
                    { role: 'assistant', content: 'The best time to plant wheat in Maharashtra is from mid-October to mid-November (Rabi season). This ensures optimal temperature and moisture conditions for germination and growth.', timestamp: new Date(), language: 'en' }
                ],
                topic: 'Crop Planting'
            }
        ]);
        console.log(`✅ Created ${chats.length} chat history entries\n`);

        // Create sample weather data
        console.log('🌤️  Creating weather data...');
        const weather = await WeatherDataModel.create([
            {
                location: 'Pune',
                coordinates: { latitude: 18.5204, longitude: 73.8567 },
                temperature: { min: 18, max: 32, avg: 25 },
                humidity: 65,
                rainfall: 0,
                windSpeed: 12,
                forecast: [
                    {
                        date: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                        temperature: { min: 19, max: 33, avg: 26 },
                        humidity: 60,
                        rainfall: 0,
                        condition: 'Partly cloudy'
                    }
                ],
                recordDate: today,
                source: 'IMD'
            }
        ]);
        console.log(`✅ Created ${weather.length} weather data entries\n`);

        console.log('✅ Database seeding completed successfully!\n');
        console.log('📊 Summary:');
        console.log(`   - Users: ${users.length}`);
        console.log(`   - Crop Info: ${crops.length}`);
        console.log(`   - Market Prices: ${prices.length}`);
        console.log(`   - Government Schemes: ${schemes.length}`);
        console.log(`   - Price Alerts: ${alerts.length}`);
        console.log(`   - Crop Diseases: ${diseases.length}`);
        console.log(`   - Chat History: ${chats.length}`);
        console.log(`   - Weather Data: ${weather.length}`);
        console.log('\n🎉 You can now test the application with sample data!');

    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    } finally {
        await disconnectDatabase();
        process.exit(0);
    }
};

// Run the seeding script
seedData();
