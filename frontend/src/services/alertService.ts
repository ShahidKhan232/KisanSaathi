import { weatherService } from './weatherService';

export interface Alert {
  id: string;
  type: 'weather' | 'price' | 'disease' | 'irrigation' | 'harvest' | 'market';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  location?: string;
  actionRequired?: boolean;
  expiresAt?: Date;
}

class AlertService {
  private cache: Alert[] = [];
  private lastUpdate: Date | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getAlerts(): Promise<Alert[]> {
    const now = new Date();
    
    // Return cached alerts if still fresh
    if (this.lastUpdate && (now.getTime() - this.lastUpdate.getTime()) < this.CACHE_DURATION) {
      return this.cache;
    }

    try {
      const alerts = await this.generateRealTimeAlerts();
      this.cache = alerts;
      this.lastUpdate = now;
      return alerts;
    } catch (error) {
      console.error('Error generating alerts:', error);
      // Return cached alerts or fallback alerts
      return this.cache.length > 0 ? this.cache : this.getFallbackAlerts();
    }
  }

  private async generateRealTimeAlerts(): Promise<Alert[]> {
    const alerts: Alert[] = [];
    
    try {
      // Get current weather data
      const weather = await weatherService.getCurrentWeather();
      
      if (weather) {
        // Weather-based alerts
        alerts.push(...this.generateWeatherAlerts(weather));
      }
    } catch (error) {
      console.warn('Could not fetch weather for alerts:', error);
    }

    // Add market price alerts
    alerts.push(...this.generatePriceAlerts());
    
    // Add disease alerts based on weather conditions
    alerts.push(...this.generateDiseaseAlerts());
    
    // Add irrigation alerts
    alerts.push(...this.generateIrrigationAlerts());
    
    // Add seasonal farming alerts
    alerts.push(...this.generateSeasonalAlerts());

    // Sort by priority and timestamp
    return alerts.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return b.timestamp.getTime() - a.timestamp.getTime();
    }).slice(0, 5); // Limit to 5 most important alerts
  }

  private generateWeatherAlerts(weather: any): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();

    // Heavy rain alert
    if (weather.rainfall > 20 || (weather.description && weather.description.toLowerCase().includes('rain'))) {
      alerts.push({
        id: `weather-rain-${Date.now()}`,
        type: 'weather',
        priority: 'high',
        title: 'Heavy Rainfall Expected',
        message: `Heavy rainfall expected in your area. Current conditions: ${weather.description}. Protect crops and ensure proper drainage.`,
        timestamp: now,
        location: weather.location,
        actionRequired: true,
        expiresAt: new Date(now.getTime() + 24 * 60 * 60 * 1000) // 24 hours
      });
    }

    // High temperature alert
    if (weather.temperature > 35) {
      alerts.push({
        id: `weather-heat-${Date.now()}`,
        type: 'weather',
        priority: 'medium',
        title: 'High Temperature Alert',
        message: `Temperature is ${weather.temperature}°C. Increase irrigation frequency and provide shade for sensitive crops.`,
        timestamp: now,
        location: weather.location,
        actionRequired: true
      });
    }

    // Low humidity alert
    if (weather.humidity < 30) {
      alerts.push({
        id: `weather-humidity-${Date.now()}`,
        type: 'irrigation',
        priority: 'medium',
        title: 'Low Humidity Alert',
        message: `Humidity is only ${weather.humidity}%. Consider increasing irrigation and mulching to retain soil moisture.`,
        timestamp: now,
        location: weather.location,
        actionRequired: true
      });
    }

    // High wind alert
    if (weather.windSpeed > 25) {
      alerts.push({
        id: `weather-wind-${Date.now()}`,
        type: 'weather',
        priority: 'high',
        title: 'Strong Wind Alert',
        message: `Wind speed is ${weather.windSpeed} km/h. Secure loose structures and check crop support systems.`,
        timestamp: now,
        location: weather.location,
        actionRequired: true
      });
    }

    return alerts;
  }

  private generatePriceAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();

    // Simulate real-time price data (in real app, this would come from market API)
    const priceChanges = [
      { crop: 'Tomato', change: 15, trend: 'up' },
      { crop: 'Onion', change: -8, trend: 'down' },
      { crop: 'Wheat', change: 12, trend: 'up' }
    ];

    priceChanges.forEach(price => {
      if (Math.abs(price.change) > 10) {
        alerts.push({
          id: `price-${price.crop.toLowerCase()}-${Date.now()}`,
          type: 'price',
          priority: price.change > 15 || price.change < -15 ? 'high' : 'medium',
          title: `${price.crop} Price ${price.trend === 'up' ? 'Increase' : 'Decrease'}`,
          message: `${price.crop} prices ${price.trend === 'up' ? 'increased' : 'decreased'} by ${Math.abs(price.change)}% in local mandi. ${price.trend === 'up' ? 'Good time to sell!' : 'Consider holding if possible.'}`,
          timestamp: now,
          actionRequired: Math.abs(price.change) > 15
        });
      }
    });

    return alerts;
  }

  private generateDiseaseAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();

    // Simulate disease risk based on weather patterns
    const currentMonth = now.getMonth();
    const diseases = [];

    // Monsoon diseases (June-September)
    if (currentMonth >= 5 && currentMonth <= 8) {
      diseases.push({
        disease: 'Leaf Blight',
        risk: 'high',
        crops: ['Rice', 'Wheat'],
        description: 'High humidity and warm temperatures create favorable conditions for leaf blight.'
      });
    }

    // Winter diseases (November-February)
    if (currentMonth >= 10 || currentMonth <= 1) {
      diseases.push({
        disease: 'Powdery Mildew',
        risk: 'medium',
        crops: ['Peas', 'Mustard'],
        description: 'Cool, dry weather with high humidity at night favors powdery mildew development.'
      });
    }

    diseases.forEach(disease => {
      alerts.push({
        id: `disease-${disease.disease.replace(' ', '').toLowerCase()}-${Date.now()}`,
        type: 'disease',
        priority: disease.risk === 'high' ? 'high' : 'medium',
        title: `${disease.disease} Risk Alert`,
        message: `${disease.risk.charAt(0).toUpperCase() + disease.risk.slice(1)} risk of ${disease.disease} in ${disease.crops.join(', ')}. ${disease.description} Monitor crops closely.`,
        timestamp: now,
        actionRequired: disease.risk === 'high'
      });
    });

    return alerts;
  }

  private generateIrrigationAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();

    // Simulate soil moisture and irrigation needs
    const hour = now.getHours();
    
    // Morning irrigation reminder
    if (hour >= 6 && hour <= 8) {
      alerts.push({
        id: `irrigation-morning-${Date.now()}`,
        type: 'irrigation',
        priority: 'low',
        title: 'Morning Irrigation Reminder',
        message: 'Best time for irrigation. Water your crops now to avoid evaporation losses during the day.',
        timestamp: now,
        actionRequired: true,
        expiresAt: new Date(now.getTime() + 3 * 60 * 60 * 1000) // 3 hours
      });
    }

    return alerts;
  }

  private generateSeasonalAlerts(): Alert[] {
    const alerts: Alert[] = [];
    const now = new Date();
    const currentMonth = now.getMonth();

    // Seasonal farming activities
    const seasonalActivities = [
      { months: [2, 3], activity: 'Spring Planting', message: 'Ideal time for spring crop planting. Prepare fields and plan seed requirements.' },
      { months: [5, 6], activity: 'Monsoon Preparation', message: 'Monsoon season approaching. Check drainage systems and prepare for kharif sowing.' },
      { months: [9, 10], activity: 'Harvest Season', message: 'Kharif harvest season. Monitor crop maturity and plan harvesting schedule.' },
      { months: [11, 0], activity: 'Rabi Sowing', message: 'Optimal time for rabi crop sowing. Ensure proper field preparation.' }
    ];

    seasonalActivities.forEach(activity => {
      if (activity.months.includes(currentMonth)) {
        alerts.push({
          id: `seasonal-${activity.activity.replace(' ', '').toLowerCase()}-${Date.now()}`,
          type: 'harvest',
          priority: 'medium',
          title: activity.activity,
          message: activity.message,
          timestamp: now,
          actionRequired: false
        });
      }
    });

    return alerts;
  }

  private getFallbackAlerts(): Alert[] {
    const now = new Date();
    return [
      {
        id: 'fallback-weather',
        type: 'weather',
        priority: 'medium',
        title: 'Weather Monitoring',
        message: 'Keep monitoring weather conditions for any sudden changes that might affect your crops.',
        timestamp: now
      },
      {
        id: 'fallback-price',
        type: 'price',
        priority: 'low',
        title: 'Market Watch',
        message: 'Check local mandi prices regularly to make informed selling decisions.',
        timestamp: now
      },
      {
        id: 'fallback-irrigation',
        type: 'irrigation',
        priority: 'low',
        title: 'Irrigation Check',
        message: 'Monitor soil moisture levels and irrigate as needed based on crop requirements.',
        timestamp: now
      }
    ];
  }

  clearCache(): void {
    this.cache = [];
    this.lastUpdate = null;
  }
}

export const alertService = new AlertService();