# Kisan Sathi Server

Express + TypeScript API with optional MongoDB and JWT auth.

Env (.env):
- PORT=5001
- CLIENT_ORIGIN=http://localhost:5173
- JWT_SECRET=change_me
- OPENAI_API_KEY=sk-...
- MONGO_URI=mongodb://127.0.0.1:27017/kisan_sathi (optional)
 - MARKET_API_URL=https://example.com/market/prices
 - MARKET_API_KEY=579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b

Scripts:
- npm run dev
- npm run build && npm start

Routes:
- GET /api/health
- POST /api/auth/register { email, password, name? }
- POST /api/auth/login { email, password }
- GET  /api/auth/me (Bearer token)
- POST /api/alerts { crop, targetPrice } (Bearer token or userId in body)
- GET  /api/alerts/:userId (use `me` to use token)
- GET  /api/prices
- GET  /api/prediction-details?crop=&market=
- POST /api/ai/chat { message, systemPrompt? }
- POST /api/ai/analyze-image { imageBase64, query, systemPrompt? }
