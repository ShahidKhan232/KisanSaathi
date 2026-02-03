# Controllers

This directory contains all the backend API controllers that handle HTTP requests and business logic for the KisanSaathi application.

## Overview

Controllers are responsible for:
- Processing incoming HTTP requests
- Validating request data
- Calling appropriate services
- Formatting and sending responses
- Error handling

## Controllers List

### AI & ML Controllers

#### `aiController.ts`
**Purpose**: Handles AI-powered chatbot interactions using Gemini AI

**Endpoints**:
- `POST /api/ai/chat` - Send message to AI chatbot
- `GET /api/ai/chat/history` - Get chat history for user

**Features**:
- Multilingual support (English, Hindi, Marathi)
- Context-aware responses about farming
- Chat history persistence

---

#### `cropDisease.controller.ts`
**Purpose**: Manages crop disease detection using ML models

**Endpoints**:
- `POST /api/crop-disease/detect` - Upload image for disease detection
- `GET /api/crop-disease/history` - Get user's disease detection history

**Features**:
- Image upload handling
- ML model integration
- Disease identification with confidence scores
- Treatment recommendations

---

#### `cropRecommendation.controller.ts`
**Purpose**: Provides crop recommendations based on soil and climate data

**Endpoints**:
- `POST /api/crop-recommendation` - Get crop recommendations
- `GET /api/crop-recommendation/history` - Get recommendation history

**Features**:
- Soil parameter analysis (N, P, K, pH)
- Climate data integration
- ML-based crop suggestions

---

### Market & Price Controllers

#### `marketPriceData.controller.ts`
**Purpose**: Manages AI-generated market price data

**Endpoints**:
- `GET /api/market-prices` - Get current market prices
- `GET /api/market-prices/ai-status` - Get AI price generation status
- `POST /api/market-prices/fetch-ai-prices` - Manually trigger AI price generation (auth required)

**Features**:
- AI-generated daily prices using Gemini
- Price caching (24-hour refresh)
- Multi-crop and multi-market support
- Real-time status tracking

**Related Files**:
- Service: `services/marketPriceAI.service.ts`
- Cron: `utils/priceFetchCron.ts`

---

#### `priceAlert.controller.ts`
**Purpose**: Manages user price alerts and notifications

**Endpoints**:
- `POST /api/price-alerts` - Create price alert
- `GET /api/price-alerts` - Get user's alerts
- `PUT /api/price-alerts/:id` - Update alert
- `DELETE /api/price-alerts/:id` - Delete alert

**Features**:
- Custom price thresholds
- Email/SMS notifications
- Alert status tracking

---

### Information Controllers

#### `cropInfo.controller.ts`
**Purpose**: Provides detailed crop information and farming guidelines

**Endpoints**:
- `GET /api/crop-info` - Get all crops
- `GET /api/crop-info/:id` - Get specific crop details
- `POST /api/crop-info` - Add new crop (admin)

**Features**:
- Crop cultivation guidelines
- Season information
- Best practices
- Multilingual content

---

#### `governmentScheme.controller.ts`
**Purpose**: Manages government schemes and subsidies information

**Endpoints**:
- `GET /api/schemes` - Get all schemes
- `GET /api/schemes/:id` - Get scheme details
- `POST /api/schemes` - Add new scheme (admin)

**Features**:
- Scheme eligibility criteria
- Application process
- Benefits information
- State-wise filtering

---

#### `weatherData.controller.ts`
**Purpose**: Provides weather forecasts and historical data

**Endpoints**:
- `GET /api/weather/current` - Get current weather
- `GET /api/weather/forecast` - Get 7-day forecast
- `POST /api/weather` - Record weather data

**Features**:
- Location-based weather
- Temperature, humidity, rainfall data
- Integration with weather APIs

---

### User & Auth Controllers

#### `authController.ts`
**Purpose**: Handles user authentication and authorization

**Endpoints**:
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Reset password

**Features**:
- JWT token generation
- Password hashing (bcrypt)
- Email verification
- Role-based access control

---

#### `profileController.ts`
**Purpose**: Manages user profile data

**Endpoints**:
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update profile
- `POST /api/profile/avatar` - Upload profile picture

**Features**:
- Profile photo upload
- Farm details management
- Preference settings

---

### History Controllers

#### `chatHistory.controller.ts`
**Purpose**: Manages AI chat conversation history

**Endpoints**:
- `GET /api/chat-history` - Get all chat sessions
- `GET /api/chat-history/:id` - Get specific session
- `DELETE /api/chat-history/:id` - Delete session

**Features**:
- Session-based chat storage
- Message timestamps
- User-specific history

---

### Testing Controllers

#### `testAPI.controller.ts`
**Purpose**: Test Gemini API connectivity and configuration

**Endpoints**:
- `GET /api/test/gemini` - Test Gemini API

**Features**:
- API key validation
- Model availability check
- Response time testing

---

#### `testCropDisease.controller.ts`
**Purpose**: Test crop disease detection ML model

**Endpoints**:
- `POST /api/test/crop-disease` - Test disease detection

**Features**:
- Model health check
- Sample prediction testing

---

#### `databaseTest.controller.ts`
**Purpose**: Test database connectivity and operations

**Endpoints**:
- `GET /api/test/database` - Test MongoDB connection

**Features**:
- Connection status
- Read/write operations test
- Collection listing

---

## Common Patterns

### Error Handling
All controllers use try-catch blocks and return consistent error responses:

```typescript
try {
  // Controller logic
  res.status(200).json({ success: true, data });
} catch (error) {
  console.error('Error:', error);
  res.status(500).json({ 
    success: false, 
    error: error.message 
  });
}
```

### Authentication
Protected routes use JWT middleware:

```typescript
import { authenticateToken } from '../middleware/auth.js';

router.post('/protected', authenticateToken, controller.method);
```

### Validation
Request validation using express-validator or manual checks:

```typescript
if (!requiredField) {
  return res.status(400).json({ 
    error: 'Required field missing' 
  });
}
```

## Adding New Controllers

1. Create new file: `newController.ts`
2. Define controller functions
3. Export controller object
4. Create corresponding route file
5. Register route in `index.ts`

**Template**:
```typescript
import { Request, Response } from 'express';

export const newController = {
  async getAll(req: Request, res: Response) {
    try {
      // Logic here
      res.json({ success: true, data });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};
```

## Related Directories

- **Routes**: `../routes/` - Route definitions
- **Services**: `../services/` - Business logic
- **Models**: `../models/` - Database schemas
- **Middleware**: `../middleware/` - Auth, validation, etc.
