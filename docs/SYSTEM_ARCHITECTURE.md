# KisanSaathi — System Architecture Documentation

> **AI-Powered Agricultural Assistant Platform**  
> Comprehensive system architecture and technical documentation

---

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Technology Stack](#technology-stack)
4. [Component Architecture](#component-architecture)
5. [Database Schema](#database-schema)
6. [API Architecture](#api-architecture)
7. [Data Flow](#data-flow)
8. [Security Architecture](#security-architecture)
9. [AI/ML Integration](#aiml-integration)
10. [Deployment Architecture](#deployment-architecture)

---

## System Overview

**KisanSaathi** is a full-stack, AI-powered agricultural assistant platform designed to empower farmers across India with intelligent farming insights, real-time market data, crop disease detection, and government scheme recommendations.

### Key Capabilities

- **AI Chatbot**: Multilingual conversational assistant powered by Google Gemini
- **Crop Disease Detection**: Image-based disease identification using Gemini Vision API
- **Market Prices**: AI-generated daily market prices for 25+ crops
- **Crop Recommendations**: ML-based crop suggestions using soil and climate data
- **Government Schemes**: Personalized scheme recommendations
- **Real-time Updates**: WebSocket-based notifications and live data

### Architecture Principles

- **Microservices-Ready**: Modular backend with clear separation of concerns
- **API-First**: RESTful API design with comprehensive endpoint coverage
- **Real-time**: WebSocket integration for live updates
- **Multilingual**: i18next-based internationalization (English, Hindi, Marathi)
- **Scalable**: MongoDB for horizontal scaling, stateless backend design
- **Secure**: JWT authentication, rate limiting, CORS, helmet security

---

## High-Level Architecture

```mermaid
graph TB
    subgraph "Client Layer"
        A[React Frontend<br/>Vite + TypeScript]
        A1[Components<br/>18 UI Components]
        A2[Contexts<br/>Auth, Profile, Voice]
        A3[Services<br/>API Integration]
        A --> A1
        A --> A2
        A --> A3
    end

    subgraph "API Gateway Layer"
        B[Express.js Server<br/>TypeScript]
        B1[Middleware<br/>Auth, CORS, Rate Limit]
        B2[Routes<br/>16 Route Modules]
        B --> B1
        B --> B2
    end

    subgraph "Business Logic Layer"
        C1[Controllers<br/>15 Controllers]
        C2[Services<br/>WebSocket, AI, Market]
        C3[Utilities<br/>Cron Jobs, Validation]
    end

    subgraph "Data Layer"
        D1[(MongoDB<br/>12 Collections)]
        D2[Models<br/>Mongoose Schemas]
    end

    subgraph "External Services"
        E1[Google Gemini API<br/>Chat & Vision]
        E2[MyScheme API<br/>Government Data]
        E3[Python ML Service<br/>Crop Recommendation]
    end

    A -->|HTTP/WebSocket| B
    B --> C1
    C1 --> C2
    C1 --> C3
    C2 --> D2
    C3 --> D2
    D2 --> D1
    C2 -->|API Calls| E1
    C2 -->|API Calls| E2
    C2 -->|HTTP| E3

    style A fill:#61dafb,stroke:#333,stroke-width:2px
    style B fill:#68a063,stroke:#333,stroke-width:2px
    style D1 fill:#4db33d,stroke:#333,stroke-width:2px
    style E1 fill:#4285f4,stroke:#333,stroke-width:2px
```

---

## Technology Stack

### Frontend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 18.3 | UI framework |
| **TypeScript** | 5.5 | Type safety |
| **Vite** | 5.4 | Build tool & dev server |
| **TailwindCSS** | 3.4 | Styling framework |
| **i18next** | 25.8 | Internationalization |
| **Recharts** | 2.10 | Data visualization |
| **Axios** | 1.6 | HTTP client |
| **Socket.IO Client** | 4.8 | Real-time communication |
| **Lucide React** | 0.344 | Icon library |
| **Firebase** | 10.12 | Authentication & storage |

### Backend Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express.js** | 4.19 | Web framework |
| **TypeScript** | 5.5 | Type safety |
| **MongoDB** | 8.6 | Database |
| **Mongoose** | 8.6 | ODM for MongoDB |
| **JWT** | 9.0 | Authentication |
| **bcryptjs** | 2.4 | Password hashing |
| **Socket.IO** | 4.8 | WebSocket server |
| **Node-cron** | 4.2 | Scheduled tasks |
| **Helmet** | 7.1 | Security headers |
| **CORS** | 2.8 | Cross-origin requests |
| **Morgan** | 1.10 | HTTP logging |
| **Zod** | 3.23 | Schema validation |

### AI/ML Stack

| Technology | Purpose |
|------------|---------|
| **Google Gemini API** | Conversational AI & image analysis |
| **Gemini Vision** | Crop disease detection |
| **Python + scikit-learn** | Crop recommendation ML model |
| **Streamlit** | ML model interface (optional) |

### DevOps & Tools

| Technology | Purpose |
|------------|---------|
| **Git** | Version control |
| **npm Workspaces** | Monorepo management |
| **Concurrently** | Run multiple processes |
| **Nodemon** | Auto-restart dev server |
| **ESLint** | Code linting |

---

## Component Architecture

### Frontend Architecture

```mermaid
graph LR
    subgraph "Frontend Application"
        A[App.tsx<br/>Root Component]
        
        subgraph "Core Components"
            B1[Header]
            B2[Navigation]
            B3[Landing]
            B4[Dashboard]
        end
        
        subgraph "Feature Components"
            C1[ChatBot]
            C2[CropDiseaseDetection]
            C3[CropRecommendation]
            C4[PricePrediction]
            C5[SchemeRecommendations]
        end
        
        subgraph "Auth Components"
            D1[AuthForm]
            D2[Onboarding]
            D3[Profile]
        end
        
        subgraph "Utility Components"
            E1[Modal]
            E2[ErrorBoundary]
            E3[ApplicationProgressTracker]
        end
        
        subgraph "Contexts"
            F1[AuthContext]
            F2[FarmerProfileContext]
            F3[VoiceContext]
        end
        
        subgraph "Services"
            G1[aiService]
            G2[apiService]
            G3[pricePredictionService]
            G4[schemeRecommendationService]
            G5[alertService]
            G6[weatherService]
            G7[socketService]
            G8[userProfileService]
        end
    end
    
    A --> B1
    A --> B2
    A --> B3
    A --> B4
    A --> C1
    A --> C2
    A --> C3
    A --> C4
    A --> C5
    A --> D1
    A --> D2
    A --> D3
    
    C1 --> F1
    C2 --> F1
    C3 --> F1
    C4 --> F1
    
    C1 --> G1
    C2 --> G1
    C3 --> G2
    C4 --> G3
    C5 --> G4
    
    F1 --> G2
    F2 --> G8
```

#### Component Breakdown

**Core Components (4)**
- [Header.tsx](file:///d:/KisanSaathi/frontend/src/components/Header.tsx) - App header with navigation
- [Navigation.tsx](file:///d:/KisanSaathi/frontend/src/components/Navigation.tsx) - Main navigation menu
- [Landing.tsx](file:///d:/KisanSaathi/frontend/src/components/Landing.tsx) - Landing page
- [Dashboard.tsx](file:///d:/KisanSaathi/frontend/src/components/Dashboard.tsx) - User dashboard

**AI/ML Components (5)**
- [ChatBot.tsx](file:///d:/KisanSaathi/frontend/src/components/ChatBot.tsx) - AI chatbot interface
- [ChatHistory.tsx](file:///d:/KisanSaathi/frontend/src/components/ChatHistory.tsx) - Chat history viewer
- [CropDiseaseDetection.tsx](file:///d:/KisanSaathi/frontend/src/components/CropDiseaseDetection.tsx) - Disease detection
- [DiseaseHistory.tsx](file:///d:/KisanSaathi/frontend/src/components/DiseaseHistory.tsx) - Disease history
- [CropRecommendation.tsx](file:///d:/KisanSaathi/frontend/src/components/CropRecommendation.tsx) - Crop recommendations

**Market Components (1)**
- [PricePrediction.tsx](file:///d:/KisanSaathi/frontend/src/components/PricePrediction.tsx) - AI-generated market prices

**Information Components (1)**
- [SchemeRecommendations.tsx](file:///d:/KisanSaathi/frontend/src/components/SchemeRecommendations.tsx) - Government schemes

**Auth Components (3)**
- [AuthForm.tsx](file:///d:/KisanSaathi/frontend/src/components/AuthForm.tsx) - Login/register form
- [Onboarding.tsx](file:///d:/KisanSaathi/frontend/src/components/Onboarding.tsx) - User onboarding
- [Profile.tsx](file:///d:/KisanSaathi/frontend/src/components/Profile.tsx) - User profile

**Utility Components (3)**
- [Modal.tsx](file:///d:/KisanSaathi/frontend/src/components/Modal.tsx) - Reusable modal
- [ErrorBoundary.tsx](file:///d:/KisanSaathi/frontend/src/components/ErrorBoundary.tsx) - Error handling
- [ApplicationProgressTracker.tsx](file:///d:/KisanSaathi/frontend/src/components/ApplicationProgressTracker.tsx) - Progress tracking

### Backend Architecture

```mermaid
graph TB
    subgraph "Express Server"
        A[index.ts<br/>Server Entry Point]
        
        subgraph "Middleware Layer"
            M1[helmet<br/>Security Headers]
            M2[cors<br/>Cross-Origin]
            M3[express.json<br/>Body Parser]
            M4[morgan<br/>HTTP Logger]
            M5[rateLimit<br/>Rate Limiting]
            M6[authenticateToken<br/>JWT Auth]
        end
        
        subgraph "Routes (16)"
            R1[authRoutes]
            R2[profileRoutes]
            R3[aiRoutes]
            R4[cropRoutes]
            R5[marketPriceRoutes]
            R6[schemeRoutes]
            R7[cropDiseaseRoutes]
            R8[chatHistoryRoutes]
            R9[weatherRoutes]
            R10[priceAlertRoutes]
        end
        
        subgraph "Controllers (15)"
            C1[authController]
            C2[profileController]
            C3[aiController]
            C4[cropRecommendationController]
            C5[marketPriceController]
            C6[governmentSchemeController]
            C7[cropDiseaseController]
            C8[chatHistoryController]
        end
        
        subgraph "Services (3)"
            S1[WebSocketManager]
            S2[marketPriceAI.service]
        end
        
        subgraph "Utils (7)"
            U1[priceFetchCron]
            U2[generateInitialPrices]
            U3[createSamplePrices]
            U4[jwt]
            U5[validation]
            U6[seedDatabase]
        end
        
        subgraph "Models (12)"
            D1[User]
            D2[MarketPrice]
            D3[CropInfo]
            D4[CropDisease]
            D5[CropRecommendation]
            D6[GovernmentScheme]
            D7[PriceAlert]
            D8[WeatherData]
            D9[ChatHistory]
        end
    end
    
    A --> M1
    M1 --> M2
    M2 --> M3
    M3 --> M4
    M4 --> M5
    M5 --> R1
    
    R1 --> C1
    R2 --> C2
    R3 --> C3
    R4 --> C4
    R5 --> C5
    R6 --> C6
    R7 --> C7
    R8 --> C8
    
    C1 --> D1
    C3 --> S1
    C5 --> S2
    C5 --> D2
    C7 --> D4
    
    S2 --> U1
    U1 --> U2
```

#### Backend Component Breakdown

**Controllers (15)**
- Authentication & user management
- AI chatbot interactions
- Crop disease detection
- Crop recommendations
- Market price data
- Government schemes
- Price alerts
- Weather data
- Chat history

**Services (3)**
- [WebSocketManager.ts](file:///d:/KisanSaathi/server/src/services/WebSocketManager.ts) - Real-time communication
- [marketPriceAI.service.ts](file:///d:/KisanSaathi/server/src/services/marketPriceAI.service.ts) - AI price generation

**Utilities (7)**
- [priceFetchCron.ts](file:///d:/KisanSaathi/server/src/utils/priceFetchCron.ts) - Automated price updates
- [generateInitialPrices.ts](file:///d:/KisanSaathi/server/src/utils/generateInitialPrices.ts) - Initial price data
- [createSamplePrices.ts](file:///d:/KisanSaathi/server/src/utils/createSamplePrices.ts) - Sample data
- [jwt.ts](file:///d:/KisanSaathi/server/src/utils/jwt.ts) - JWT utilities
- [validation.ts](file:///d:/KisanSaathi/server/src/utils/validation.ts) - Input validation
- [seedDatabase.ts](file:///d:/KisanSaathi/server/src/utils/seedDatabase.ts) - Database seeding

---

## Database Schema

### MongoDB Collections (12)

```mermaid
erDiagram
    User ||--o{ ChatHistory : has
    User ||--o{ CropDisease : detects
    User ||--o{ CropRecommendation : requests
    User ||--o{ PriceAlert : creates
    
    User {
        ObjectId _id
        string name
        string email
        string password
        string phone
        string role
        object farmDetails
        object preferences
        date createdAt
        date updatedAt
    }
    
    ChatHistory {
        ObjectId _id
        ObjectId userId
        string sessionId
        array messages
        string language
        date createdAt
        date updatedAt
    }
    
    CropDisease {
        ObjectId _id
        ObjectId userId
        string cropName
        string diseaseName
        number confidence
        string imageUrl
        array symptoms
        string treatment
        string prevention
        date detectedAt
    }
    
    CropRecommendation {
        ObjectId _id
        ObjectId userId
        object soilData
        object climate
        array recommendedCrops
        date createdAt
    }
    
    MarketPrice {
        ObjectId _id
        string commodity
        string variety
        string market
        string state
        string district
        number minPrice
        number maxPrice
        number modalPrice
        date priceDate
        string source
        number arrivals
        date fetchedAt
    }
    
    GovernmentScheme {
        ObjectId _id
        string name
        string description
        string category
        array eligibility
        array benefits
        string applicationProcess
        array documents
        string state
        date startDate
        date endDate
        object contactInfo
        boolean isActive
    }
    
    PriceAlert {
        ObjectId _id
        ObjectId userId
        string commodity
        string market
        number targetPrice
        string condition
        boolean isActive
        date lastTriggered
    }
    
    CropInfo {
        ObjectId _id
        string name
        string scientificName
        string category
        array season
        number duration
        array soilType
        string climate
        string waterRequirement
        object cultivation
        object yield
        object marketPrice
    }
    
    WeatherData {
        ObjectId _id
        string location
        object coordinates
        object temperature
        number humidity
        number rainfall
        number windSpeed
        array forecast
        date recordDate
        string source
    }
```

### Key Indexes

**Performance Optimization**

- `User.email` - Unique index for fast login
- `MarketPrice.{commodity, market, priceDate}` - Compound index for price queries
- `CropDisease.{userId, detectedAt}` - User history queries
- `ChatHistory.{userId, sessionId}` - Session retrieval
- `GovernmentScheme.{state, isActive}` - Scheme filtering

---

## API Architecture

### API Endpoint Structure

```
/api
├── /auth                    # Authentication
│   ├── POST /register       # User registration
│   ├── POST /login          # User login
│   └── POST /logout         # User logout
│
├── /profile                 # User Profile
│   ├── GET /                # Get profile
│   └── PUT /                # Update profile
│
├── /ai                      # AI Features
│   ├── POST /chat           # Chat with AI
│   └── GET /chat/history    # Chat history
│
├── /crop                    # Crop Recommendations
│   ├── POST /recommendation # Get recommendations
│   └── GET /history         # Recommendation history
│
├── /market-prices           # Market Prices (AI-Generated)
│   ├── GET /                # Get all prices (with filters)
│   ├── GET /ai-status       # AI generation status
│   └── POST /fetch-ai-prices # Trigger AI generation
│
├── /schemes                 # Government Schemes
│   ├── GET /                # Get all schemes
│   ├── GET /:id             # Get scheme details
│   ├── POST /               # Create scheme (admin)
│   ├── PUT /:id             # Update scheme (admin)
│   └── DELETE /:id          # Delete scheme (admin)
│
├── /crop-disease            # Crop Disease Detection
│   ├── POST /detect         # Detect disease
│   ├── GET /history         # Detection history
│   └── DELETE /history/:id  # Delete history entry
│
├── /alerts                  # Price Alerts
│   ├── GET /                # Get user alerts
│   ├── POST /               # Create alert
│   ├── PUT /:id             # Update alert
│   └── DELETE /:id          # Delete alert
│
├── /weather                 # Weather Data
│   ├── GET /current         # Current weather
│   └── GET /forecast        # 7-day forecast
│
├── /chat                    # Chat History
│   ├── GET /                # Get all sessions
│   ├── GET /:id             # Get session
│   └── DELETE /:id          # Delete session
│
└── /health                  # Health Checks
    ├── GET /                # Server health
    └── GET /database        # Database status
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as MongoDB
    participant JWT as JWT Service
    
    C->>S: POST /api/auth/register
    S->>DB: Create user (hashed password)
    DB-->>S: User created
    S->>JWT: Generate token
    JWT-->>S: JWT token
    S-->>C: {user, token}
    
    C->>S: POST /api/auth/login
    S->>DB: Find user by email
    DB-->>S: User data
    S->>S: Verify password (bcrypt)
    S->>JWT: Generate token
    JWT-->>S: JWT token
    S-->>C: {user, token}
    
    C->>S: GET /api/profile (with JWT)
    S->>S: Verify JWT token
    S->>DB: Get user profile
    DB-->>S: Profile data
    S-->>C: Profile data
```

---

## Data Flow

### AI Chatbot Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant WS as WebSocket
    participant B as Backend
    participant G as Gemini API
    participant DB as MongoDB
    
    U->>F: Type message
    F->>WS: Send message via Socket.IO
    WS->>B: Receive message
    B->>DB: Save message to ChatHistory
    B->>G: Send to Gemini API
    G-->>B: AI response
    B->>DB: Save AI response
    B->>WS: Send response
    WS->>F: Receive response
    F->>U: Display response
```

### Crop Disease Detection Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant GV as Gemini Vision API
    participant DB as MongoDB
    
    U->>F: Upload crop image
    F->>F: Convert to base64
    F->>B: POST /api/crop-disease/detect
    B->>GV: Send image for analysis
    GV-->>B: Disease detection result
    B->>DB: Save detection to CropDisease
    B-->>F: Return result
    F->>U: Display disease, treatment, prevention
```

### Market Price Generation Flow

```mermaid
sequenceDiagram
    participant Cron as Cron Job
    participant S as marketPriceAI.service
    participant G as Gemini API
    participant DB as MongoDB
    participant U as User
    
    Cron->>S: Trigger daily (midnight IST)
    S->>S: Check if prices stale (>24h)
    S->>G: Request AI price generation
    Note over G: Generate prices for 25+ crops<br/>across multiple markets
    G-->>S: Return price data
    S->>DB: Save/update MarketPrice
    DB-->>S: Confirmation
    S->>Cron: Log success
    
    U->>DB: GET /api/market-prices
    DB-->>U: Return latest prices
```

### Crop Recommendation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant F as Frontend
    participant B as Backend
    participant ML as Python ML Service
    participant DB as MongoDB
    
    U->>F: Enter soil data (N, P, K, pH)
    U->>F: Enter climate data
    F->>B: POST /api/crop/recommendation
    B->>ML: HTTP request with parameters
    ML->>ML: Load crop_model.pkl
    ML->>ML: Predict top 3 crops
    ML-->>B: Return predictions
    B->>DB: Save to CropRecommendation
    B-->>F: Return recommendations
    F->>U: Display top 3 crops with confidence
```

---

## Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph "Security Measures"
        A[Client Request]
        
        B1[CORS<br/>Origin Validation]
        B2[Helmet<br/>Security Headers]
        B3[Rate Limiting<br/>120 req/min]
        
        C1[JWT Authentication<br/>Token Verification]
        C2[Input Validation<br/>Zod Schemas]
        
        D1[Password Hashing<br/>bcryptjs]
        D2[Environment Variables<br/>.env Protection]
        
        E[Secure Response]
    end
    
    A --> B1
    B1 --> B2
    B2 --> B3
    B3 --> C1
    C1 --> C2
    C2 --> D1
    D1 --> D2
    D2 --> E
```

### Security Features

**1. Authentication & Authorization**
- JWT-based authentication
- Token expiration and refresh
- Role-based access control (farmer, admin, expert)
- Password hashing with bcryptjs (10 rounds)

**2. API Security**
- CORS configuration with allowed origins
- Helmet.js for security headers
- Rate limiting (120 requests/minute per IP)
- Input validation with Zod schemas
- Request size limits (10MB max)

**3. Data Security**
- Environment variable protection
- MongoDB connection string encryption
- Sensitive data exclusion from responses
- HTTPS enforcement (production)

**4. Error Handling**
- Graceful error responses
- No stack trace exposure (production)
- Centralized error middleware
- Logging with Morgan

---

## AI/ML Integration

### Google Gemini Integration

```mermaid
graph LR
    subgraph "Gemini API Integration"
        A[Backend Services]
        
        B1[Gemini 1.5 Flash<br/>Chatbot]
        B2[Gemini Vision<br/>Disease Detection]
        B3[Gemini Pro<br/>Price Generation]
        
        C1[Chat Responses]
        C2[Disease Analysis]
        C3[Market Prices]
    end
    
    A -->|Text Prompts| B1
    A -->|Image + Prompt| B2
    A -->|Structured Prompt| B3
    
    B1 --> C1
    B2 --> C2
    B3 --> C3
```

**Gemini Use Cases**

1. **Conversational AI (Gemini 1.5 Flash)**
   - Multilingual farming advice
   - Context-aware responses
   - Real-time chat via WebSocket

2. **Crop Disease Detection (Gemini Vision)**
   - Image analysis
   - Disease identification
   - Treatment recommendations
   - Prevention strategies

3. **Market Price Generation (Gemini Pro)**
   - Daily price generation for 25+ crops
   - Multi-market coverage
   - Realistic pricing based on seasonal patterns
   - Automated cron job execution

### Python ML Service

**Crop Recommendation System**

```
Crop-Recommendation-System/
├── app.py                  # Streamlit interface
├── predict.py              # Prediction logic
├── predict_wrapper.py      # API wrapper
├── train.py                # Model training
├── crop_model.pkl          # Trained model (11MB)
└── data.xlsx               # Training dataset
```

**Model Details**
- **Algorithm**: Random Forest / Decision Tree
- **Input Features**: N, P, K, Temperature, Humidity, pH, Rainfall
- **Output**: Top 3 crop recommendations with confidence scores
- **Integration**: HTTP API endpoint called by backend

---

## Deployment Architecture

### Development Environment

```mermaid
graph TB
    subgraph "Development Setup"
        A[Developer Machine]
        
        B1[Frontend Dev Server<br/>Vite :5173]
        B2[Backend Dev Server<br/>Node.js :5001]
        B3[MongoDB Local<br/>:27017]
        B4[Python ML Service<br/>:8000]
        
        C1[Hot Reload]
        C2[TypeScript Watch]
        C3[Nodemon]
    end
    
    A --> B1
    A --> B2
    A --> B3
    A --> B4
    
    B1 --> C1
    B2 --> C2
    B2 --> C3
```

**Development Commands**
```bash
# Install all dependencies
npm install

# Start both frontend and backend
npm run dev

# Or start separately
npm run dev:frontend  # Port 5173
npm run dev:backend   # Port 5001
```

### Production Architecture

```mermaid
graph TB
    subgraph "Production Environment"
        A[Load Balancer]
        
        B1[Frontend<br/>Static Files<br/>CDN]
        B2[Backend Instances<br/>Node.js Cluster]
        
        C1[MongoDB Atlas<br/>Replica Set]
        C2[Redis Cache<br/>Session Store]
        
        D1[Google Gemini API]
        D2[External APIs]
        D3[Python ML Service]
    end
    
    A --> B1
    A --> B2
    B2 --> C1
    B2 --> C2
    B2 --> D1
    B2 --> D2
    B2 --> D3
```

**Production Considerations**
- **Frontend**: Static build deployed to CDN (Vercel/Netlify)
- **Backend**: Node.js cluster with PM2 process manager
- **Database**: MongoDB Atlas with replica sets
- **Caching**: Redis for session management and caching
- **Monitoring**: Application logs, error tracking
- **CI/CD**: Automated deployment pipeline

---

## Cron Jobs & Automation

### Scheduled Tasks

**1. Market Price Generation**
- **Schedule**: Daily at midnight IST
- **File**: [priceFetchCron.ts](file:///d:/KisanSaathi/server/src/utils/priceFetchCron.ts)
- **Function**: Generates AI prices for 25+ crops
- **Process**:
  1. Check if prices are stale (>24 hours)
  2. Call Gemini API for price generation
  3. Update MongoDB with new prices
  4. Log success/failure

**Cron Expression**: `0 0 * * *` (midnight daily)

---

## WebSocket Architecture

### Real-time Communication

```mermaid
sequenceDiagram
    participant C as Client
    participant WS as WebSocket Server
    participant B as Backend
    participant DB as Database
    
    C->>WS: Connect (Socket.IO)
    WS-->>C: Connection established
    
    C->>WS: Emit 'chat:message'
    WS->>B: Process message
    B->>DB: Save message
    B-->>WS: Response
    WS-->>C: Emit 'chat:response'
    
    B->>WS: Price update event
    WS-->>C: Emit 'price:update'
    
    B->>WS: Alert triggered
    WS-->>C: Emit 'alert:notification'
```

**WebSocket Events**
- `chat:message` - User sends chat message
- `chat:response` - AI response
- `price:update` - Market price updates
- `alert:notification` - Price alert triggered
- `disease:detected` - Disease detection complete

---

## Environment Configuration

### Required Environment Variables

**Backend (.env)**
```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/kisansaathi

# Authentication
JWT_SECRET=your_secret_key

# Google Gemini
GEMINI_API_KEY=your_gemini_api_key

# CORS
CLIENT_ORIGIN=http://localhost:5173
```

**Frontend (.env)**
```env
# API Configuration
VITE_SERVER_URL=http://localhost:5001
```

---

## Performance Optimization

### Backend Optimizations

1. **Database Indexes**: Compound indexes on frequently queried fields
2. **Connection Pooling**: MongoDB connection pool
3. **Compression**: Gzip compression middleware
4. **Rate Limiting**: Prevent API abuse
5. **Caching**: In-memory caching for static data

### Frontend Optimizations

1. **Code Splitting**: Lazy loading components
2. **Tree Shaking**: Vite build optimization
3. **Asset Optimization**: Image compression
4. **Memoization**: React.memo for expensive components
5. **Virtual Scrolling**: For large lists

---

## Future Enhancements

### Planned Features

1. **Advanced ML Models**
   - Custom CNN for disease detection
   - LSTM for price forecasting
   - Yield prediction models

2. **IoT Integration**
   - Soil sensor data integration
   - Weather station connectivity
   - Automated irrigation control

3. **Multi-platform**
   - WhatsApp bot integration
   - Telegram bot
   - Mobile apps (React Native)

4. **Enhanced Features**
   - Voice assistant (full integration)
   - Offline PWA mode
   - Community forums
   - E-commerce marketplace

---

## Appendix

### Project Statistics

- **Frontend Components**: 18
- **Backend Controllers**: 15
- **API Routes**: 16
- **Database Models**: 12
- **Services**: 8 (Frontend) + 3 (Backend)
- **Contexts**: 4
- **Custom Hooks**: 8
- **Total Lines of Code**: ~50,000+

### Key Files Reference

**Backend**
- [index.ts](file:///d:/KisanSaathi/server/src/index.ts) - Server entry point
- [Models README](file:///d:/KisanSaathi/server/src/models/README.md) - Database schema docs
- [Routes README](file:///d:/KisanSaathi/server/src/routes/README.md) - API endpoint docs

**Frontend**
- [App.tsx](file:///d:/KisanSaathi/frontend/src/App.tsx) - Root component
- [Components README](file:///d:/KisanSaathi/frontend/src/components/README.md) - Component docs

**ML**
- [app.py](file:///d:/KisanSaathi/Crop-Recommendation-System/app.py) - ML service

### Documentation Links

- [Main README](file:///d:/KisanSaathi/README.md) - Project overview
- [Migration Guide](file:///d:/KisanSaathi/frontend/MIGRATION_GUIDE.md) - i18next migration

---

**Document Version**: 1.0  
**Last Updated**: 2026-02-05  
**Maintained By**: KisanSaathi Development Team
