import { GoogleGenerativeAI } from '@google/generative-ai';
import { MarketPriceModel } from '../models/MarketPrice.js';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
    console.warn('⚠️  GEMINI_API_KEY not set. Market price AI generation will not work.');
}

interface CropPriceData {
    commodity: string;
    variety: string;
    market: string;
    state: string;
    district: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
}

/**
 * AI Service for generating daily market prices using Gemini AI
 */
class MarketPriceAIService {
    /**
     * Generate daily market prices for common Indian crops using Gemini AI
     */
    async generateDailyMarketPrices(): Promise<{ success: boolean; count: number; error?: string }> {
        try {
            console.log('🤖 Starting AI market price generation...');

            if (!genAI) {
                throw new Error('Gemini AI not initialized. Please set GEMINI_API_KEY.');
            }

            // Get AI-generated prices
            const pricesData = await this.fetchPricesFromAI();

            // Save to database
            const savedCount = await this.savePricesToDatabase(pricesData);

            console.log(`✅ Successfully generated and saved ${savedCount} market prices`);
            return { success: true, count: savedCount };
        } catch (error) {
            console.error('❌ Error generating market prices:', error);
            return {
                success: false,
                count: 0,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Fetch market prices from Gemini AI
     */
    private async fetchPricesFromAI(): Promise<CropPriceData[]> {
        if (!genAI) {
            throw new Error('Gemini AI not initialized');
        }

        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const prompt = this.getPromptForMarketPrices();

        console.log('📡 Requesting market prices from Gemini AI...');
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();

        console.log('📥 Received AI response, parsing prices...');
        const prices = this.parsePricesFromAI(text);

        console.log(`📊 Parsed ${prices.length} price records from AI`);
        return prices;
    }

    /**
     * Create a detailed prompt for Gemini to generate realistic Indian market prices
     */
    private getPromptForMarketPrices(): string {
        const today = new Date();
        const month = today.toLocaleString('en-US', { month: 'long' });
        const year = today.getFullYear();

        return `Generate realistic current market prices for major Indian agricultural commodities for ${month} ${year}.

IMPORTANT: Provide prices in INR per quintal (100 kg) for the following crops across different major markets in India.

Generate data for these 25 crops:
1. Wheat
2. Rice (Paddy)
3. Maize (Corn)
4. Bajra (Pearl Millet)
5. Jowar (Sorghum)
6. Gram (Chickpea)
7. Tur/Arhar (Pigeon Pea)
8. Moong (Green Gram)
9. Urad (Black Gram)
10. Masoor (Lentil)
11. Soybean
12. Groundnut
13. Mustard
14. Sunflower
15. Cotton
16. Sugarcane
17. Potato
18. Onion
19. Tomato
20. Cabbage
21. Cauliflower
22. Chili (Green)
23. Turmeric
24. Coriander
25. Cumin

For each crop, provide 2-3 market entries from different states. Use major agricultural states like:
- Punjab, Haryana, Uttar Pradesh (for wheat, rice)
- Maharashtra, Gujarat, Madhya Pradesh (for cotton, soybean)
- Karnataka, Andhra Pradesh, Tamil Nadu (for vegetables, pulses)
- Rajasthan (for bajra, mustard)

For each entry, provide:
- Commodity name
- Variety (e.g., "Durum", "Basmati", "Local", "Hybrid")
- Market name (actual market names like "Azadpur", "Vashi", "Koyambedu")
- State
- District
- Min Price (in ₹/quintal)
- Max Price (in ₹/quintal)
- Modal Price (in ₹/quintal) - this should be between min and max

Make prices realistic based on:
- Current season (${month})
- Typical Indian market rates
- Regional variations
- Supply-demand patterns

Format your response EXACTLY as JSON array like this:
[
  {
    "commodity": "Wheat",
    "variety": "Durum",
    "market": "Azadpur",
    "state": "Delhi",
    "district": "New Delhi",
    "minPrice": 2200,
    "maxPrice": 2400,
    "modalPrice": 2300
  },
  {
    "commodity": "Rice",
    "variety": "Basmati",
    "market": "Karnal",
    "state": "Haryana",
    "district": "Karnal",
    "minPrice": 3800,
    "maxPrice": 4200,
    "modalPrice": 4000
  }
]

CRITICAL: Return ONLY the JSON array, no additional text or explanation. Ensure all prices are realistic for Indian markets in ${month} ${year}.`;
    }

    /**
     * Parse AI response and extract price data
     */
    private parsePricesFromAI(aiResponse: string): CropPriceData[] {
        try {
            // Remove markdown code blocks if present
            let jsonText = aiResponse.trim();
            if (jsonText.startsWith('```json')) {
                jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
            } else if (jsonText.startsWith('```')) {
                jsonText = jsonText.replace(/```\n?/g, '');
            }

            // Parse JSON
            const parsed = JSON.parse(jsonText);

            // Validate structure
            if (!Array.isArray(parsed)) {
                throw new Error('AI response is not an array');
            }

            // Validate each entry
            const validPrices: CropPriceData[] = [];
            for (const item of parsed) {
                if (this.isValidPriceData(item)) {
                    validPrices.push(item);
                } else {
                    console.warn('⚠️  Skipping invalid price entry:', item);
                }
            }

            return validPrices;
        } catch (error) {
            console.error('Error parsing AI response:', error);
            console.log('AI Response:', aiResponse.substring(0, 500));
            throw new Error('Failed to parse AI response as JSON');
        }
    }

    /**
     * Validate price data structure
     */
    private isValidPriceData(data: any): data is CropPriceData {
        return (
            typeof data === 'object' &&
            typeof data.commodity === 'string' &&
            typeof data.variety === 'string' &&
            typeof data.market === 'string' &&
            typeof data.state === 'string' &&
            typeof data.district === 'string' &&
            typeof data.minPrice === 'number' &&
            typeof data.maxPrice === 'number' &&
            typeof data.modalPrice === 'number' &&
            data.minPrice > 0 &&
            data.maxPrice >= data.minPrice &&
            data.modalPrice >= data.minPrice &&
            data.modalPrice <= data.maxPrice
        );
    }

    /**
     * Save generated prices to MongoDB
     */
    private async savePricesToDatabase(pricesData: CropPriceData[]): Promise<number> {
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Set to start of day

        let savedCount = 0;

        for (const priceData of pricesData) {
            try {
                // Check if price already exists for today
                const existing = await MarketPriceModel.findOne({
                    commodity: priceData.commodity,
                    market: priceData.market,
                    priceDate: today
                });

                if (existing) {
                    // Update existing record
                    Object.assign(existing, {
                        ...priceData,
                        priceDate: today,
                        source: 'other' as const,
                        fetchedAt: new Date()
                    });
                    await existing.save();
                    savedCount++;
                } else {
                    // Create new record
                    await MarketPriceModel.create({
                        ...priceData,
                        priceDate: today,
                        source: 'other' as const,
                        fetchedAt: new Date()
                    });
                    savedCount++;
                }
            } catch (error) {
                console.error(`Error saving price for ${priceData.commodity} at ${priceData.market}:`, error);
            }
        }

        return savedCount;
    }

    /**
     * Get the last fetch time from database
     */
    async getLastFetchTime(): Promise<Date | null> {
        try {
            const latestPrice = await MarketPriceModel
                .findOne({ source: 'other' })
                .sort({ fetchedAt: -1 })
                .select('fetchedAt');

            return latestPrice?.fetchedAt || null;
        } catch (error) {
            console.error('Error getting last fetch time:', error);
            return null;
        }
    }

    /**
     * Check if prices need to be refreshed (older than 24 hours)
     */
    async needsRefresh(): Promise<boolean> {
        const lastFetch = await this.getLastFetchTime();
        if (!lastFetch) return true;

        const hoursSinceLastFetch = (Date.now() - lastFetch.getTime()) / (1000 * 60 * 60);
        return hoursSinceLastFetch >= 24;
    }
}

export const marketPriceAIService = new MarketPriceAIService();
