import { Router } from 'express';
import {
    getCurrentWeather,
    saveWeatherData,
    getWeatherForecast,
    getWeatherHistory,
    cleanupOldWeatherData
} from '../controllers/weatherData.controller.js';

const router = Router();

// Public routes - anyone can view weather data
router.get('/current', getCurrentWeather);
router.get('/forecast', getWeatherForecast);
router.get('/history', getWeatherHistory);

// Admin/Service routes - for saving and managing weather data
router.post('/', saveWeatherData);
router.delete('/cleanup', cleanupOldWeatherData);

export default router;
