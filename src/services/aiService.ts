// AI Service for Kisan Sathi - GPT-4 Integration
// Note: Client uses backend proxy endpoints.

interface CacheEntry {
  response: string;
  timestamp: number;
  expiryTime: number;
}

class AIService {
  private readonly backendUrl = import.meta.env?.VITE_SERVER_URL 
    ? import.meta.env.VITE_SERVER_URL 
    : (import.meta.env?.DEV ? '' : 'http://localhost:5001'); // Use proxy in dev mode
  
  private responseCache = new Map<string, CacheEntry>();
  private readonly cacheExpiryMs = 30 * 60 * 1000; // 30 minutes

  private getCacheKey(type: string, input: string, language: string): string {
    return `${type}_${language}_${btoa(input).substring(0, 50)}`;
  }

  private getCachedResponse(key: string): string | null {
    const cached = this.responseCache.get(key);
    if (cached && Date.now() < cached.expiryTime) {
      return cached.response;
    }
    if (cached) {
      this.responseCache.delete(key);
    }
    return null;
  }

  private setCachedResponse(key: string, response: string, customExpiryMs?: number): void {
    const expiryMs = customExpiryMs || this.cacheExpiryMs;
    this.responseCache.set(key, {
      response,
      timestamp: Date.now(),
      expiryTime: Date.now() + expiryMs
    });
  }

  private formatAIResponse(response: string): string {
    // Clean up and format the AI response
    return response
      .replace(/\*\*(.*?)\*\*/g, '**$1**') // Keep markdown bold
      .replace(/^\s+|\s+$/gm, '') // Trim whitespace from lines
      .replace(/\n{3,}/g, '\n\n') // Reduce excessive line breaks
      .trim();
  }

