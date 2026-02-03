import { Response } from 'express';
import { MarketPriceModel } from '../models/MarketPrice.js';
import { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

// Get current market prices with filters
export const getCurrentMarketPrices = async (req: AuthRequest, res: Response) => {
    try {
        const {
            commodity,
            state,
            district,
            market,
            limit = 50,
            skip = 0
        } = req.query;

        const query: any = {};

        if (commodity) {
            query.commodity = new RegExp(String(commodity), 'i');
        }
        if (state) {
            query.state = new RegExp(String(state), 'i');
        }
        if (district) {
            query.district = new RegExp(String(district), 'i');
        }
        if (market) {
            query.market = new RegExp(String(market), 'i');
        }

        // Get latest prices (most recent first)
        const prices = await MarketPriceModel
            .find(query)
            .sort({ priceDate: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        console.log(`📊 Fetched ${prices.length} market price records`);
        res.json(prices);
    } catch (error) {
        console.error('Error fetching market prices:', error);
        res.status(500).json({ error: 'Failed to fetch market prices' });
    }
};

// Get price history for a specific commodity
export const getPriceHistory = async (req: AuthRequest, res: Response) => {
    try {
        const { commodity, market, state, days = 30 } = req.query;

        if (!commodity) {
            return res.status(400).json({ error: 'Commodity is required' });
        }

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - Number(days));

        const query: any = {
            commodity: new RegExp(String(commodity), 'i'),
            priceDate: { $gte: daysAgo }
        };

        if (market) {
            query.market = new RegExp(String(market), 'i');
        }
        if (state) {
            query.state = new RegExp(String(state), 'i');
        }

        const history = await MarketPriceModel
            .find(query)
            .sort({ priceDate: -1 });

        console.log(`📈 Fetched ${history.length} price history records for ${commodity}`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching price history:', error);
        res.status(500).json({ error: 'Failed to fetch price history' });
    }
};

// Get user's preferred market prices based on their profile
export const getUserPreferredPrices = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user profile to find their crops and location
        const { UserModel } = await import('../models/User.js');
        const user = await UserModel.findById(userId).select('crops location state');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const query: any = {};

        // If user has crops, get prices for those crops
        if (user.crops && user.crops.length > 0) {
            query.commodity = { $in: user.crops.map(crop => new RegExp(crop, 'i')) };
        }

        // If user has location, prioritize local markets
        if (user.location) {
            query.state = new RegExp(user.location as string, 'i');
        }

        // Get latest prices for user's preferences
        const prices = await MarketPriceModel
            .find(query)
            .sort({ priceDate: -1 })
            .limit(20);

        console.log(`🎯 Fetched ${prices.length} preferred prices for user ${userId}`);
        res.json({
            userCrops: user.crops || [],
            userLocation: user.location,
            prices
        });
    } catch (error) {
        console.error('Error fetching user preferred prices:', error);
        res.status(500).json({ error: 'Failed to fetch preferred prices' });
    }
};

// Save market price data (typically called by backend service/cron job)
export const saveMarketPrice = async (req: AuthRequest, res: Response) => {
    try {
        const priceData = req.body;

        if (!priceData.commodity || !priceData.market || !priceData.modalPrice) {
            return res.status(400).json({
                error: 'Commodity, market, and modal price are required'
            });
        }

        // Check for existing record to prevent duplicates
        const existing = await MarketPriceModel.findOne({
            commodity: new RegExp(priceData.commodity, 'i'),
            market: new RegExp(priceData.market, 'i'),
            priceDate: new Date(priceData.priceDate)
        });

        if (existing) {
            // Update existing record
            Object.assign(existing, priceData);
            await existing.save();
            console.log(`🔄 Updated market price for ${priceData.commodity} at ${priceData.market}`);
            res.json(existing);
        } else {
            // Create new record
            const price = await MarketPriceModel.create(priceData);
            console.log(`💾 Saved new market price for ${priceData.commodity} at ${priceData.market}`);
            res.status(201).json(price);
        }
    } catch (error) {
        console.error('Error saving market price:', error);
        res.status(500).json({ error: 'Failed to save market price' });
    }
};

// Get price statistics and trends
export const getPriceStatistics = async (req: AuthRequest, res: Response) => {
    try {
        const { commodity, state, period = 30 } = req.query;

        if (!commodity) {
            return res.status(400).json({ error: 'Commodity is required' });
        }

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - Number(period));

        const matchStage: any = {
            commodity: new RegExp(String(commodity), 'i'),
            priceDate: { $gte: daysAgo }
        };

        if (state) {
            matchStage.state = new RegExp(String(state), 'i');
        }

        const stats = await MarketPriceModel.aggregate([
            { $match: matchStage },
            {
                $group: {
                    _id: {
                        commodity: '$commodity',
                        market: '$market',
                        state: '$state'
                    },
                    avgModalPrice: { $avg: '$modalPrice' },
                    minModalPrice: { $min: '$modalPrice' },
                    maxModalPrice: { $max: '$modalPrice' },
                    latestPrice: { $first: '$modalPrice' },
                    priceChange: {
                        $subtract: [
                            { $first: '$modalPrice' },
                            { $last: '$modalPrice' }
                        ]
                    } as any,
                    dataPoints: { $sum: 1 }
                }
            },
            {
                $project: {
                    _id: 0,
                    commodity: '$_id.commodity',
                    market: '$_id.market',
                    state: '$_id.state',
                    avgModalPrice: { $round: ['$avgModalPrice', 2] },
                    minModalPrice: { $round: ['$minModalPrice', 2] },
                    maxModalPrice: { $round: ['$maxModalPrice', 2] },
                    latestPrice: { $round: ['$latestPrice', 2] },
                    priceChange: { $round: ['$priceChange', 2] },
                    dataPoints: 1
                }
            },
            { $sort: { latestPrice: -1 } }
        ]);

        console.log(`📊 Generated price statistics for ${commodity}`);
        res.json({
            commodity,
            period: `${period} days`,
            statistics: stats
        });
    } catch (error) {
        console.error('Error generating price statistics:', error);
        res.status(500).json({ error: 'Failed to generate price statistics' });
    }
};

