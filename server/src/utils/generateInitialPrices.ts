/**
 * Quick script to trigger AI price generation
 * Run this to populate the database with initial AI prices
 */

import '../loadEnv.js';
import { connectDatabase, disconnectDatabase } from '../config/database.js';
import { marketPriceAIService } from '../services/marketPriceAI.service.js';

const generatePrices = async () => {
    try {
        console.log('🚀 Triggering AI price generation...\n');

        // Connect to database
        await connectDatabase();

        // Generate prices
        const result = await marketPriceAIService.generateDailyMarketPrices();

        if (result.success) {
            console.log(`\n✅ Successfully generated ${result.count} market prices!`);
            console.log('\n📊 You can now view these prices in the frontend.');
        } else {
            console.error(`\n❌ Failed to generate prices: ${result.error}`);
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await disconnectDatabase();
        process.exit(0);
    }
};

// Run the script
generatePrices();