  private hashString(str: string): string {
    // Simple hash function for creating unique identifiers
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  // Method to clear cache manually if needed
  clearCache(): void {
    this.responseCache.clear();
    console.log('AI Service cache cleared');
  }

  // Get cache stats for debugging
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.responseCache.size,
      entries: Array.from(this.responseCache.keys())
    };
  }

  // Multilingual farming assistant
  async getChatResponse(
    message: string,
    language: 'hi' | 'mr' | 'en' = 'hi',
    systemPromptOverride?: string
  ): Promise<string> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey('chat', message, language);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      const systemPrompt = systemPromptOverride || this.getSystemPrompt(language);
      const res = await fetch(`${this.backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, systemPrompt })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        // Handle specific error types from backend
        if (res.status === 503) {
          const retryAfter = errorData?.retryAfter || 30;
          return this.getServiceUnavailableResponse(language, retryAfter);
        } else if (res.status === 429) {
          return this.getRateLimitResponse(language);
        }
        
        throw new Error(errorData?.message || 'AI chat failed');
      }
      
      const data = await res.json();
      const response = data.text || this.getFallbackResponse(language);
      const formattedResponse = this.formatAIResponse(response);
      
      // Cache the successful response
      this.setCachedResponse(cacheKey, formattedResponse);
      
      return formattedResponse;
    } catch (error) {
      console.error('AI Service Error:', error);
      return this.getFallbackResponse(language);
    }
  }

  // Crop disease detection with image analysis
  async analyzeCropImage(imageBase64: string, query: string, language: 'hi' | 'mr' | 'en' = 'hi'): Promise<string> {
    try {
      // For image analysis, we want fresh results for each image
      // Only use cache for identical images (same hash) and same query
      const imageHash = this.hashString(imageBase64);
      const cacheKey = this.getCacheKey('crop_analysis', `${imageHash}_${query}`, language);
      
      // Check cache only for identical images and queries
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        console.log('Using cached result for identical image');
        return cachedResponse;
      }
      
      console.log('Analyzing new image with AI service...');

      const systemPrompt = this.getCropAnalysisPrompt(language);
      const res = await fetch(`${this.backendUrl}/api/ai/analyze-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64, query, systemPrompt })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        // Handle specific error types from backend
        if (res.status === 503) {
          const retryAfter = errorData?.retryAfter || 30;
          return this.getServiceUnavailableResponse(language, retryAfter);
        } else if (res.status === 429) {
          return this.getRateLimitResponse(language);
        }
        
        throw new Error(errorData?.message || 'AI vision failed');
      }
      
      const data = await res.json();
      const response = data.text || this.getFallbackCropResponse(language);
      const formattedResponse = this.formatAIResponse(response);
      
      // If this is a fallback response, add visual indicator
      if (data.fallback) {
        console.log('Received fallback response from server:', data.reason);
      }
      
      // Cache the successful response with shorter expiry for image analysis (10 minutes)
      // Don't cache fallback responses to allow retries
      if (!data.fallback) {
        this.setCachedResponse(cacheKey, formattedResponse, 10 * 60 * 1000);
      }
      
      return formattedResponse;
    } catch (error) {
      console.error('Crop Analysis Error:', error);
      return this.getFallbackCropResponse(language);
    }
  }

  // Government scheme recommendations
  async getSchemeRecommendations(userSituation: string, language: 'hi' | 'mr' | 'en' = 'hi'): Promise<string> {
    try {
      // Check cache first
      const cacheKey = this.getCacheKey('schemes', userSituation, language);
      const cachedResponse = this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      const systemPrompt = this.getSchemePrompt(language);
      const res = await fetch(`${this.backendUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userSituation, systemPrompt })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        
        // Handle specific error types from backend
        if (res.status === 503) {
          const retryAfter = errorData?.retryAfter || 30;
          return this.getServiceUnavailableResponse(language, retryAfter);
        } else if (res.status === 429) {
          return this.getRateLimitResponse(language);
        }
        
        throw new Error(errorData?.message || 'AI chat failed');
      }
      
      const data = await res.json();
      const response = data.text || this.getFallbackSchemeResponse(language);
      const formattedResponse = this.formatAIResponse(response);
      
      // Cache the successful response
      this.setCachedResponse(cacheKey, formattedResponse);
      
      return formattedResponse;
    } catch (error) {
      console.error('Scheme Recommendation Error:', error);
      return this.getFallbackSchemeResponse(language);
    }
  }

  private getSystemPrompt(language: 'hi' | 'mr' | 'en'): string {
    const prompts = {
      hi: `आप एक अनुभवी भारतीय कृषि सलाहकार हैं। आप हिंदी में जवाब दें।
      
      आपकी विशेषताएं:
      - भारतीय खेती, फसलों, और कृषि तकनीकों की गहरी जानकारी
      - मौसम, मिट्टी, बीज, खाद, और कीटनाशकों की सलाह
      - स्थानीय मंडी भाव और बाजार की जानकारी
      - सरकारी योजनाओं और सब्सिडी की जानकारी
      - व्यावहारिक और आसान भाषा में सलाह
      
      हमेशा मददगार, सम्मानजनक और सटीक जानकारी दें।`,
      
      mr: `तुम्ही एक अनुभवी भारतीय शेती सल्लागार आहात. तुम्ही मराठीत उत्तर द्या.
      
      तुमची वैशिष्ट्ये:
      - भारतीय शेती, पिके आणि शेती तंत्रज्ञानाचे सखोल ज्ञान
      - हवामान, माती, बियाणे, खत आणि कीटकनाशकांचा सल्ला
      - स्थानिक मंडी भाव आणि बाजाराची माहिती
      - सरकारी योजना आणि अनुदानाची माहिती
      - व्यावहारिक आणि सोप्या भाषेत सल्ला`,
      
      en: `You are an experienced Indian agricultural consultant. Respond in English.
      
      Your expertise:
      - Deep knowledge of Indian farming, crops, and agricultural techniques
      - Weather, soil, seeds, fertilizers, and pesticide advice
      - Local market prices and market information
      - Government schemes and subsidies information
      - Practical advice in simple language
      
      Always be helpful, respectful, and provide accurate information.`
    };
    
    return prompts[language];
  }

  private getCropAnalysisPrompt(language: 'hi' | 'mr' | 'en'): string {
    const prompts = {
      hi: `आप एक कृषि विशेषज्ञ हैं जो फसल की बीमारियों की पहचान करते हैं। इस तस्वीर को देखकर:

      1. फसल की पहचान करें
      2. किसी बीमारी/समस्या के लक्षण बताएं
      3. संभावित कारण बताएं
      4. उपचार के तरीके सुझाएं
      5. बचाव के उपाय बताएं
      
      सरल हिंदी में जवाब दें और किसानों के लिए व्यावहारिक सुझाव दें।`,
      
      mr: `तुम्ही एक शेती तज्ञ आहात जे पिकांच्या रोगांची ओळख करतात. हे छायाचित्र पाहून:

      1. पिकाची ओळख करा
      2. कोणत्याही रोग/समस्येची लक्षणे सांगा
      3. संभाव्य कारणे सांगा
      4. उपचाराचे मार्ग सुचवा
      5. प्रतिबंधाचे उपाय सांगा`,
      
      en: `You are an agricultural expert who identifies crop diseases. Looking at this image:

      1. Identify the crop
      2. Identify any disease/problem symptoms
      3. Explain possible causes
      4. Suggest treatment methods
      5. Provide prevention measures
      
      Give practical advice for farmers in simple language.`
    };
    
    return prompts[language];
  }

  private getSchemePrompt(language: 'hi' | 'mr' | 'en'): string {
    const prompts = {
      hi: `आप एक सरकारी योजना सलाहकार हैं। किसान की स्थिति के आधार पर उपयुक्त सरकारी योजनाओं की सिफारिश करें:

      मुख्य योजनाएं (2024-2025):
      
      प्रत्यक्ष लाभ योजनाएं:
      - PM-KISAN (₹6000/वर्ष प्रत्यक्ष लाभ, 11 करोड़ लाभार्थी)
      - किसान सम्मान निधि (₹3000 मासिक पेंशन)
      
      बीमा योजनाएं:
      - प्रधानमंत्री फसल बीमा योजना (PMFBY) - 100% फसल मूल्य तक कवरेज
      - किसान दुर्घटना बीमा (₹2 लाख तक)
      
      लोन योजनाएं:
      - किसान क्रेडिट कार्ड (4% ब्याज दर, ₹3 लाख तक)
      - मुद्रा लोन कृषि (₹50,000 से ₹10 लाख तक, बिना गारंटी)
      
      सब्सिडी योजनाएं:
      - सोलर पंप KUSUM (60% सब्सिडी + 30% लोन)
      - कृषि यंत्रीकरण (40-50% सब्सिडी, ₹1.25 लाख तक)
      - प्रधानमंत्री FPO योजना (₹15 लाख तक वित्तीय सहायता)
      
      डिजिटल सेवाएं:
      - e-NAM (ऑनलाइन कृषि बाजार, बेहतर दाम)
      - डिजिटल KCC (ऑनलाइन आवेदन)
      
      हर योजना के लिए पात्रता, लाभ, आवेदन प्रक्रिया, और सफलता दर की जानकारी दें।
      वर्तमान डेटा के आधार पर उपयुक्त योजनाओं को प्राथमिकता दें।`,
      
      mr: `तुम्ही एक सरकारी योजना सल्लागार आहात. शेतकऱ्याच्या परिस्थितीनुसार योग्य सरकारी योजनांची शिफारस करा:

      मुख्य योजना (2024-2025):
      - PM-KISAN (₹6000/वर्षी)
      - प्रधानमंत्री फसल विमा योजना (PMFBY)
      - किसान क्रेडिट कार्ड (4% व्याजदर)
      - e-NAM (ऑनलाइन कृषी बाजार)
      - सोलर पंप KUSUM (60% सबसिडी)
      - मुद्रा कर्ज (₹10 लाख पर्यंत)
      
      प्रत्येक योजनेसाठी पात्रता, फायदे आणि अर्जाची माहिती द्या.`,
      
      en: `You are a government scheme advisor. Recommend suitable government schemes based on farmer's situation:

      Key Schemes (2024-2025):
      
      Direct Benefit Schemes:
      - PM-KISAN (₹6000/year direct benefit, 11 crore beneficiaries)
      - Kisan Samman Nidhi (₹3000 monthly pension)
      
      Insurance Schemes:
      - PM Fasal Bima Yojana (PMFBY) - Up to 100% crop value coverage
      - Kisan Accident Insurance (Up to ₹2 lakh)
      
      Loan Schemes:
      - Kisan Credit Card (4% interest rate, up to ₹3 lakh)
      - MUDRA Loan Agriculture (₹50,000 to ₹10 lakh, collateral-free)
      
      Subsidy Schemes:
      - Solar Pump KUSUM (60% subsidy + 30% loan)
      - Farm Mechanization (40-50% subsidy, up to ₹1.25 lakh)
      - PM FPO Scheme (Financial assistance up to ₹15 lakh)
      
      Digital Services:
      - e-NAM (Online agriculture market, better prices)
      - Digital KCC (Online application)
      
      Provide eligibility, benefits, application process, and success rates for each scheme.
      Prioritize suitable schemes based on current data.`
    };
    
    return prompts[language];
  }

  private getFallbackResponse(language: 'hi' | 'mr' | 'en'): string {
    const responses = {
      hi: 'क्षमा करें, मैं इस समय आपकी मदद नहीं कर पा रहा। कृपया बाद में पूछें या सीधे कृषि विशेषज्ञ से संपर्क करें।',
      mr: 'क्षमस्व, मी सध्या तुमची मदत करू शकत नाही. कृपया नंतर विचारा किंवा थेट शेती तज्ञाशी संपर्क करा.',
      en: 'Sorry, I cannot help you right now. Please try again later or contact an agricultural expert directly.'
    };
    
    return responses[language];
  }

  private getFallbackCropResponse(language: 'hi' | 'mr' | 'en'): string {
    const responses = {
      hi: 'मैं इस तस्वीर का विश्लेषण नहीं कर पा रहा। कृपया स्पष्ट तस्वीर लें और दोबारा कोशिश करें।',
      mr: 'मी या छायाचित्राचे विश्लेषण करू शकत नाही. कृपया स्पष्ट छायाचित्र घ्या आणि पुन्हा प्रयत्न करा.',
      en: 'I cannot analyze this image. Please take a clearer photo and try again.'
    };
    
    return responses[language];
  }

  private getFallbackSchemeResponse(language: 'hi' | 'mr' | 'en'): string {
    const responses = {
      hi: 'योजनाओं की जानकारी लोड नहीं हो पा रही। कृपया नजदीकी कृषि कार्यालय से संपर्क करें।',
      mr: 'योजनांची माहिती लोड होऊ शकत नाही. कृपया जवळच्या कृषी कार्यालयाशी संपर्क करा.',
      en: 'Cannot load scheme information. Please contact your nearest agriculture office.'
    };
    
    return responses[language];
  }

  private getServiceUnavailableResponse(language: 'hi' | 'mr' | 'en', retryAfter: number): string {
    const responses = {
      hi: `AI सेवा अभी अधिक लोड के कारण उपलब्ध नहीं है। कृपया ${retryAfter} सेकंड बाद पुनः प्रयास करें।`,
      mr: `AI सेवा सध्या अधिक लोडमुळे उपलब्ध नाही. कृपया ${retryAfter} सेकंदांनंतर पुन्हा प्रयत्न करा.`,
      en: `AI service is currently unavailable due to high load. Please try again after ${retryAfter} seconds.`
    };
    
    return responses[language];
  }

  private getRateLimitResponse(language: 'hi' | 'mr' | 'en'): string {
    const responses = {
      hi: 'आपने बहुत सारे अनुरोध भेजे हैं। कृपया थोड़ी देर बाद पुनः प्रयास करें।',
      mr: 'तुम्ही बरेच विनंत्या पाठवल्या आहेत. कृपया थोड्या वेळानंतर पुन्हा प्रयत्न करा.',
      en: 'You have sent too many requests. Please try again after some time.'
    };
    
    return responses[language];
  }
}

export const aiService = new AIService();
