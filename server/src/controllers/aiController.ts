import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash';

// Initialize Gemini AI
let genAI: GoogleGenerativeAI | null = null;

if (GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
} else {
    console.warn('⚠️  GEMINI_API_KEY not set. AI features will use fallback responses.');
}

/**
 * Chat endpoint - handles conversational AI requests
 */
export const chat = async (req: Request, res: Response): Promise<void> => {
    try {
        const { message, systemPrompt } = req.body;

        if (!message) {
            res.status(400).json({ error: 'Message is required' });
            return;
        }

        // If Gemini is not configured, return fallback
        if (!genAI) {
            res.status(503).json({
                error: 'AI service not configured',
                text: 'AI service is currently unavailable. Please contact support.',
                retryAfter: 60
            });
            return;
        }

        try {
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

            // Combine system prompt and user message
            const fullPrompt = systemPrompt
                ? `${systemPrompt}\n\nUser: ${message}`
                : message;

            const result = await model.generateContent(fullPrompt);
            const response = await result.response;
            const text = response.text();

            res.json({ text });
        } catch (error: any) {
            console.error('Gemini API error:', error);

            // Handle rate limiting
            if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    text: 'Too many requests. Please try again later.',
                    retryAfter: 60
                });
                return;
            }

            // Handle other API errors
            res.status(503).json({
                error: 'AI service error',
                text: 'AI service is temporarily unavailable. Please try again.',
                retryAfter: 30
            });
        }
    } catch (error) {
        console.error('Chat controller error:', error);
        res.status(500).json({
            error: 'Internal server error',
            text: 'An error occurred. Please try again.'
        });
    }
};

/**
 * Analyze image endpoint - handles crop disease detection
 */
export const analyzeImage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { imageBase64, query, systemPrompt } = req.body;

        if (!imageBase64) {
            res.status(400).json({ error: 'Image is required' });
            return;
        }

        // If Gemini is not configured, return fallback
        if (!genAI) {
            res.status(503).json({
                error: 'AI service not configured',
                text: getFallbackCropAnalysis(),
                fallback: true,
                reason: 'AI service not configured',
                retryAfter: 60
            });
            return;
        }

        try {
            const model = genAI.getGenerativeModel({ model: GEMINI_MODEL });

            // Prepare the image part
            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/jpeg'
                }
            };

            // Combine system prompt and query
            const fullPrompt = systemPrompt
                ? `${systemPrompt}\n\n${query}`
                : query;

            // Generate content with image and text
            const result = await model.generateContent([fullPrompt, imagePart]);
            const response = await result.response;
            const text = response.text();

            res.json({ text, fallback: false });
        } catch (error: any) {
            console.error('Gemini Vision API error:', error);

            // Handle rate limiting
            if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
                res.status(429).json({
                    error: 'Rate limit exceeded',
                    text: 'Too many requests. Please try again later.',
                    fallback: true,
                    reason: 'Rate limit',
                    retryAfter: 60
                });
                return;
            }

            // Return fallback analysis for other errors
            res.json({
                text: getFallbackCropAnalysis(),
                fallback: true,
                reason: error.message || 'AI service error'
            });
        }
    } catch (error) {
        console.error('Image analysis controller error:', error);
        res.status(500).json({
            error: 'Internal server error',
            text: getFallbackCropAnalysis(),
            fallback: true,
            reason: 'Internal error'
        });
    }
};

/**
 * Fallback crop analysis when AI is unavailable
 */
function getFallbackCropAnalysis(): string {
    return `⚠️ **AI Analysis Temporarily Unavailable**

**General Crop Health Diagnosis:**

**1. Common Issues to Check:**
• Leaf discoloration (yellow, brown, or spotted leaves)
• Wilting or drooping plants
• Stunted growth
• Pest damage (holes in leaves, visible insects)
• Fungal growth (white powder, dark spots)

**2. Immediate Actions:**
• Remove severely damaged leaves
• Ensure proper watering (not too much, not too little)
• Check soil drainage
• Inspect for pests and diseases

**3. General Treatment:**
• For fungal issues: Apply copper-based fungicide
• For pests: Use neem oil spray
• For nutrient deficiency: Apply balanced NPK fertilizer
• Improve air circulation around plants

**4. Prevention:**
• Use disease-resistant varieties
• Practice crop rotation
• Maintain proper plant spacing
• Water at soil level, not on leaves
• Remove plant debris regularly

**Important:** For accurate diagnosis, please consult a local agricultural expert or retry when AI service is available.`;
}
