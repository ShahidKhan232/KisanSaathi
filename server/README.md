# Kisan Sathi Server

Express + TypeScript API with JWT auth and optional MongoDB persistence.

## Environment (.env)

- PORT=5001
- CLIENT_ORIGIN=http://localhost:5173
- JWT_SECRET=change_me
- OPENAI_API_KEY=sk-...
- MONGO_URI=mongodb://127.0.0.1:27017/kisan_sathi (optional)
- MARKET_API_URL=https://example.com/market/prices
- MARKET_API_KEY=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b

## Scripts

- npm run dev
- npm run build && npm start

## Core Routes

- GET /api/health
- GET /api/health/database
- POST /api/auth/register { email, password, name? }
- POST /api/auth/login { email, password }
- GET /api/auth/me (Bearer token)
- POST /api/ai/chat { message, systemPrompt? }
- POST /api/ai/analyze-image { imageBase64, query, systemPrompt? }
- GET /api/alerts/:userId (use me for token user)
- POST /api/alerts { crop, targetPrice, ... }
- GET /api/market-prices
- GET /api/schemes
- GET /api/chat
- GET /api/diseases
- GET /api/crops
- GET /api/weather
- GET /api/database/test (auth required)
- POST /api/database/sample-data (auth required)

## Database

The server uses MongoDB via Mongoose when MONGO_URI is configured.

- Connection file: src/config/database.ts
- Models registry: src/models/index.ts
- Startup behavior: on boot the app connects to MongoDB, registers models, and creates indexes.

### Fallback mode

If MONGO_URI is missing, or MongoDB connection retries fail, the app falls back to in-memory storage.

- Data is non-persistent in this mode
- Data is lost on server restart

### Collections (Mongoose models)

- User
- ChatHistory
- CropDisease
- CropInfo
- CropRecommendation
- GovernmentScheme
- MarketPrice
- PriceAlert
- WeatherData

### Important constraints and indexes

- User: unique email, unique sparse firebaseUid
- ChatHistory: unique (sessionId, userId)
- MarketPrice: unique (commodity, market, priceDate)
- WeatherData: unique (location, recordDate, source)
- Time-series user history indexes on chat, disease, alerts, recommendations, and weather collections

### Database health and diagnostics

- GET /api/health/database
	- Returns configured/connected state, DB name, host, loaded models, and discovered collections
- GET /api/database/test (auth required)
	- Returns per-collection document counts and user-scoped data counts
- POST /api/database/sample-data (auth required)
	- Inserts sample docs for testing core flows
