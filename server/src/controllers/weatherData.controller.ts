import { Request, Response } from 'express';
import { WeatherDataModel } from '../models/WeatherData.js';
import { UserModel } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

/** Resolve Firebase UID or MongoDB ObjectId to a MongoDB ObjectId */
async function resolveMongoId(userId: string): Promise<mongoose.Types.ObjectId | null> {
    if (mongoose.Types.ObjectId.isValid(userId)) {
        return new mongoose.Types.ObjectId(userId);
    }
    const user = await UserModel.findOne({ firebaseUid: userId }).lean();
    if (!user) return null;
    return user._id as mongoose.Types.ObjectId;
}

// Get current weather for a location
export const getCurrentWeather = async (req: Request, res: Response) => {
    try {
        const { location } = req.query;

        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }

        // Get most recent weather data for location
        const weather = await WeatherDataModel
            .findOne({ location: new RegExp(String(location), 'i') })
            .sort({ recordDate: -1 });

        if (!weather) {
            return res.status(404).json({ error: 'Weather data not found for this location' });
        }

        console.log(`🌤️  Fetched weather for ${weather.location}`);
        res.json(weather);
    } catch (error) {
        console.error('Error fetching weather:', error);
        res.status(500).json({ error: 'Failed to fetch weather data' });
    }
};

// Save weather data (requires authentication — scoped to the authenticated user)
export const saveWeatherData = async (req: AuthRequest, res: Response) => {
    try {
        const rawUserId = req.user?.id;
        if (!rawUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const mongoId = await resolveMongoId(rawUserId);
        if (!mongoId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const weatherData = req.body;

        if (!weatherData.location || !weatherData.temperature) {
            return res.status(400).json({ error: 'Location and temperature are required' });
        }

        const weather = await WeatherDataModel.create({ ...weatherData, userId: mongoId });

        console.log(`💾 Saved weather data for ${weather.location}`);
        res.status(201).json(weather);
    } catch (error) {
        console.error('Error saving weather data:', error);
        res.status(500).json({ error: 'Failed to save weather data' });
    }
};

// Get weather forecast
export const getWeatherForecast = async (req: Request, res: Response) => {
    try {
        const { location } = req.query;

        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }

        const weather = await WeatherDataModel
            .findOne({ location: new RegExp(String(location), 'i') })
            .sort({ recordDate: -1 });

        if (!weather || !weather.forecast || weather.forecast.length === 0) {
            return res.status(404).json({ error: 'Forecast data not available' });
        }

        console.log(`📅 Fetched forecast for ${weather.location}`);
        res.json({
            location: weather.location,
            forecast: weather.forecast,
            recordDate: weather.recordDate
        });
    } catch (error) {
        console.error('Error fetching forecast:', error);
        res.status(500).json({ error: 'Failed to fetch forecast' });
    }
};

// Get weather history for a location
export const getWeatherHistory = async (req: Request, res: Response) => {
    try {
        const { location, days = 7 } = req.query;

        if (!location) {
            return res.status(400).json({ error: 'Location is required' });
        }

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - Number(days));

        const history = await WeatherDataModel
            .find({
                location: new RegExp(String(location), 'i'),
                recordDate: { $gte: daysAgo }
            })
            .sort({ recordDate: -1 });

        console.log(`📊 Fetched ${history.length} weather records for ${location}`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching weather history:', error);
        res.status(500).json({ error: 'Failed to fetch weather history' });
    }
};

// Get user's weather preferences and saved locations
export const getUserWeatherPreferences = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Get user profile to find their default location
        const { UserModel } = await import('../models/User.js');
        const user = await UserModel.findById(userId).select('location farmLocation');
        
        // Get recent weather data for user's location
        let recentWeather = null;
        if (user?.location || user?.farmLocation?.address) {
            const location = user.farmLocation?.address || user.location;
            recentWeather = await WeatherDataModel
                .findOne({ location: new RegExp(location as string, 'i') })
                .sort({ recordDate: -1 })
                .limit(5);
        }

        res.json({
            defaultLocation: user?.location || user?.farmLocation?.address || null,
            recentWeather,
            preferences: {
                temperatureUnit: 'celsius', // Can be extended
                autoRefresh: true
            }
        });
    } catch (error) {
        console.error('Error fetching user weather preferences:', error);
        res.status(500).json({ error: 'Failed to fetch weather preferences' });
    }
};

// Save weather data with user association
export const saveUserWeatherData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const weatherData = {
            ...req.body,
            userId: mongoId
        };

        if (!weatherData.location || !weatherData.temperature) {
            return res.status(400).json({ error: 'Location and temperature are required' });
        }

        const weather = await WeatherDataModel.create(weatherData);

        console.log(`💾 Saved weather data for ${weather.location} (User: ${userId})`);
        res.status(201).json(weather);
    } catch (error) {
        console.error('Error saving weather data:', error);
        res.status(500).json({ error: 'Failed to save weather data' });
    }
};

// Get weather history for a user
export const getUserWeatherHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { days = 7 } = req.query;

        const daysAgo = new Date();
        daysAgo.setDate(daysAgo.getDate() - Number(days));

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) {
            return res.json([]); // New user with no history
        }

        const history = await WeatherDataModel
            .find({
                userId: mongoId,
                recordDate: { $gte: daysAgo }
            })
            .sort({ recordDate: -1 });

        console.log(`📊 Fetched ${history.length} weather records for user ${userId}`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching user weather history:', error);
        res.status(500).json({ error: 'Failed to fetch weather history' });
    }
};

// Delete old weather data for the authenticated user
export const cleanupOldWeatherData = async (req: AuthRequest, res: Response) => {
    try {
        const rawUserId = req.user?.id;
        if (!rawUserId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const mongoId = await resolveMongoId(rawUserId);
        if (!mongoId) {
            return res.status(404).json({ error: 'User not found' });
        }

        const { daysToKeep = 30 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

        const result = await WeatherDataModel.deleteMany({
            userId: mongoId,
            recordDate: { $lt: cutoffDate }
        });

        console.log(`🗑️  Deleted ${result.deletedCount} old weather records for user ${rawUserId}`);
        res.json({
            message: 'Cleanup completed',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error cleaning up weather data:', error);
        res.status(500).json({ error: 'Failed to cleanup weather data' });
    }
};
