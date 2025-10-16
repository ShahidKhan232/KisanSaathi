import { useState, useEffect, useCallback } from 'react';
import { weatherService, WeatherData, WeatherForecast } from '../services/weatherService';

interface UseWeatherReturn {
  weather: WeatherData | null;
  forecast: WeatherForecast[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshWeather: () => Promise<void>;
}

export function useWeather(autoRefreshMinutes: number = 10): UseWeatherReturn {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchWeatherData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching weather data...');
      
      // Fetch current weather and forecast in parallel
      const [currentWeather, weatherForecast] = await Promise.all([
        weatherService.getCurrentWeather(),
        weatherService.getWeatherForecast()
      ]);
      
      setWeather(currentWeather);
      setForecast(weatherForecast);
      setLastUpdated(new Date());
      
      console.log('Weather data updated:', {
        location: currentWeather.location,
        temperature: currentWeather.temperature,
        time: new Date().toLocaleTimeString()
      });
      
    } catch (err) {
      console.error('Failed to fetch weather data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch weather data');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWeather = useCallback(async () => {
    console.log('Manual weather refresh triggered');
    await fetchWeatherData();
  }, [fetchWeatherData]);

  // Initial fetch
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  // Auto-refresh weather data
  useEffect(() => {
    if (autoRefreshMinutes <= 0) return;

    const intervalId = setInterval(() => {
      console.log(`Auto-refreshing weather data (every ${autoRefreshMinutes} minutes)`);
      fetchWeatherData();
    }, autoRefreshMinutes * 60 * 1000);

    return () => {
      clearInterval(intervalId);
      console.log('Weather auto-refresh cleared');
    };
  }, [autoRefreshMinutes, fetchWeatherData]);

  // Refresh when tab becomes visible (user returns to app)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && weather && lastUpdated) {
        const timeSinceUpdate = Date.now() - lastUpdated.getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (timeSinceUpdate > fiveMinutes) {
          console.log('Tab became visible, refreshing stale weather data');
          fetchWeatherData();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [weather, lastUpdated, fetchWeatherData]);

  return {
    weather,
    forecast,
    loading,
    error,
    lastUpdated,
    refreshWeather
  };
}