// Delete old price data (cleanup - can be called by cron job)
export const cleanupOldPriceData = async (req: AuthRequest, res: Response) => {
    try {
        const { daysToKeep = 90 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

        const result = await MarketPriceModel.deleteMany({
            priceDate: { $lt: cutoffDate }
        });

        console.log(`🗑️  Deleted ${result.deletedCount} old price records`);
        res.json({
            message: 'Price data cleanup completed',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error cleaning up price data:', error);
        res.status(500).json({ error: 'Failed to cleanup price data' });
    }
};

// Fetch daily prices from AI (manual trigger for testing/admin)
export const fetchDailyPricesFromAI = async (req: AuthRequest, res: Response) => {
    try {
        console.log('🤖 Manual AI price fetch triggered by user');

        const { marketPriceAIService } = await import('../services/marketPriceAI.service.js');
        const result = await marketPriceAIService.generateDailyMarketPrices();

        if (result.success) {
            res.json({
                success: true,
                message: `Successfully generated ${result.count} market prices`,
                count: result.count,
                timestamp: new Date()
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Failed to generate market prices',
                error: result.error
            });
        }
    } catch (error) {
        console.error('Error in manual AI price fetch:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch prices from AI',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Get AI price generation status
export const getAIPriceStatus = async (req: AuthRequest, res: Response) => {
    try {
        const { marketPriceAIService } = await import('../services/marketPriceAI.service.js');

        const lastFetchTime = await marketPriceAIService.getLastFetchTime();
        const needsRefresh = await marketPriceAIService.needsRefresh();

        // Get count of AI-generated prices
        const aiPriceCount = await MarketPriceModel.countDocuments({ source: 'other' });

        res.json({
            lastFetchTime,
            needsRefresh,
            aiGeneratedPriceCount: aiPriceCount,
            nextScheduledFetch: 'Midnight IST (00:00)',
            status: needsRefresh ? 'stale' : 'fresh'
        });
    } catch (error) {
        console.error('Error getting AI price status:', error);
        res.status(500).json({ error: 'Failed to get AI price status' });
    }
};
