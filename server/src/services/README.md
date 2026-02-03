# Services

This directory contains business logic services that handle complex operations, external API integrations, and data processing for the KisanSaathi application.

## Overview

Services are responsible for:
- Complex business logic
- External API integrations
- Data processing and transformation
- Reusable functionality across controllers

## Services List

### `marketPriceAI.service.ts`

**Purpose**: AI-powered market price generation using Google Gemini AI

**Key Features**:
- **Daily Price Generation**: Generates realistic market prices for 25 major Indian crops
- **Multi-Market Coverage**: Prices for 2-3 markets per crop across different states
- **Intelligent Pricing**: Considers seasonal patterns, regional variations, and supply-demand dynamics
- **Database Integration**: Automatically saves/updates prices in MongoDB

**Main Methods**:

#### `generateDailyMarketPrices()`
Generates complete set of market prices for all crops

```typescript
const result = await marketPriceAIService.generateDailyMarketPrices();
// Returns: { success: boolean, count: number, error?: string }
```

**Process**:
1. Calls Gemini AI with detailed prompt
2. Parses JSON response
3. Validates price data
4. Saves to database with source='other'

#### `getLastFetchTime()`
Gets timestamp of last AI price generation

```typescript
const lastFetch = await marketPriceAIService.getLastFetchTime();
// Returns: Date | null
```

#### `needsRefresh()`
Checks if prices are stale (>24 hours old)

```typescript
const needsUpdate = await marketPriceAIService.needsRefresh();
// Returns: boolean
```

**Crops Covered** (25 total):
- Cereals: Wheat, Rice, Maize, Bajra, Jowar
- Pulses: Gram, Tur, Moong, Urad, Masoor
- Oilseeds: Soybean, Groundnut, Mustard, Sunflower
- Cash Crops: Cotton, Sugarcane
- Vegetables: Potato, Onion, Tomato, Cabbage, Cauliflower
- Spices: Chili, Turmeric, Coriander, Cumin

**States Covered**:
- Punjab, Haryana, Uttar Pradesh (wheat, rice)
- Maharashtra, Gujarat, Madhya Pradesh (cotton, soybean)
- Karnataka, Andhra Pradesh, Tamil Nadu (vegetables, pulses)
- Rajasthan (bajra, mustard)

**Price Data Structure**:
```typescript
interface CropPriceData {
  commodity: string;      // e.g., "Wheat"
  variety: string;        // e.g., "Durum", "Basmati"
  market: string;         // e.g., "Azadpur", "Vashi"
  state: string;          // e.g., "Delhi"
  district: string;       // e.g., "New Delhi"
  minPrice: number;       // ₹/quintal
  maxPrice: number;       // ₹/quintal
  modalPrice: number;     // ₹/quintal (between min and max)
}
```

**Configuration**:
- **Model**: `gemini-1.5-flash`
- **API Key**: Set via `GEMINI_API_KEY` environment variable
- **Refresh Interval**: 24 hours
- **Source Tag**: `'other'` (distinguishes from government data)

**Error Handling**:
- Validates API key on initialization
- Parses and validates AI responses
- Handles malformed JSON gracefully
- Logs detailed error messages

**Usage Example**:
```typescript
import { marketPriceAIService } from '../services/marketPriceAI.service.js';

// Generate prices
const result = await marketPriceAIService.generateDailyMarketPrices();
if (result.success) {
  console.log(`Generated ${result.count} prices`);
}

// Check if refresh needed
if (await marketPriceAIService.needsRefresh()) {
  await marketPriceAIService.generateDailyMarketPrices();
}
```

**Related Files**:
- Controller: `controllers/marketPriceData.controller.ts`
- Cron Job: `utils/priceFetchCron.ts`
- Model: `models/MarketPrice.ts`

---

## Service Architecture

### Design Principles

1. **Separation of Concerns**: Services handle business logic, controllers handle HTTP
2. **Reusability**: Services can be used by multiple controllers
3. **Testability**: Services are easily unit-testable
4. **Single Responsibility**: Each service has one clear purpose

### Common Patterns

#### Async/Await
All service methods are asynchronous:

```typescript
async methodName(): Promise<ReturnType> {
  try {
    // Logic here
    return result;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
```

#### Error Handling
Services throw errors, controllers catch them:

```typescript
// Service
if (!data) {
  throw new Error('Data not found');
}

// Controller
try {
  await service.method();
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

#### Configuration
Services use environment variables:

```typescript
const API_KEY = process.env.API_KEY || '';
if (!API_KEY) {
  console.warn('⚠️  API_KEY not set');
}
```

---

## Adding New Services

### Steps

1. **Create Service File**: `newService.service.ts`
2. **Define Service Class**: 
   ```typescript
   class NewService {
     async method() {
       // Logic
     }
   }
   
   export const newService = new NewService();
   ```
3. **Add Configuration**: Environment variables in `.env`
4. **Write Tests**: Unit tests for service methods
5. **Document**: Add to this README

### Template

```typescript
/**
 * Service description
 */
class NewService {
  private config: ConfigType;

  constructor() {
    this.config = {
      apiKey: process.env.API_KEY || ''
    };
  }

  /**
   * Method description
   * @param param - Parameter description
   * @returns Return value description
   */
  async methodName(param: string): Promise<ResultType> {
    try {
      // Validate input
      if (!param) {
        throw new Error('Parameter required');
      }

      // Business logic
      const result = await this.processData(param);

      // Return result
      return result;
    } catch (error) {
      console.error('Error in methodName:', error);
      throw error;
    }
  }

  private async processData(data: string): Promise<ResultType> {
    // Helper method
  }
}

export const newService = new NewService();
```

---

## Future Services

Potential services to add:

1. **SMS Service**: Send SMS notifications for price alerts
2. **Email Service**: Send email notifications and reports
3. **Weather Service**: Fetch and process weather data from external APIs
4. **Analytics Service**: Generate farming insights and recommendations
5. **Image Processing Service**: Optimize and process uploaded images
6. **Translation Service**: Handle multilingual content translation
7. **Payment Service**: Process payments for premium features
8. **Notification Service**: Unified notification system

---

## Best Practices

### 1. Keep Services Focused
Each service should have a single, clear responsibility.

### 2. Use Dependency Injection
Pass dependencies through constructor when possible:

```typescript
class Service {
  constructor(private db: Database) {}
}
```

### 3. Handle Errors Gracefully
Always catch and log errors with context:

```typescript
try {
  await operation();
} catch (error) {
  console.error('Context about what failed:', error);
  throw new Error('User-friendly error message');
}
```

### 4. Document Public Methods
Use JSDoc comments for all public methods:

```typescript
/**
 * Generates daily market prices
 * @returns Object with success status and count
 */
async generateDailyMarketPrices(): Promise<Result> {
  // ...
}
```

### 5. Use TypeScript Types
Define interfaces for all data structures:

```typescript
interface PriceData {
  commodity: string;
  price: number;
}
```

---

## Related Directories

- **Controllers**: `../controllers/` - HTTP request handlers
- **Models**: `../models/` - Database schemas
- **Utils**: `../utils/` - Helper functions
- **Config**: `../config/` - Configuration files
