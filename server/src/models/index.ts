/**
 * Central export file for all database models
 * Import models from this file to ensure they are registered with Mongoose
 */

// User and Authentication
export { UserModel, IUser, IUserDoc } from './User.js';

// Alerts
export { PriceAlertModel, IAlert, IAlertDoc } from './PriceAlert.js';

// Crop Disease Detection
export { CropDiseaseModel, ICropDisease, ICropDiseaseDoc } from './CropDisease.js';

// Market Prices
export { MarketPriceModel, IMarketPrice, IMarketPriceDoc } from './MarketPrice.js';

// Government Schemes
export { GovernmentSchemeModel, IGovernmentScheme, IGovernmentSchemeDoc } from './GovernmentScheme.js';

// Chat History
export { ChatHistoryModel, IChatHistory, IChatHistoryDoc, IChatMessage } from './ChatHistory.js';

// Crop Information
export { CropInfoModel, ICropInfo, ICropInfoDoc } from './CropInfo.js';

// Weather Data
export { WeatherDataModel, IWeatherData, IWeatherDataDoc } from './WeatherData.js';

// In-Memory Storage (fallback)
export * from './InMemoryStorage.js';
