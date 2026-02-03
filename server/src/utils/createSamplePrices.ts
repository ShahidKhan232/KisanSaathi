/**
 * Create sample AI-generated prices to test the UI
 * This creates realistic sample data without calling the Gemini API
 */

import '../loadEnv.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { MarketPriceModel } from '../models/index.js';

const samplePrices = [
    // Wheat
    { commodity: 'Wheat', variety: 'Durum', market: 'Azadpur Mandi', state: 'Delhi', district: 'New Delhi', minPrice: 2200, maxPrice: 2400, modalPrice: 2300 },
    { commodity: 'Wheat', variety: 'Lokwan', market: 'Kota Mandi', state: 'Rajasthan', district: 'Kota', minPrice: 2100, maxPrice: 2300, modalPrice: 2200 },
    { commodity: 'Wheat', variety: 'Sharbati', market: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', minPrice: 2250, maxPrice: 2450, modalPrice: 2350 },

    // Rice
    { commodity: 'Rice', variety: 'Basmati', market: 'Karnal Mandi', state: 'Haryana', district: 'Karnal', minPrice: 3800, maxPrice: 4200, modalPrice: 4000 },
    { commodity: 'Rice', variety: 'Sona Masuri', market: 'Guntur Mandi', state: 'Andhra Pradesh', district: 'Guntur', minPrice: 3200, maxPrice: 3600, modalPrice: 3400 },
    { commodity: 'Rice', variety: 'IR-64', market: 'Thanjavur Mandi', state: 'Tamil Nadu', district: 'Thanjavur', minPrice: 2800, maxPrice: 3200, modalPrice: 3000 },

    // Onion
    { commodity: 'Onion', variety: 'Red', market: 'Lasalgaon Mandi', state: 'Maharashtra', district: 'Nashik', minPrice: 1200, maxPrice: 1600, modalPrice: 1400 },
    { commodity: 'Onion', variety: 'White', market: 'Azadpur Mandi', state: 'Delhi', district: 'New Delhi', minPrice: 1400, maxPrice: 1800, modalPrice: 1600 },
    { commodity: 'Onion', variety: 'Red', market: 'Bangalore Mandi', state: 'Karnataka', district: 'Bangalore', minPrice: 1300, maxPrice: 1700, modalPrice: 1500 },

    // Potato
    { commodity: 'Potato', variety: 'Jyoti', market: 'Agra Mandi', state: 'Uttar Pradesh', district: 'Agra', minPrice: 800, maxPrice: 1200, modalPrice: 1000 },
    { commodity: 'Potato', variety: 'Kufri', market: 'Jalandhar Mandi', state: 'Punjab', district: 'Jalandhar', minPrice: 900, maxPrice: 1300, modalPrice: 1100 },
    { commodity: 'Potato', variety: 'Local', market: 'Kolkata Mandi', state: 'West Bengal', district: 'Kolkata', minPrice: 850, maxPrice: 1150, modalPrice: 1000 },

    // Tomato
    { commodity: 'Tomato', variety: 'Hybrid', market: 'Koyambedu Market', state: 'Tamil Nadu', district: 'Chennai', minPrice: 1500, maxPrice: 2000, modalPrice: 1750 },
    { commodity: 'Tomato', variety: 'Local', market: 'Pune Mandi', state: 'Maharashtra', district: 'Pune', minPrice: 1400, maxPrice: 1900, modalPrice: 1650 },
    { commodity: 'Tomato', variety: 'Hybrid', market: 'Azadpur Mandi', state: 'Delhi', district: 'New Delhi', minPrice: 1600, maxPrice: 2100, modalPrice: 1850 },

    // Cotton
    { commodity: 'Cotton', variety: 'MCU-5', market: 'Guntur Mandi', state: 'Andhra Pradesh', district: 'Guntur', minPrice: 5800, maxPrice: 6400, modalPrice: 6100 },
    { commodity: 'Cotton', variety: 'Shankar-6', market: 'Akola Mandi', state: 'Maharashtra', district: 'Akola', minPrice: 5700, maxPrice: 6300, modalPrice: 6000 },
    { commodity: 'Cotton', variety: 'Hybrid', market: 'Rajkot Mandi', state: 'Gujarat', district: 'Rajkot', minPrice: 5900, maxPrice: 6500, modalPrice: 6200 },

    // Soybean
    { commodity: 'Soybean', variety: 'JS-335', market: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', minPrice: 4200, maxPrice: 4600, modalPrice: 4400 },
    { commodity: 'Soybean', variety: 'JS-95-60', market: 'Latur Mandi', state: 'Maharashtra', district: 'Latur', minPrice: 4100, maxPrice: 4500, modalPrice: 4300 },
    { commodity: 'Soybean', variety: 'Local', market: 'Bhopal Mandi', state: 'Madhya Pradesh', district: 'Bhopal', minPrice: 4150, maxPrice: 4550, modalPrice: 4350 },

    // Maize
    { commodity: 'Maize', variety: 'Hybrid', market: 'Davangere Mandi', state: 'Karnataka', district: 'Davangere', minPrice: 1800, maxPrice: 2200, modalPrice: 2000 },
    { commodity: 'Maize', variety: 'Local', market: 'Nizamabad Mandi', state: 'Telangana', district: 'Nizamabad', minPrice: 1750, maxPrice: 2150, modalPrice: 1950 },
    { commodity: 'Maize', variety: 'Yellow', market: 'Udaipur Mandi', state: 'Rajasthan', district: 'Udaipur', minPrice: 1850, maxPrice: 2250, modalPrice: 2050 },

    // Gram (Chickpea)
    { commodity: 'Gram', variety: 'Desi', market: 'Bikaner Mandi', state: 'Rajasthan', district: 'Bikaner', minPrice: 5200, maxPrice: 5800, modalPrice: 5500 },
    { commodity: 'Gram', variety: 'Kabuli', market: 'Jaipur Mandi', state: 'Rajasthan', district: 'Jaipur', minPrice: 5400, maxPrice: 6000, modalPrice: 5700 },
    { commodity: 'Gram', variety: 'Desi', market: 'Gulbarga Mandi', state: 'Karnataka', district: 'Gulbarga', minPrice: 5300, maxPrice: 5900, modalPrice: 5600 },

    // Tur (Pigeon Pea)
    { commodity: 'Tur', variety: 'Local', market: 'Latur Mandi', state: 'Maharashtra', district: 'Latur', minPrice: 6800, maxPrice: 7400, modalPrice: 7100 },
    { commodity: 'Tur', variety: 'Hybrid', market: 'Gulbarga Mandi', state: 'Karnataka', district: 'Gulbarga', minPrice: 6900, maxPrice: 7500, modalPrice: 7200 },
    { commodity: 'Tur', variety: 'Local', market: 'Indore Mandi', state: 'Madhya Pradesh', district: 'Indore', minPrice: 6850, maxPrice: 7450, modalPrice: 7150 },

    // Mustard
    { commodity: 'Mustard', variety: 'Black', market: 'Alwar Mandi', state: 'Rajasthan', district: 'Alwar', minPrice: 5500, maxPrice: 6100, modalPrice: 5800 },
    { commodity: 'Mustard', variety: 'Yellow', market: 'Bharatpur Mandi', state: 'Rajasthan', district: 'Bharatpur', minPrice: 5400, maxPrice: 6000, modalPrice: 5700 },
    { commodity: 'Mustard', variety: 'Local', market: 'Hisar Mandi', state: 'Haryana', district: 'Hisar', minPrice: 5450, maxPrice: 6050, modalPrice: 5750 },
];

const createSamplePrices = async () => {
    try {
        console.log('🌱 Creating sample AI-generated prices...\n');

        await connectDatabase();

        // Delete existing AI-generated prices
        const deleteResult = await MarketPriceModel.deleteMany({ source: 'other' });
        console.log(`🗑️  Deleted ${deleteResult.deletedCount} existing AI prices\n`);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Create sample prices
        const priceDocuments = samplePrices.map(price => ({
            ...price,
            priceDate: today,
            source: 'other' as const,
            fetchedAt: new Date()
        }));

        await MarketPriceModel.insertMany(priceDocuments);

        console.log(`✅ Successfully created ${priceDocuments.length} sample AI-generated prices!`);
        console.log('\n📊 Sample data includes:');
        console.log('   - Wheat (3 markets)');
        console.log('   - Rice (3 markets)');
        console.log('   - Onion (3 markets)');
        console.log('   - Potato (3 markets)');
        console.log('   - Tomato (3 markets)');
        console.log('   - Cotton (3 markets)');
        console.log('   - Soybean (3 markets)');
        console.log('   - Maize (3 markets)');
        console.log('   - Gram (3 markets)');
        console.log('   - Tur (3 markets)');
        console.log('   - Mustard (3 markets)');
        console.log('\n🎉 You can now view these prices in the frontend!');

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await disconnectDatabase();
        process.exit(0);
    }
};

createSamplePrices();
