import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { 
    UserModel, 
    ChatHistoryModel, 
    CropDiseaseModel, 
    MarketPriceModel, 
    GovernmentSchemeModel, 
    CropRecommendationModel, 
    PriceAlertModel, 
    WeatherDataModel,
    CropInfoModel 
} from '../models/index.js';
import mongoose from 'mongoose';

// Test all database connections and collections
export const testDatabaseConnections = async (req: AuthRequest, res: Response) => {
    try {
        const results: any = {
            timestamp: new Date(),
            database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
            collections: {},
            summary: {
                totalCollections: 0,
                totalDocuments: 0,
                emptyCollections: 0
            }
        };

        // Test all collections
        const collections = [
            { name: 'Users', model: UserModel },
            { name: 'Chat Histories', model: ChatHistoryModel },
            { name: 'Crop Diseases', model: CropDiseaseModel },
            { name: 'Market Prices', model: MarketPriceModel },
            { name: 'Government Schemes', model: GovernmentSchemeModel },
            { name: 'Crop Recommendations', model: CropRecommendationModel },
            { name: 'Price Alerts', model: PriceAlertModel },
            { name: 'Weather Data', model: WeatherDataModel },
            { name: 'Crop Info', model: CropInfoModel }
        ];

        for (const collection of collections) {
            try {
                const count = await collection.model.countDocuments();
                const sample = count > 0 ? await (collection.model as any).findOne().lean() : null;
                
                results.collections[collection.name] = {
                    status: 'Connected',
                    documentCount: count,
                    hasData: count > 0,
                    sampleDocument: sample ? Object.keys(sample) : null,
                    lastUpdated: sample && sample.updatedAt || sample && sample.createdAt || null
                };

                results.summary.totalCollections++;
                results.summary.totalDocuments += count;
                if (count === 0) {
                    results.summary.emptyCollections++;
                }
            } catch (error) {
                results.collections[collection.name] = {
                    status: 'Error',
                    error: error instanceof Error ? error.message : 'Unknown error',
                    documentCount: 0,
                    hasData: false
                };
                results.summary.totalCollections++;
            }
        }

        // Test user-specific data if authenticated
        if (req.user?.id) {
            try {
                const userId = req.user.id;
                results.userData = {};

                // Get user's chat history
                const userChats = await ChatHistoryModel.find({ userId }).countDocuments();
                results.userData.chatHistory = userChats;

                // Get user's disease detections
                const userDiseases = await CropDiseaseModel.find({ userId }).countDocuments();
                results.userData.diseaseDetections = userDiseases;

                // Get user's price alerts
                const userAlerts = await PriceAlertModel.find({ userId }).countDocuments();
                results.userData.priceAlerts = userAlerts;

                // Get user's crop recommendations
                const userRecommendations = await CropRecommendationModel.find({ userId }).countDocuments();
                results.userData.cropRecommendations = userRecommendations;

                // Get user's weather data
                const userWeather = await WeatherDataModel.find({ userId }).countDocuments();
                results.userData.weatherData = userWeather;

                results.userData.totalUserDataRecords = 
                    userChats + userDiseases + userAlerts + userRecommendations + userWeather;
            } catch (error) {
                results.userData = {
                    error: error instanceof Error ? error.message : 'Failed to fetch user data'
                };
            }
        }

        console.log('🔍 Database test completed:', results.summary);
        res.json(results);
    } catch (error) {
        console.error('Database test error:', error);
        res.status(500).json({ 
            error: 'Failed to test database connections',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};

// Test creating sample data for empty collections
export const createSampleData = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const results: any = {
            created: [],
            errors: []
        };

        // Create sample chat history
        try {
            const existingChat = await ChatHistoryModel.findOne({ userId, sessionId: 'test-session' });
            if (!existingChat) {
                await ChatHistoryModel.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    sessionId: 'test-session',
                    topic: 'Test Agriculture Query',
                    messages: [
                        {
                            role: 'user',
                            content: 'What is the best fertilizer for wheat?',
                            timestamp: new Date()
                        },
                        {
                            role: 'assistant',
                            content: 'For wheat cultivation, the recommended NPK fertilizer ratio is 4:2:1. Apply urea, DAP, and MOP accordingly...',
                            timestamp: new Date()
                        }
                    ]
                });
                results.created.push('Chat history sample');
            }
        } catch (error) {
            results.errors.push(`Chat history: ${error}`);
        }

        // Create sample disease detection
        try {
            const existingDisease = await CropDiseaseModel.findOne({ userId, cropName: 'Wheat' });
            if (!existingDisease) {
                await CropDiseaseModel.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    cropName: 'Wheat',
                    detectedDisease: 'Leaf Rust',
                    confidence: 85,
                    symptoms: ['Orange-brown pustules on leaves', 'Yellowing of leaves'],
                    treatment: 'Apply fungicide spray with propiconazole',
                    preventionTips: ['Use resistant varieties', 'Proper field sanitation'],
                    detectedAt: new Date()
                });
                results.created.push('Disease detection sample');
            }
        } catch (error) {
            results.errors.push(`Disease detection: ${error}`);
        }

        // Create sample price alert
        try {
            const existingAlert = await PriceAlertModel.findOne({ userId, crop: 'Wheat' });
            if (!existingAlert) {
                await PriceAlertModel.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    crop: 'Wheat',
                    targetPrice: 2500,
                    alertType: 'above',
                    market: 'Mandi',
                    isActive: true
                });
                results.created.push('Price alert sample');
            }
        } catch (error) {
            results.errors.push(`Price alert: ${error}`);
        }

        // Create sample crop recommendation
        try {
            const existingRecommendation = await CropRecommendationModel.findOne({ userId });
            if (!existingRecommendation) {
                await CropRecommendationModel.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    nitrogen: 50,
                    phosphorus: 30,
                    potassium: 40,
                    temperature: 25,
                    humidity: 65,
                    ph: 6.5,
                    rainfall: 150,
                    recommendedCrop: 'Wheat',
                    confidence: 85
                });
                results.created.push('Crop recommendation sample');
            }
        } catch (error) {
            results.errors.push(`Crop recommendation: ${error}`);
        }

        // Create sample weather data
        try {
            const existingWeather = await WeatherDataModel.findOne({ userId });
            if (!existingWeather) {
                await WeatherDataModel.create({
                    userId: new mongoose.Types.ObjectId(userId),
                    location: 'Punjab',
                    temperature: { min: 15, max: 28, avg: 22 },
                    humidity: 65,
                    rainfall: 2,
                    windSpeed: 12,
                    description: 'Partly cloudy',
                    recordDate: new Date(),
                    source: 'Weather API'
                });
                results.created.push('Weather data sample');
            }
        } catch (error) {
            results.errors.push(`Weather data: ${error}`);
        }

        console.log('📝 Sample data creation completed:', results);
        res.json(results);
    } catch (error) {
        console.error('Sample data creation error:', error);
        res.status(500).json({ 
            error: 'Failed to create sample data',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
