# Routes

This directory contains all API route definitions for the KisanSaathi backend application.

## Overview

Routes define:
- API endpoints and HTTP methods
- Request/response handling
- Middleware application (auth, validation)
- Controller function mapping

## Route Files

Each route file corresponds to a controller and defines the API endpoints for that feature.

### Format
```typescript
import express from 'express';
import { controller } from '../controllers/controller.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/public', controller.publicMethod);

// Protected routes
router.post('/protected', authenticateToken, controller.protectedMethod);

export default router;
```

---

## API Endpoints Reference

### Authentication Routes
**File**: `auth.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | No | User registration |
| POST | `/api/auth/login` | No | User login |
| POST | `/api/auth/logout` | Yes | User logout |
| POST | `/api/auth/refresh` | No | Refresh JWT token |
| POST | `/api/auth/forgot-password` | No | Request password reset |
| POST | `/api/auth/reset-password` | No | Reset password with token |

---

### Market Price Routes
**File**: `marketPriceData.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/market-prices` | No | Get all AI-generated prices |
| GET | `/api/market-prices/ai-status` | No | Get AI price generation status |
| POST | `/api/market-prices/fetch-ai-prices` | Yes | Manually trigger AI price generation |

**Query Parameters** (GET `/api/market-prices`):
- `crop` - Filter by crop name
- `market` - Filter by market name
- `state` - Filter by state
- `district` - Filter by district

---

### AI & Chatbot Routes
**File**: `ai.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/ai/chat` | Yes | Send message to AI chatbot |
| GET | `/api/ai/chat/history` | Yes | Get user's chat history |

---

### Crop Disease Routes
**File**: `cropDisease.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/crop-disease/detect` | Yes | Upload image for disease detection |
| GET | `/api/crop-disease/history` | Yes | Get detection history |
| DELETE | `/api/crop-disease/history/:id` | Yes | Delete history entry |

---

### Crop Recommendation Routes
**File**: `cropRecommendation.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/crop-recommendation` | Yes | Get crop recommendations |
| GET | `/api/crop-recommendation/history` | Yes | Get recommendation history |

---

### Crop Information Routes
**File**: `cropInfo.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/crop-info` | No | Get all crops |
| GET | `/api/crop-info/:id` | No | Get specific crop details |
| POST | `/api/crop-info` | Yes (Admin) | Add new crop |
| PUT | `/api/crop-info/:id` | Yes (Admin) | Update crop |
| DELETE | `/api/crop-info/:id` | Yes (Admin) | Delete crop |

---

### Government Schemes Routes
**File**: `governmentScheme.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/schemes` | No | Get all schemes |
| GET | `/api/schemes/:id` | No | Get scheme details |
| POST | `/api/schemes` | Yes (Admin) | Add new scheme |
| PUT | `/api/schemes/:id` | Yes (Admin) | Update scheme |
| DELETE | `/api/schemes/:id` | Yes (Admin) | Delete scheme |

---

### Price Alert Routes
**File**: `priceAlert.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/price-alerts` | Yes | Get user's alerts |
| POST | `/api/price-alerts` | Yes | Create new alert |
| PUT | `/api/price-alerts/:id` | Yes | Update alert |
| DELETE | `/api/price-alerts/:id` | Yes | Delete alert |

---

### Weather Routes
**File**: `weatherData.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/weather/current` | No | Get current weather |
| GET | `/api/weather/forecast` | No | Get 7-day forecast |
| POST | `/api/weather` | Yes (Admin) | Record weather data |

---

### Profile Routes
**File**: `profile.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/profile` | Yes | Get user profile |
| PUT | `/api/profile` | Yes | Update profile |
| POST | `/api/profile/avatar` | Yes | Upload profile picture |

---

### Chat History Routes
**File**: `chatHistory.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/chat-history` | Yes | Get all chat sessions |
| GET | `/api/chat-history/:id` | Yes | Get specific session |
| DELETE | `/api/chat-history/:id` | Yes | Delete session |

---

### Testing Routes
**File**: `testAPI.routes.ts`, `testCropDisease.routes.ts`, `databaseTest.routes.ts`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/test/gemini` | No | Test Gemini API |
| POST | `/api/test/crop-disease` | No | Test disease detection |
| GET | `/api/test/database` | No | Test MongoDB connection |

---

## Middleware

### Authentication Middleware
**File**: `../middleware/auth.ts`

```typescript
import { authenticateToken } from '../middleware/auth.js';

// Apply to protected routes
router.post('/protected', authenticateToken, controller.method);
```

**What it does**:
- Verifies JWT token from Authorization header
- Extracts user ID from token
- Attaches user to request object
- Returns 401 if token invalid/missing

---

## Adding New Routes

### Steps

1. **Create Route File**: `newFeature.routes.ts`
2. **Define Routes**: Add endpoints with methods
3. **Apply Middleware**: Add auth where needed
4. **Register in index.ts**: Add to main router
5. **Document**: Add to this README

### Template

```typescript
import express from 'express';
import { newController } from '../controllers/newController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/', newController.getAll);
router.get('/:id', newController.getById);

// Protected routes
router.post('/', authenticateToken, newController.create);
router.put('/:id', authenticateToken, newController.update);
router.delete('/:id', authenticateToken, newController.delete);

export default router;
```

### Register in index.ts

```typescript
import newRoutes from './routes/newFeature.routes.js';

app.use('/api/new-feature', newRoutes);
```

---

## Best Practices

### 1. RESTful Design
Follow REST conventions:
- GET: Retrieve data
- POST: Create new resource
- PUT/PATCH: Update resource
- DELETE: Remove resource

### 2. Consistent Naming
Use plural nouns for collections:
- `/api/users` not `/api/user`
- `/api/crops` not `/api/crop`

### 3. Versioning
Consider API versioning for breaking changes:
```typescript
app.use('/api/v1/resource', routes);
app.use('/api/v2/resource', newRoutes);
```

### 4. Error Handling
Let controllers handle errors, routes just define endpoints.

### 5. Middleware Order
Apply middleware in correct order:
```typescript
router.post('/', 
  authenticateToken,  // Auth first
  validateInput,      // Then validation
  controller.method   // Finally controller
);
```

---

## Related Directories

- **Controllers**: `../controllers/` - Request handlers
- **Middleware**: `../middleware/` - Auth, validation
- **Models**: `../models/` - Database schemas
