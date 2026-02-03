import cron from 'node-cron';
import { marketPriceAIService } from '../services/marketPriceAI.service.js';

/**
 * Cron job to fetch market prices daily at midnight IST
 * Schedule: 0 0 * * * (Every day at 12:00 AM)
 */
export function initializePriceFetchCron() {
    console.log('📅 Initializing market price fetch cron job...');

    // Schedule for midnight IST (18:30 UTC = 00:00 IST)
    // Cron format: minute hour day month weekday
    // 30 18 * * * = 6:30 PM UTC = 12:00 AM IST (UTC+5:30)
    const cronSchedule = '30 18 * * *';

    cron.schedule(cronSchedule, async () => {
        console.log('\n🕐 Cron job triggered: Fetching daily market prices...');
        console.log(`Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`);

        try {
            const result = await marketPriceAIService.generateDailyMarketPrices();

            if (result.success) {
                console.log(`✅ Cron job completed successfully: ${result.count} prices generated`);
            } else {
                console.error(`❌ Cron job failed: ${result.error}`);
                // TODO: Add notification/alert system for failures
            }
        } catch (error) {
            console.error('❌ Cron job error:', error);
            // TODO: Add error reporting/monitoring
        }
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log(`✅ Market price cron job scheduled for midnight IST (${cronSchedule} UTC)`);
    console.log('   Next run will be at 12:00 AM IST');

    // Optional: Run immediately on startup if prices are stale
    checkAndRunIfNeeded();
}

/**
 * Check if prices need refresh and run immediately if needed
 */
async function checkAndRunIfNeeded() {
    try {
        const needsRefresh = await marketPriceAIService.needsRefresh();

        if (needsRefresh) {
            console.log('⚠️  Market prices are stale or missing. Running fetch now...');
            const result = await marketPriceAIService.generateDailyMarketPrices();

            if (result.success) {
                console.log(`✅ Initial price fetch completed: ${result.count} prices generated`);
            } else {
                console.error(`❌ Initial price fetch failed: ${result.error}`);
            }
        } else {
            console.log('✅ Market prices are up to date. No immediate fetch needed.');
        }
    } catch (error) {
        console.error('Error checking price freshness:', error);
    }
}

/**
 * Manual trigger for testing (call this from controller)
 */
export async function triggerManualPriceFetch() {
    console.log('🔧 Manual price fetch triggered...');
    return await marketPriceAIService.generateDailyMarketPrices();
}
