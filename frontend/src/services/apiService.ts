import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5001';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    // Log disease detection API calls for debugging
    if (config.url?.includes('/diseases')) {
        console.log('🌐 API Request to diseases endpoint:');
        console.log('   Method:', config.method?.toUpperCase());
        console.log('   URL:', config.url);
        console.log('   Has Auth Token:', !!token);
        if (config.method?.toLowerCase() === 'post') {
            console.log('   Request Data:', config.data);
        }
    }

    return config;
});

// Add response interceptor for debugging
api.interceptors.response.use(
    (response) => {
        // Log successful disease detection API responses
        if (response.config.url?.includes('/diseases')) {
            console.log('✅ API Response from diseases endpoint:');
            console.log('   Status:', response.status);
            console.log('   Data:', response.data);
        }
        return response;
    },
    (error) => {
        // Log failed disease detection API responses
        if (error.config?.url?.includes('/diseases')) {
            console.error('❌ API Error from diseases endpoint:');
            console.error('   Status:', error.response?.status);
            console.error('   Error data:', error.response?.data);
            console.error('   Error message:', error.message);
        }
        return Promise.reject(error);
    }
);

// ============= Chat History API =============
export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
}

export interface ChatSession {
    _id: string;
    userId: string;
    sessionId: string;
    messages: ChatMessage[];
    topic?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const chatHistoryAPI = {
    // Get all chat sessions for the current user
    getChatHistory: async (limit?: number): Promise<ChatSession[]> => {
        const response = await api.get('/api/chat', { params: { limit } });
        return response.data;
    },

    // Get a specific chat session
    getChatSession: async (sessionId: string): Promise<ChatSession> => {
        const response = await api.get(`/api/chat/${sessionId}`);
        return response.data;
    },

    // Save a chat message (creates or updates session)
    saveChatMessage: async (data: {
        sessionId: string;
        message: ChatMessage;
        topic?: string;
    }): Promise<ChatSession> => {
        const response = await api.post('/api/chat/message', data);
        return response.data;
    },

    // Delete a chat session
    deleteChatSession: async (sessionId: string): Promise<void> => {
        await api.delete(`/api/chat/${sessionId}`);
    },
};

// ============= Crop Disease API =============
export interface DiseaseDetection {
    _id: string;
    userId: string;
    cropName: string;
    imageUrl?: string;
    detectedDisease: string;
    confidence: number;
    symptoms: string[];
    treatment: string;
    preventionTips: string[];
    detectedAt: Date;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

export const cropDiseaseAPI = {
    // Get disease detection history
    getDiseaseHistory: async (limit?: number): Promise<DiseaseDetection[]> => {
        const response = await api.get('/api/diseases', { params: { limit } });
        return response.data;
    },

    // Get a specific disease detection
    getDiseaseById: async (id: string): Promise<DiseaseDetection> => {
        const response = await api.get(`/api/diseases/${id}`);
        return response.data;
    },

    // Save a disease detection result
    saveDiseaseDetection: async (data: {
        cropName: string;
        imageUrl?: string;
        detectedDisease: string;
        confidence: number;
        symptoms: string[];
        treatment: string;
        preventionTips: string[];
        location?: {
            latitude: number;
            longitude: number;
            address?: string;
        };
    }): Promise<DiseaseDetection> => {
        const response = await api.post('/api/diseases', data);
        return response.data;
    },

    // Delete a disease detection
    deleteDiseaseDetection: async (id: string): Promise<void> => {
        await api.delete(`/api/diseases/${id}`);
    },
};

// ============= Crop Info API =============
export interface CropInfo {
    _id: string;
    cropName: string;
    scientificName?: string;
    category: 'cereal' | 'pulse' | 'vegetable' | 'fruit' | 'fiber' | 'oilseed' | 'other';
    season: string[];
    duration: number;
    soilType: string[];
    climate: string;
    waterRequirement: 'low' | 'medium' | 'high';
    fertilizers: string[];
    commonDiseases: string[];
    commonPests: string[];
    harvestingTips?: string;
    storageInfo?: string;
    marketDemand?: string;
    imageUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

export const cropInfoAPI = {
    // Get all crops with optional filtering
    getAllCrops: async (params?: {
        category?: string;
        season?: string;
        search?: string;
    }): Promise<CropInfo[]> => {
        const response = await api.get('/api/crops', { params });
        return response.data;
    },

    // Get crop by name
    getCropByName: async (name: string): Promise<CropInfo> => {
        const response = await api.get(`/api/crops/name/${name}`);
        return response.data;
    },

    // Get crop by ID
    getCropById: async (id: string): Promise<CropInfo> => {
        const response = await api.get(`/api/crops/${id}`);
        return response.data;
    },
};

// ============= Weather Data API =============
export interface WeatherData {
    _id: string;
    userId?: string;
    location: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    temperature: {
        min: number;
        max: number;
        avg: number;
    };
    humidity: number;
    rainfall: number;
    windSpeed: number;
    pressure?: number;
    visibility?: number;
    description?: string;
    forecast?: Array<{
        date: Date;
        temperature: {
            min: number;
            max: number;
            avg: number;
        };
        humidity: number;
        rainfall: number;
        condition: string;
    }>;
    recordDate: Date;
    source: string;
}

export const weatherDataAPI = {
    // Get current weather for a location
    getCurrentWeather: async (location: string): Promise<WeatherData> => {
        const response = await api.get('/api/weather/current', { params: { location } });
        return response.data;
    },

    // Get weather forecast
    getWeatherForecast: async (location: string): Promise<{
        location: string;
        forecast: WeatherData['forecast'];
        recordDate: Date;
    }> => {
        const response = await api.get('/api/weather/forecast', { params: { location } });
        return response.data;
    },

    // Get weather history
    getWeatherHistory: async (location: string, days?: number): Promise<WeatherData[]> => {
        const response = await api.get('/api/weather/history', { params: { location, days } });
        return response.data;
    },

    // Get user weather preferences
    getUserWeatherPreferences: async (): Promise<{
        defaultLocation: string | null;
        recentWeather: WeatherData[];
        preferences: {
            temperatureUnit: string;
            autoRefresh: boolean;
        };
    }> => {
        const response = await api.get('/api/weather/user/preferences');
        return response.data;
    },

    // Get user weather history
    getUserWeatherHistory: async (days?: number): Promise<WeatherData[]> => {
        const response = await api.get('/api/weather/user/history', { params: { days } });
        return response.data;
    },

    // Save user weather data
    saveUserWeatherData: async (data: Partial<WeatherData>): Promise<WeatherData> => {
        const response = await api.post('/api/weather/user', data);
        return response.data;
    },
};

// ============= Market Price Data API =============
export interface MarketPrice {
    _id: string;
    commodity: string;
    variety?: string;
    market: string;
    state: string;
    district: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    priceDate: Date;
    arrivals?: number;
    source?: string;
    fetchedAt?: Date;
}

export const marketPriceAPI = {
    // Get current market prices with filters
    getCurrentMarketPrices: async (params?: {
        commodity?: string;
        state?: string;
        district?: string;
        market?: string;
        limit?: number;
        skip?: number;
    }): Promise<MarketPrice[]> => {
        const response = await api.get('/api/market-prices/current', { params });
        return response.data;
    },

    // Get price history for a commodity
    getPriceHistory: async (params: {
        commodity: string;
        market?: string;
        state?: string;
        days?: number;
    }): Promise<MarketPrice[]> => {
        const response = await api.get('/api/market-prices/history', { params });
        return response.data;
    },

    // Get user's preferred market prices
    getUserPreferredPrices: async (): Promise<{
        userCrops: string[];
        userLocation: string | null;
        prices: MarketPrice[];
    }> => {
        const response = await api.get('/api/market-prices/user/preferred');
        return response.data;
    },

    // Get price statistics
    getPriceStatistics: async (params: {
        commodity: string;
        state?: string;
        period?: number;
    }): Promise<{
        commodity: string;
        period: string;
        statistics: Array<{
            commodity: string;
            market: string;
            state: string;
            avgModalPrice: number;
            minModalPrice: number;
            maxModalPrice: number;
            latestPrice: number;
            priceChange: number;
            dataPoints: number;
        }>;
    }> => {
        const response = await api.get('/api/market-prices/statistics', { params });
        return response.data;
    },
};

// ============= Price Alert API =============
export interface PriceAlert {
    _id: string;
    userId: string;
    crop: string;
    targetPrice: number;
    market?: string;
    alertType: 'above' | 'below';
    isActive: boolean;
    createdAt: Date;
    lastTriggered?: Date;
    notificationSent?: boolean;
    expiresAt?: Date;
}

export const priceAlertAPI = {
    // Get user's price alerts
    getMyAlerts: async (): Promise<PriceAlert[]> => {
        const response = await api.get('/api/alerts');
        return response.data;
    },

    // Get user's alert preferences
    getAlertPreferences: async (): Promise<Pick<PriceAlert, 'crop' | 'targetPrice' | 'alertType' | 'market'>[]> => {
        const response = await api.get('/api/alerts/preferences');
        return response.data;
    },

    // Create new alert
    createAlert: async (data: Omit<PriceAlert, '_id' | 'userId' | 'createdAt' | 'isActive'>): Promise<PriceAlert> => {
        const response = await api.post('/api/alerts', data);
        return response.data;
    },

    // Update alert
    updateAlert: async (id: string, data: Partial<PriceAlert>): Promise<PriceAlert> => {
        const response = await api.put(`/api/alerts/${id}`, data);
        return response.data;
    },

    // Delete alert
    deleteAlert: async (id: string): Promise<void> => {
        await api.delete(`/api/alerts/${id}`);
    },
};

export default api;
