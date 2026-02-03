import { Router } from 'express';
import { authRequired } from '../middleware/auth.js';
import {
    getCurrentWeather,
    saveWeatherData,
    getWeatherForecast,
    getWeatherHistory,
    getUserWeatherPreferences,
    saveUserWeatherData,
    getUserWeatherHistory,
    cleanupOldWeatherData
} from '../controllers/weatherData.controller.js';

const router = Router();

// Public routes - anyone can view weather data
router.get('/current', getCurrentWeather);
router.get('/forecast', getWeatherForecast);
router.get('/history', getWeatherHistory);

// User-specific routes - require authentication
router.get('/user/preferences', authRequired, getUserWeatherPreferences);
router.get('/user/history', authRequired, getUserWeatherHistory);
router.post('/user', authRequired, saveUserWeatherData);

// Admin/Service routes - for saving and managing weather data
router.post('/', saveWeatherData);
router.delete('/cleanup', cleanupOldWeatherData);

export default router;
