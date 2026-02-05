
# KisanSaathi — AI-Powered Agricultural Assistant

![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)
![React](https://img.shields.io/badge/React-18.3-61dafb.svg)
![Node.js](https://img.shields.io/badge/Node.js-Express-green.svg)

KisanSaathi is an intelligent, multilingual digital assistant designed to empower farmers across India. It combines AI, real-time government data, and machine learning to provide actionable insights on crop health, market trends, and government schemes — all in a simple and farmer-friendly interface.

## 🚀 Key Features

### 🧠 AI-Powered Chatbot
- Conversational AI assistant powered by Google Gemini
- Multilingual support (English, Hindi, Marathi)
- Real-time responses via WebSocket
- Context-aware farming advice

### 🌾 Crop Disease Detection
- Upload or capture crop images to identify diseases instantly
- AI-powered image analysis using Gemini Vision API
- Treatment suggestions and prevention guidance
- Disease history tracking

### 🌱 Crop Recommendation System
- **ML-Powered Recommendations**: Random Forest model with 99% accuracy
- **Smart Analysis**: Considers soil nutrients (N, P, K, pH) and climate factors
- **Top 3 Predictions**: Ranked crop suggestions with confidence scores
- **22 Crops Supported**: Cereals, pulses, cash crops, fruits, and spices
- **Easy Integration**: Python API with Streamlit interface

### 💰 AI-Generated Market Prices
- **AI-Powered Pricing**: Daily market prices generated using Google Gemini AI
- **25 Major Crops**: Wheat, Rice, Cotton, Soybean, Vegetables, Pulses, and more
- **Multi-Market Coverage**: Prices from major mandis across multiple states
- **Modern UI**: Premium design with gradients, glassmorphism effects, and animations
- **Real-time Status**: Live AI price generation status and freshness indicators
- **Smart Filters**: Filter by crop, market, state, and district
- **Automated Updates**: Daily price refresh via cron jobs

### 🏛️ Government Schemes Discovery
- Browse latest agricultural schemes
- Filter by state, crop, and eligibility
- Detailed scheme information and application links
- Personalized scheme recommendations

### 📱 User-Friendly Interface
- Modern, responsive design
- Dark/Light theme support
- Real-time notifications
- Offline capability (PWA ready)

---

## 🧩 System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                                │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   React Frontend (Vite + TypeScript)                          │  │
│  │   • 18 Components (ChatBot, CropDisease, Dashboard, etc.)     │  │
│  │   • 4 Contexts (Auth, Profile, Voice, Language)               │  │
│  │   • 8 Services (AI, API, Price, Scheme, Alert, Weather)       │  │
│  │   • Real-time: Socket.IO Client                               │  │
│  │   • Multilingual: i18next (English, Hindi, Marathi)           │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                ↕ HTTP/WebSocket
┌─────────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                              │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   Express.js Server (TypeScript)                              │  │
│  │   • Middleware: Auth, CORS, Rate Limit, Helmet, Morgan        │  │
│  │   • 16 Route Modules                                          │  │
│  │   • 15 Controllers                                            │  │
│  │   • WebSocket: Socket.IO Server                               │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                    BUSINESS LOGIC LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │  Services    │  │  Utilities   │  │  Validation  │              │
│  │  • WebSocket │  │  • Cron Jobs │  │  • Zod       │              │
│  │  • AI Price  │  │  • JWT       │  │  • Input     │              │
│  │    Generator │  │  • Logging   │  │    Schemas   │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                         DATA LAYER                                  │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │   MongoDB Database (12 Collections)                          │  │
│  │   • User, ChatHistory, CropDisease, CropRecommendation        │  │
│  │   • MarketPrice, GovernmentScheme, PriceAlert, WeatherData    │  │
│  │   • CropInfo, and more...                                     │  │
│  └───────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│                      EXTERNAL SERVICES                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐                │
│  │   Google    │  │  MyScheme   │  │   Python     │                │
│  │ Gemini API  │  │     API     │  │  ML Service  │                │
│  │ • Chat AI   │  │ • Gov Data  │  │ • Crop Rec.  │                │
│  │ • Vision    │  │ • Schemes   │  │ • Random     │                │
│  │ • Prices    │  │             │  │   Forest     │                │
│  └─────────────┘  └─────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
```

> **📖 Detailed Architecture**: For comprehensive architecture documentation with Mermaid diagrams, data flows, and component interactions, see [System Architecture Documentation](./docs/SYSTEM_ARCHITECTURE.md)

---

## 📚 Documentation

### System Architecture
For a comprehensive understanding of the system design, components, and data flows:
- **[System Architecture Documentation](./docs/SYSTEM_ARCHITECTURE.md)** - Complete technical architecture with diagrams
  - High-level architecture overview
  - Frontend & backend component breakdown
  - Database schema with ER diagrams
  - API endpoint structure
  - Data flow diagrams (AI chatbot, disease detection, market prices)
  - Security architecture
  - Deployment architecture

### Crop Recommendation System
For details on the ML-based crop recommendation engine:
- **[Crop Recommendation README](./Crop-Recommendation-System/README.md)** - ML system documentation
  - Model details and performance metrics
  - Installation and setup guide
  - Usage examples (Streamlit UI, Python API, Backend integration)
  - Training guide
  - API reference

### Component Documentation
Each major directory contains detailed README files:
- **[Frontend Components](./frontend/src/components/README.md)** - All 18 React components
- **[Frontend Contexts](./frontend/src/contexts/README.md)** - 4 context providers
- **[Frontend Hooks](./frontend/src/hooks/README.md)** - 8 custom hooks
- **[Frontend Services](./frontend/src/services/README.md)** - 8 API services
- **[Backend Controllers](./server/src/controllers/README.md)** - 15 API controllers
- **[Backend Routes](./server/src/routes/README.md)** - Complete API reference
- **[Backend Models](./server/src/models/README.md)** - 12 MongoDB schemas
- **[Backend Services](./server/src/services/README.md)** - Business logic services
- **[Backend Utils](./server/src/utils/README.md)** - Utilities and cron jobs

---

## 🧠 AI & Technology Stack

### Frontend
- **Framework**: React 18.3 with TypeScript
- **Build Tool**: Vite 5.4
- **Styling**: TailwindCSS + Custom CSS
- **Charts**: Recharts for data visualization
- **Icons**: Lucide React
- **Real-time**: Socket.IO Client

### Backend
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript 5.5
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (jsonwebtoken) + bcryptjs
- **AI Integration**: Google Gemini API (@google/generative-ai)
- **Real-time**: Socket.IO
- **Scheduling**: Node-cron for automated tasks
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

### AI & ML
- **Conversational AI**: Google Gemini 1.5 Flash/Pro
- **Image Analysis**: Gemini Vision API for crop disease detection
- **Crop Recommendation**: Random Forest ML model (Python + scikit-learn)
  - 300 decision trees with 99% accuracy
  - Predicts top 3 suitable crops based on soil (NPK, pH) and climate data
  - Supports 22 different crops (cereals, pulses, cash crops, fruits, spices)
- **Voice Interface**: Google Cloud Speech & Text-to-Speech APIs (planned)

---

## 🔌 Data Sources

- **Market Prices**: Google Gemini AI — AI-generated daily prices for 25+ crops across multiple markets
- **Government Schemes**: MyScheme API — Real-time central & state scheme data
- **Crop Disease**: Gemini Vision API for image-based disease detection
- **Weather Data**: OpenWeatherMap API (planned integration)
- **Price Automation**: Node-cron for scheduled daily price generation

---

## 📁 Project Structure
```
KisanSaathi/
├── package.json           # Root workspace configuration
├── docs/                  # Documentation
│   └── SYSTEM_ARCHITECTURE.md  # Complete system architecture documentation
├── frontend/              # Frontend project (Workspace A)
│   ├── src/               # React + TypeScript source code
│   │   ├── components/    # 18 React components (with README.md)
│   │   ├── contexts/      # 4 React context providers (with README.md)
│   │   ├── hooks/         # 8 custom React hooks (with README.md)
│   │   ├── services/      # 8 API service modules (with README.md)
│   │   └── types/         # TypeScript type definitions
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── .env               # Frontend environment variables
├── server/                # Express.js Backend (Workspace B)
│   ├── src/               # Backend source code
│   │   ├── controllers/   # 15 API controllers (with README.md)
│   │   ├── services/      # Business logic services (with README.md)
│   │   ├── routes/        # 16 API route definitions (with README.md)
│   │   ├── models/        # 12 MongoDB schemas (with README.md)
│   │   ├── utils/         # 7 utility scripts & cron jobs (with README.md)
│   │   ├── middleware/    # Authentication & validation
│   │   ├── config/        # Database & app configuration
│   │   └── types/         # TypeScript interfaces
│   ├── package.json       # Backend dependencies
│   └── .env               # Backend environment variables
├── Crop-Recommendation-System/  # ML-based crop recommendation
│   ├── app.py             # Streamlit web interface
│   ├── predict.py         # Prediction logic and API
│   ├── train.py           # Model training script
│   ├── crop_model.pkl     # Trained Random Forest model (11MB)
│   ├── data.xlsx          # Training dataset
│   ├── requirements.txt   # Python dependencies
│   └── README.md          # ML system documentation
└── README.md              # Project documentation
```

> **📚 Comprehensive Documentation**: Each major directory contains a detailed README.md file documenting all components, their features, usage patterns, and best practices. See [Documentation](#-documentation) section above for complete overview.
---

## 💡 How It Works

1. **User Interaction**: Farmer interacts via web interface (text/voice/image upload)
2. **Frontend Processing**: React app validates input and sends request to backend
3. **API Routing**: Express.js routes request to appropriate controller
4. **AI Processing**: 
   - Chat queries → Gemini API for conversational responses
   - Image uploads → Gemini Vision API for disease detection
   - Data queries → MongoDB for historical data
5. **Real-time Updates**: WebSocket (Socket.IO) for live notifications
6. **Response Delivery**: Results displayed in user's preferred language

---

## � Quick Setup (Development)

> These commands are optimized for Windows PowerShell. Adjust as needed for macOS/Linux.

### Prerequisites
- Node.js 18+ and npm
- MongoDB (local or cloud instance)
- Google Gemini API key

### 1. Clone the repository

```powershell
git clone https://github.com/ShahidKhan232/KisanSaathi.git
cd KisanSaathi
```

### 2. Install dependencies

```powershell
# Install all dependencies (Frontend & Backend) using Workspaces
npm install
```

### 3. Set up environment variables

Create `.env` file in the **frontend directory** (`d:/KisanSaathi/frontend/.env`):

```env
# Client Configuration
VITE_SERVER_URL=http://localhost:5001
```

Create `server/.env` file:

```env
# Server Port
PORT=5001
NODE_ENV=development

# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/kisansaathi
# OR use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kisansaathi

# JWT Secret (generate a secure random string)
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production

# Google Gemini API
GEMINI_API_KEY=your_gemini_api_key_here

# CORS Configuration
CLIENT_ORIGIN=http://localhost:5173

# Optional: External APIs
AGMARKNET_API_URL=https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070
MYSCHEME_API_URL=https://www.myscheme.gov.in/api/v1/schemes
```

### 4. Start the development servers

```powershell
# Start both frontend and backend concurrently
npm run dev

# OR start them separately in different terminals:

# Terminal 1 - Frontend
npm run dev:frontend

# Terminal 2 - Backend
npm run dev:backend
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001
- **API Health Check**: http://localhost:5001/api/health

### 5. Build for production

```powershell
# Build both frontend and backend
npm run build

# Start production server
cd server
npm start
```

---

## 🌍 Future Enhancements

- **Advanced ML Models**: Implement custom CNN models for more accurate disease detection
- **Price Forecasting**: ARIMA/LSTM models for market price predictions
- **Voice Assistant**: Full voice-based interaction in regional languages
- **IoT Integration**: Connect with soil sensors and weather stations
- **Crop Yield Prediction**: Satellite imagery analysis for yield forecasting
- **Multi-platform**: WhatsApp & Telegram bot versions
- **Offline Mode**: Progressive Web App (PWA) with offline capabilities
- **Community Features**: Farmer forums and knowledge sharing
- **E-commerce Integration**: Direct market linkage for selling produce

---

## � API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### AI Features
- `POST /api/ai/chat` - Chat with AI assistant
- `POST /api/crop-disease/detect` - Detect crop diseases from images
- `GET /api/crop-disease/history` - Get disease detection history

### Market Prices (AI-Generated)
- `GET /api/market-prices` - Get all AI-generated prices (with filters)
- `GET /api/market-prices/ai-status` - Get AI price generation status
- `POST /api/market-prices/fetch-ai-prices` - Manually trigger AI price generation (auth required)

### User Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/users` - List users (admin)

### Health Checks
- `GET /api/health` - Server health status
- `GET /api/health/database` - Database connection status

> **📖 Complete API Reference**: See [Routes README](./server/src/routes/README.md) for detailed endpoint documentation with parameters, authentication requirements, and examples.

---

## 🤖 AI Market Price Generation

### Overview
KisanSaathi uses Google Gemini AI to generate realistic daily market prices for 25+ major Indian crops across multiple markets and states.

### Features
- **Daily Generation**: Automated cron job runs at midnight IST
- **25 Crops Covered**: Cereals, pulses, oilseeds, vegetables, cash crops, and spices
- **Multi-Market**: 2-3 markets per crop across different states
- **Realistic Pricing**: Considers seasonal patterns, regional variations, and supply-demand
- **Database Integration**: Automatically saves/updates prices in MongoDB

### Crops Included
- **Cereals**: Wheat, Rice, Maize, Bajra, Jowar
- **Pulses**: Gram, Tur, Moong, Urad, Masoor
- **Oilseeds**: Soybean, Groundnut, Mustard, Sunflower
- **Cash Crops**: Cotton, Sugarcane
- **Vegetables**: Potato, Onion, Tomato, Cabbage, Cauliflower
- **Spices**: Chili, Turmeric, Coriander, Cumin

### Usage

#### View AI Prices
Navigate to Market Prices page to see AI-generated prices with:
- Modern gradient UI with glassmorphism effects
- Real-time AI status indicators
- Smart filters by crop, market, state, district
- Price cards with hover animations

#### Manual Price Generation
```bash
cd server
npm run build
node dist/utils/generateInitialPrices.js
```

#### Create Sample Data (for testing)
```bash
cd server
npm run build
node dist/utils/createSamplePrices.js
```

### Automation
Prices are automatically generated daily at midnight IST via cron job:
- Checks if prices are stale (>24 hours)
- Generates new prices using Gemini AI
- Updates database with fresh data
- Logs success/failure for monitoring

### Configuration
Set `GEMINI_API_KEY` in `server/.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)

---

## 👥 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## � Acknowledgments

**Developed by**: Shahid Khan  
**Department**: Computer Science & Engineering (AI/ML)

**Data Sources**:
- Ministry of Agriculture & Farmers Welfare
- Ministry of Statistics & Programme Implementation
- MyScheme (Government of India)
- data.gov.in
- Google Gemini AI

---

## 📞 Support

For issues, questions, or suggestions:
- **GitHub Issues**: [Create an issue](https://github.com/ShahidKhan232/KisanSaathi/issues)
- **Email**: Contact the development team

---

**Made with ❤️ for Indian Farmers**
