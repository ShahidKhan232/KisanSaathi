import { Request, Response } from 'express';
import { WeatherDataModel } from '../models/WeatherData.js';

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

// Save weather data (typically called by backend service/cron job)
export const saveWeatherData = async (req: Request, res: Response) => {
    try {
        const weatherData = req.body;

        if (!weatherData.location || !weatherData.temperature) {
            return res.status(400).json({ error: 'Location and temperature are required' });
        }

        const weather = await WeatherDataModel.create(weatherData);

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

// Delete old weather data (cleanup - can be called by cron job)
export const cleanupOldWeatherData = async (req: Request, res: Response) => {
    try {
        const { daysToKeep = 30 } = req.query;

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - Number(daysToKeep));

        const result = await WeatherDataModel.deleteMany({
            recordDate: { $lt: cutoffDate }
        });

        console.log(`🗑️  Deleted ${result.deletedCount} old weather records`);
        res.json({
            message: 'Cleanup completed',
            deletedCount: result.deletedCount
        });
    } catch (error) {
        console.error('Error cleaning up weather data:', error);
        res.status(500).json({ error: 'Failed to cleanup weather data' });
    }
};
