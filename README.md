
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

### 💰 Market Price Analysis
- Real-time mandi price data integration
- Price trend visualization with interactive charts
- Historical price analysis
- Market insights and forecasting

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
┌─────────────────────────────────────┐
│   React + TypeScript Frontend       │
│   (Vite, TailwindCSS, Recharts)    │
└──────────────┬──────────────────────┘
               │ HTTP/WebSocket
┌──────────────▼──────────────────────┐
│   Express.js Backend (TypeScript)   │
│   ├── /api/auth     → JWT Auth     │
│   ├── /api/ai       → Gemini AI    │
│   ├── /api/profile  → User Data    │
│   └── /api/users    → User Mgmt    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│         MongoDB Database            │
│   (User, Profile, Chat History)    │
└─────────────────────────────────────┘
```

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
- **Security**: Helmet, CORS, Rate Limiting
- **Logging**: Morgan

### AI & ML
- **Conversational AI**: Google Gemini 1.5 Flash/Pro
- **Image Analysis**: Gemini Vision API for crop disease detection
- **Voice Interface**: Google Cloud Speech & Text-to-Speech APIs (planned)

---

## 🔌 Data Sources

- **Market Prices**: Agmarknet API (data.gov.in) — Daily mandi-wise crop prices
- **Government Schemes**: MyScheme API — Real-time central & state scheme data
- **Crop Disease**: Gemini Vision API for image-based disease detection
- **Weather Data**: OpenWeatherMap API (planned integration)

---

## � Project Structure

KisanSaathi/
├── package.json           # Root workspace configuration
├── frontend/              # Frontend project (Workspace A)
│   ├── src/               # React + TypeScript source code
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React context providers
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API service layer
│   │   └── types/         # TypeScript type definitions
│   ├── package.json       # Frontend dependencies
│   ├── vite.config.ts     # Vite configuration
│   └── .env               # Frontend environment variables
├── server/                # Express.js Backend (Workspace B)
│   ├── src/               # Backend source code
│   ├── package.json       # Backend dependencies
│   └── .env               # Backend environment variables
└── README.md              # Project documentation

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
- `POST /api/ai/disease-detect` - Detect crop diseases from images

### User Management
- `GET /api/profile` - Get user profile
- `PUT /api/profile` - Update user profile
- `GET /api/users` - List users (admin)

### Health Checks
- `GET /api/health` - Server health status
- `GET /api/health/database` - Database connection status

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
