import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') });

// Import models
import { GovernmentSchemeModel } from './src/models/GovernmentScheme.js';
import { MarketPriceModel } from './src/models/MarketPrice.js';
import { CropInfoModel } from './src/models/CropInfo.js';
import { WeatherDataModel } from './src/models/WeatherData.js';

async function seedDatabase() {
    try {
        console.log('🌱 Seeding Database...\n');

        // Connect to MongoDB
        if (!process.env.MONGO_URI) {
            console.error('❌ MONGO_URI is missing in .env');
            process.exit(1);
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB successfully.\n');

        // Seed Government Schemes
        console.log('📝 Seeding Government Schemes...');
        const schemes = [
            {
                schemeId: 'PM-KISAN-2024',
                schemeName: 'PM-KISAN Scheme',
                description: 'Pradhan Mantri Kisan Samman Nidhi - Financial assistance of ₹6000 per year for small and marginal farmers',
                benefits: ['₹6000 per year', 'Direct Benefit Transfer', '3 installments of ₹2000 each'],
                eligibility: ['Up to 2 hectares agricultural land', 'Aadhaar card required', 'Bank account required'],
                state: 'All India',
                category: 'Direct Benefit',
                department: 'Ministry of Agriculture and Farmers Welfare',
                applicationProcess: 'Online application through PM-KISAN portal',
                documentsRequired: ['Aadhaar Card', 'Bank Passbook', 'Land Documents'],
                websiteUrl: 'https://pmkisan.gov.in',
                isActive: true,
                deadline: '2025-12-31',
                matchScore: 95,
                applicationStatus: 'available'
            },
            {
                schemeId: 'PMFBY-2024',
                schemeName: 'Pradhan Mantri Fasal Bima Yojana',
                description: 'Crop insurance scheme providing financial support to farmers in case of crop failure',
                benefits: ['Comprehensive risk coverage', 'Low premium rates', 'Quick claim settlement'],
                eligibility: ['All farmers growing notified crops', 'Sharecroppers and tenant farmers eligible'],
                state: 'All India',
                category: 'Insurance',
                department: 'Ministry of Agriculture and Farmers Welfare',
                applicationProcess: 'Through banks, CSCs, or online portal',
                documentsRequired: ['Aadhaar Card', 'Bank Account', 'Land Records', 'Sowing Certificate'],
                websiteUrl: 'https://pmfby.gov.in',
                isActive: true,
                deadline: '2025-06-30',
                matchScore: 88,
                applicationStatus: 'available'
            },
            {
                schemeId: 'KCC-2024',
                schemeName: 'Kisan Credit Card',
                description: 'Credit facility for farmers to meet agricultural expenses',
                benefits: ['Easy credit access', 'Low interest rates', 'Insurance coverage'],
                eligibility: ['Farmers owning cultivable land', 'Tenant farmers and sharecroppers'],
                state: 'All India',
                category: 'Loan',
                department: 'Ministry of Agriculture and Farmers Welfare',
                applicationProcess: 'Apply through banks',
                documentsRequired: ['Aadhaar Card', 'Land Documents', 'Bank Account'],
                websiteUrl: 'https://www.india.gov.in/spotlight/kisan-credit-card-kcc',
                isActive: true,
                deadline: '2026-03-31',
                matchScore: 82,
                applicationStatus: 'available'
            },
            {
                schemeId: 'SOIL-HEALTH-2024',
                schemeName: 'Soil Health Card Scheme',
                description: 'Free soil testing and health card for farmers',
                benefits: ['Free soil testing', 'Customized fertilizer recommendations', 'Improved crop yield'],
                eligibility: ['All farmers'],
                state: 'All India',
                category: 'Subsidy',
                department: 'Ministry of Agriculture and Farmers Welfare',
                applicationProcess: 'Through agriculture department offices',
                documentsRequired: ['Aadhaar Card', 'Land Documents'],
                websiteUrl: 'https://soilhealth.dac.gov.in',
                isActive: true,
                deadline: '2025-09-30',
                matchScore: 78,
                applicationStatus: 'available'
            },
            {
                schemeId: 'PMKSY-2024',
                schemeName: 'Pradhan Mantri Krishi Sinchayee Yojana',
                description: 'Irrigation scheme to improve water use efficiency',
                benefits: ['Subsidy on drip/sprinkler irrigation', 'Water conservation', 'Improved productivity'],
                eligibility: ['All farmers', 'Priority to small and marginal farmers'],
                state: 'All India',
                category: 'Infrastructure',
                department: 'Ministry of Agriculture and Farmers Welfare',
                applicationProcess: 'Through state agriculture departments',
                documentsRequired: ['Aadhaar Card', 'Land Documents', 'Bank Account'],
                websiteUrl: 'https://pmksy.gov.in',
                isActive: true,
                deadline: '2025-08-15',
                matchScore: 85,
                applicationStatus: 'available'
            }
        ];

        for (const scheme of schemes) {
            try {
                const existing = await GovernmentSchemeModel.findOne({ schemeId: scheme.schemeId });
                if (!existing) {
                    await GovernmentSchemeModel.create(scheme);
                    console.log(`  ✅ Created scheme: ${scheme.schemeName}`);
                } else {
                    console.log(`  ⏭️  Scheme already exists: ${scheme.schemeName}`);
                }
            } catch (error: any) {
                console.error(`  ❌ Error creating scheme ${scheme.schemeName}:`, error.message);
            }
        }

        // Seed Market Prices
        console.log('\n📝 Seeding Market Prices...');
        const today = new Date();
        const prices = [
            {
                commodity: 'Wheat',
                variety: 'HD-2967',
                market: 'Delhi',
                state: 'Delhi',
                district: 'Central Delhi',
                minPrice: 2000,
                maxPrice: 2200,
                modalPrice: 2100,
                priceDate: today,
                arrivals: 500,
                source: 'agmarknet'
            },
            {
                commodity: 'Rice',
                variety: 'Basmati',
                market: 'Karnal',
                state: 'Haryana',
                district: 'Karnal',
                minPrice: 3500,
                maxPrice: 4000,
                modalPrice: 3750,
                priceDate: today,
                arrivals: 800,
                source: 'agmarknet'
            },
            {
                commodity: 'Tomato',
                variety: 'Hybrid',
                market: 'Azadpur',
                state: 'Delhi',
                district: 'North Delhi',
                minPrice: 2000,
                maxPrice: 2500,
                modalPrice: 2250,
                priceDate: today,
                arrivals: 1200,
                source: 'agmarknet'
            },
            {
                commodity: 'Onion',
                variety: 'Red',
                market: 'Nashik',
                state: 'Maharashtra',
                district: 'Nashik',
                minPrice: 1500,
                maxPrice: 1800,
                modalPrice: 1650,
                priceDate: today,
                arrivals: 2000,
                source: 'agmarknet'
            },
            {
                commodity: 'Potato',
                variety: 'Local',
                market: 'Agra',
                state: 'Uttar Pradesh',
                district: 'Agra',
                minPrice: 1000,
                maxPrice: 1200,
                modalPrice: 1100,
                priceDate: today,
                arrivals: 1500,
                source: 'agmarknet'
            }
        ];

        for (const price of prices) {
            try {
                const existing = await MarketPriceModel.findOne({
                    commodity: price.commodity,
                    market: price.market,
                    priceDate: price.priceDate
                });

                if (!existing) {
                    await MarketPriceModel.create(price);
                    console.log(`  ✅ Created price: ${price.commodity} at ${price.market}`);
                } else {
                    console.log(`  ⏭️  Price already exists: ${price.commodity} at ${price.market}`);
                }
            } catch (error: any) {
                console.error(`  ❌ Error creating price ${price.commodity}:`, error.message);
            }
        }

        // Seed Crop Information
        console.log('\n📝 Seeding Crop Information...');
        const crops = [
            {
                cropName: 'Wheat',
                scientificName: 'Triticum aestivum',
                category: 'cereal',
                season: ['rabi'],
                duration: 120,
                soilType: ['Loamy', 'Clay loam', 'Sandy loam'],
                climate: 'Cool and moist during growing season, warm and dry during ripening',
                waterRequirement: 'medium',
                fertilizers: ['Urea', 'DAP', 'Potash'],
                commonDiseases: ['Rust', 'Smut', 'Blight'],
                commonPests: ['Aphids', 'Termites', 'Army worm'],
                harvestingTips: 'Harvest when grain moisture is 20-25%',
                storageInfo: 'Store in cool, dry place with moisture below 12%',
                marketDemand: 'High demand throughout the year'
            },
            {
                cropName: 'Rice',
                scientificName: 'Oryza sativa',
                category: 'cereal',
                season: ['kharif'],
                duration: 120,
                soilType: ['Clay', 'Clay loam'],
                climate: 'Hot and humid with high rainfall',
                waterRequirement: 'high',
                fertilizers: ['Urea', 'DAP', 'Zinc sulfate'],
                commonDiseases: ['Blast', 'Bacterial blight', 'Sheath blight'],
                commonPests: ['Stem borer', 'Leaf folder', 'Brown plant hopper'],
                harvestingTips: 'Harvest when 80% of grains turn golden yellow',
                storageInfo: 'Dry to 14% moisture before storage',
                marketDemand: 'Very high demand, staple food'
            },
            {
                cropName: 'Cotton',
                scientificName: 'Gossypium',
                category: 'fiber',
                season: ['kharif'],
                duration: 180,
                soilType: ['Black soil', 'Alluvial soil'],
                climate: 'Warm and sunny with moderate rainfall',
                waterRequirement: 'medium',
                fertilizers: ['Urea', 'SSP', 'Muriate of potash'],
                commonDiseases: ['Wilt', 'Boll rot', 'Leaf curl'],
                commonPests: ['Bollworm', 'Aphids', 'Whitefly'],
                harvestingTips: 'Pick when bolls are fully open',
                storageInfo: 'Store in dry conditions to prevent moisture damage',
                marketDemand: 'High demand for textile industry'
            },
            {
                cropName: 'Sugarcane',
                scientificName: 'Saccharum officinarum',
                category: 'other',
                season: ['perennial'],
                duration: 365,
                soilType: ['Loamy', 'Clay loam', 'Black soil'],
                climate: 'Hot and humid with high rainfall',
                waterRequirement: 'high',
                fertilizers: ['Urea', 'SSP', 'Potash'],
                commonDiseases: ['Red rot', 'Smut', 'Wilt'],
                commonPests: ['Borer', 'Aphids', 'Whitefly'],
                harvestingTips: 'Harvest at 10-12 months when sugar content is maximum',
                storageInfo: 'Process immediately after harvest',
                marketDemand: 'High demand for sugar production'
            },
            {
                cropName: 'Tomato',
                scientificName: 'Solanum lycopersicum',
                category: 'vegetable',
                season: ['kharif', 'rabi'],
                duration: 90,
                soilType: ['Loamy', 'Sandy loam'],
                climate: 'Warm and sunny with moderate rainfall',
                waterRequirement: 'medium',
                fertilizers: ['Urea', 'DAP', 'Potash'],
                commonDiseases: ['Early blight', 'Late blight', 'Wilt'],
                commonPests: ['Fruit borer', 'Whitefly', 'Aphids'],
                harvestingTips: 'Harvest when fruits turn red',
                storageInfo: 'Store at 10-15°C for 1-2 weeks',
                marketDemand: 'Very high demand year-round'
            }
        ];

        for (const crop of crops) {
            try {
                const existing = await CropInfoModel.findOne({ cropName: crop.cropName });
                if (!existing) {
                    await CropInfoModel.create(crop);
                    console.log(`  ✅ Created crop: ${crop.cropName}`);
                } else {
                    console.log(`  ⏭️  Crop already exists: ${crop.cropName}`);
                }
            } catch (error: any) {
                console.error(`  ❌ Error creating crop ${crop.cropName}:`, error.message);
            }
        }

        // Seed Weather Data
        console.log('\n📝 Seeding Weather Data...');
        const weatherData = [
            {
                location: 'Delhi',
                coordinates: { latitude: 28.7041, longitude: 77.1025 },
                temperature: { min: 25, max: 35, avg: 30 },
                humidity: 65,
                rainfall: 10,
                windSpeed: 15,
                forecast: [
                    {
                        date: new Date(Date.now() + 86400000),
                        temperature: { min: 26, max: 36, avg: 31 },
                        humidity: 60,
                        rainfall: 5,
                        condition: 'Partly Cloudy'
                    },
                    {
                        date: new Date(Date.now() + 172800000),
                        temperature: { min: 25, max: 34, avg: 29 },
                        humidity: 70,
                        rainfall: 15,
                        condition: 'Light Rain'
                    }
                ],
                recordDate: today,
                source: 'IMD'
            },
            {
                location: 'Mumbai',
                coordinates: { latitude: 19.0760, longitude: 72.8777 },
                temperature: { min: 27, max: 32, avg: 29 },
                humidity: 80,
                rainfall: 25,
                windSpeed: 20,
                forecast: [
                    {
                        date: new Date(Date.now() + 86400000),
                        temperature: { min: 27, max: 33, avg: 30 },
                        humidity: 75,
                        rainfall: 20,
                        condition: 'Cloudy'
                    }
                ],
                recordDate: today,
                source: 'IMD'
            },
            {
                location: 'Bangalore',
                coordinates: { latitude: 12.9716, longitude: 77.5946 },
                temperature: { min: 22, max: 28, avg: 25 },
                humidity: 70,
                rainfall: 5,
                windSpeed: 10,
                forecast: [
                    {
                        date: new Date(Date.now() + 86400000),
                        temperature: { min: 21, max: 27, avg: 24 },
                        humidity: 72,
                        rainfall: 8,
                        condition: 'Pleasant'
                    }
                ],
                recordDate: today,
                source: 'IMD'
            }
        ];

        for (const weather of weatherData) {
            try {
                const existing = await WeatherDataModel.findOne({
                    location: weather.location,
                    recordDate: weather.recordDate
                });

                if (!existing) {
                    await WeatherDataModel.create(weather);
                    console.log(`  ✅ Created weather data: ${weather.location}`);
                } else {
                    console.log(`  ⏭️  Weather data already exists: ${weather.location}`);
                }
            } catch (error: any) {
                console.error(`  ❌ Error creating weather data ${weather.location}:`, error.message);
            }
        }

        console.log('\n✅ Database seeding completed successfully!');

        // Show counts
        const schemeCount = await GovernmentSchemeModel.countDocuments();
        const priceCount = await MarketPriceModel.countDocuments();
        const cropCount = await CropInfoModel.countDocuments();
        const weatherCount = await WeatherDataModel.countDocuments();

        console.log('\n📊 Database Summary:');
        console.log(`   Government Schemes: ${schemeCount}`);
        console.log(`   Market Prices: ${priceCount}`);
        console.log(`   Crop Information: ${cropCount}`);
        console.log(`   Weather Data: ${weatherCount}`);

    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n📡 Disconnected from MongoDB.');
    }
}

seedDatabase();
