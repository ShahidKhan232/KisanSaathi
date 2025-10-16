// Weather Service for real-time weather data
// Uses OpenWeatherMap API with geolocation support

interface WeatherData {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  description: string;
  icon: string;
  location: string;
  pressure: number;
  visibility: number;
  uvIndex?: number;
  sunrise?: string;
  sunset?: string;
  lastUpdated: string;
}

interface WeatherForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  humidity: number;
  description: string;
  icon: string;
}

class WeatherService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';
  private cache = new Map<string, { data: WeatherData; timestamp: number }>();
  private readonly cacheExpiryMs = 10 * 60 * 1000; // 10 minutes cache

  constructor() {
    // Use environment variable or fallback to demo key
    this.apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY || 'demo';
  }

  // Get user's current location
  private async getCurrentLocation(): Promise<{ lat: number; lon: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          console.warn('Geolocation error, using default location (Delhi):', error);
          // Fallback to Delhi coordinates
          resolve({ lat: 28.6139, lon: 77.2090 });
        },
        { timeout: 10000, enableHighAccuracy: true }
      );
    });
  }

  // Get cached weather data if available and not expired
  private getCachedWeather(key: string): WeatherData | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiryMs) {
      return cached.data;
    }
    if (cached) {
      this.cache.delete(key);
    }
    return null;
  }

  // Cache weather data
  private setCachedWeather(key: string, data: WeatherData): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // Get current weather data
  async getCurrentWeather(): Promise<WeatherData> {
    try {
      const location = await this.getCurrentLocation();
      const cacheKey = `weather_${location.lat}_${location.lon}`;
      
      // Check cache first
      const cachedData = this.getCachedWeather(cacheKey);
      if (cachedData) {
        console.log('Using cached weather data');
        return cachedData;
      }

      // Fetch from API
      if (this.apiKey === 'demo') {
        console.warn('Using demo weather data - set VITE_OPENWEATHER_API_KEY for real data');
        return this.getDemoWeatherData();
      }

      const response = await fetch(
        `${this.baseUrl}/weather?lat=${location.lat}&lon=${location.lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      const weatherData: WeatherData = {
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        rainfall: data.rain?.['1h'] || 0,
        windSpeed: Math.round(data.wind.speed * 3.6), // Convert m/s to km/h
        description: data.weather[0].description,
        icon: data.weather[0].icon,
        location: data.name,
        pressure: data.main.pressure,
        visibility: Math.round(data.visibility / 1000), // Convert to km
        uvIndex: 0, // UV index needs separate API call
        sunrise: new Date(data.sys.sunrise * 1000).toLocaleTimeString(),
        sunset: new Date(data.sys.sunset * 1000).toLocaleTimeString(),
        lastUpdated: new Date().toLocaleString()
      };

      // Cache the data
      this.setCachedWeather(cacheKey, weatherData);
      
      return weatherData;
    } catch (error) {
      console.error('Error fetching weather data:', error);
      return this.getDemoWeatherData();
    }
  }

  // Get weather forecast for next 5 days
  async getWeatherForecast(): Promise<WeatherForecast[]> {
    try {
      const location = await this.getCurrentLocation();
      
      if (this.apiKey === 'demo') {
        return this.getDemoForecastData();
      }

      const response = await fetch(
        `${this.baseUrl}/forecast?lat=${location.lat}&lon=${location.lon}&appid=${this.apiKey}&units=metric`
      );

      if (!response.ok) {
        throw new Error(`Forecast API error: ${response.status}`);
      }

      const data = await response.json();
      const forecasts: WeatherForecast[] = [];
      
      // Group by day and take one forecast per day
      const dailyForecasts = data.list.filter((_: any, index: number) => index % 8 === 0).slice(0, 5);
      
      dailyForecasts.forEach((forecast: any) => {
        forecasts.push({
          date: new Date(forecast.dt * 1000).toLocaleDateString(),
          maxTemp: Math.round(forecast.main.temp_max),
          minTemp: Math.round(forecast.main.temp_min),
          humidity: forecast.main.humidity,
          description: forecast.weather[0].description,
          icon: forecast.weather[0].icon
        });
      });

      return forecasts;
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      return this.getDemoForecastData();
    }
  }

  // Demo weather data for fallback
  private getDemoWeatherData(): WeatherData {
    const temps = [25, 28, 32, 29, 26];
    const humidities = [60, 65, 70, 68, 62];
    const randomIndex = Math.floor(Math.random() * temps.length);
    
    return {
      temperature: temps[randomIndex],
      humidity: humidities[randomIndex],
      rainfall: Math.floor(Math.random() * 20),
      windSpeed: Math.floor(Math.random() * 15) + 5,
      description: 'Partly cloudy',
      icon: '02d',
      location: 'Demo Location',
      pressure: 1013 + Math.floor(Math.random() * 20) - 10,
      visibility: 10,
      uvIndex: Math.floor(Math.random() * 11),
      sunrise: '06:30 AM',
      sunset: '06:45 PM',
      lastUpdated: new Date().toLocaleString()
    };
  }

  // Demo forecast data
  private getDemoForecastData(): WeatherForecast[] {
    const forecasts: WeatherForecast[] = [];
    const today = new Date();
    
    for (let i = 0; i < 5; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      
      forecasts.push({
        date: date.toLocaleDateString(),
        maxTemp: 28 + Math.floor(Math.random() * 8),
        minTemp: 18 + Math.floor(Math.random() * 6),
        humidity: 60 + Math.floor(Math.random() * 20),
        description: ['Sunny', 'Partly cloudy', 'Cloudy', 'Light rain'][Math.floor(Math.random() * 4)],
        icon: ['01d', '02d', '03d', '10d'][Math.floor(Math.random() * 4)]
      });
    }
    
    return forecasts;
  }

  // Clear cache manually
  clearCache(): void {
    this.cache.clear();
    console.log('Weather cache cleared');
  }

  // Get weather icon URL
  getIconUrl(iconCode: string): string {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  }
}

export const weatherService = new WeatherService();
export type { WeatherData, WeatherForecast };