declare global {
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
      PORT?: string;
      MONGO_URI?: string;
      JWT_SECRET?: string;
      CLIENT_ORIGIN?: string;
      AI_PROVIDER?: string;
      OPENAI_API_KEY?: string;
      GEMINI_API_KEY?: string;
      MARKET_API_URL?: string;
      MARKET_API_KEY?: string;
    }
  }
}