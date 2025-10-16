
# Kisan Sathi — AI-Powered Agricultural Assistant

![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)

Kisan Sathi is an intelligent, multilingual digital assistant designed to empower farmers across India. It combines AI, real-time government data, and machine learning to provide actionable insights on crop health, market trends, and government schemes — all in a simple and farmer-friendly interface.

## 🚀 Key Features

1. 🧠 Crop Disease Detection

- Upload or capture crop images to identify diseases instantly.
- Uses CNN-based image classification (ResNet/MobileNet).
- Provides treatment suggestions and prevention guidance.

2. 💰 Market Price Analysis & Forecasting

- Fetches live mandi price data from the official Agmarknet API and eNAM sources.
- Shows nearby market prices and trends for crops.
- Uses ARIMA / LSTM models for short-term price forecasting.

3. 🏛️ Government Schemes Discovery

- Dynamically fetches latest schemes using the MyScheme API (no hard-coded data).
- Filters by state, crop, and eligibility.
- Summarizes details in simple local language via Gemini AI.

4. 🗣️ Multilingual Support

- Interact with the app in English, Hindi, or Marathi.
- Supports both text and voice queries.
- Integrates Google Cloud Translation API and Text-to-Speech for conversational use.

---

## 🧩 System Architecture

Farmer Mobile/Web App
	↓
FastAPI Backend API
   ├── /disease-detect  → TensorFlow/PyTorch Model
   ├── /market-prices   → Agmarknet / eNAM APIs
   ├── /schemes         → MyScheme API
   └── /chat            → Gemini AI Summarization
	↓
Databases
   ├── PostgreSQL (data + user)
   └── Redis (cache)

---

## 🧠 AI & NLP Stack

- Crop Image Classification: TensorFlow / PyTorch (ResNet / MobileNet)
- Market Price Forecast: ARIMA / LSTM (scikit-learn, statsmodels)
- Conversational AI: Gemini 1.5 Flash / Pro
- NLP Translation: IndicTrans2 / Google Translate API
- Voice Interface: Google Speech API / gTTS

---

## 🔌 Data Sources

- Market Prices: Agmarknet (data.gov.in) — Daily mandi-wise crop prices
- Government Schemes: MyScheme API — Real-time central & state scheme data
- Crop Images: Custom / PlantVillage Dataset — Training dataset for disease detection
- Weather (optional): IMD / OpenWeatherMap — For predictive price modeling

---

## ⚙️ Tech Stack (suggested)

- Frontend: React (Web) / Flutter (Mobile)
- Backend: FastAPI / Flask (Python)
- Database: PostgreSQL / MySQL
- Cache: Redis
- AI Agent: Google Gemini API
- Hosting: GCP / AWS / Vercel
- Deployment: Docker / Kubernetes

---

## 💡 How It Works

1. Farmer asks a query or uploads an image.
2. Backend routes the query to the right module (Disease, Price, or Schemes).
3. Gemini AI summarizes or interprets the result.
4. The response is displayed in the user’s preferred language or voice output.

---

## 📦 Quick Setup (Development)

> These commands are adapted for PowerShell on Windows. Adjust as needed for macOS/Linux.

1. Clone the repository

```powershell
git clone https://github.com/yourusername/kisan-sathi.git
cd kisan-sathi
```

2. Create and activate virtual environment (recommended)

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

3. Install dependencies

```powershell
pip install -r requirements.txt
```

4. Set environment variables

Create a `.env` file in the project root or backend folder and add the following (example):

```env
GEMINI_API_KEY=your_gemini_api_key
MYSHEME_API_URL=https://api.myscheme.gov.in/schemes
AGMARKNET_API_URL=https://data.gov.in/resource/current-daily-price-various-commodities-various-markets-mandi
DATABASE_URL=postgresql://user:password@localhost:5432/kisan_sathi
REDIS_URL=redis://localhost:6379/0
```

5. Run the server (FastAPI example)

```powershell
uvicorn app.main:app --reload
```

6. (Optional) Run front-end dev server

If a frontend lives in a separate folder (e.g., `web/` or `client/`), follow its README. Commonly:

```powershell
cd client
npm install
npm run dev
```

---

## 🌍 Future Enhancements

- Voice-based virtual assistant for regional languages.
- Integration with IoT sensors for soil & weather-based recommendations.
- Crop yield prediction using satellite data.
- WhatsApp & Telegram bot versions of Kisan Sathi.

---

## 👥 Team & Credits

Developed by:
Department of Computer Science & Engineering (AI/ML)
[Your Institute Name]

Data Sources:
- Ministry of Agriculture & Farmers Welfare
- Ministry of Statistics & Programme Implementation
- MyScheme (Govt. of India)
- data.gov.in

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

## 📌 Notes

- This `README` is a project-level overview. Move or adapt sections into `server/README.md` or `client/README.md` if you split the project later.
- Consider adding a `README.dev.md` with full local build/run instructions and a `docker-compose.yml` for quick local development with Postgres and Redis.

---

If you'd like, I can also:

- Create `server/.env.example` with placeholders
- Add a `docker-compose.yml` to run Postgres and Redis locally
- Add GitHub Actions to run tests and lints on PRs

Tell me which of those you'd like next.