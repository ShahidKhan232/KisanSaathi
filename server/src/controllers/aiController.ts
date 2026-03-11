import { Request, Response } from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { CropDiseaseModel } from '../models/CropDisease.js';
import { ChatHistoryModel } from '../models/ChatHistory.js';
import { UserModel } from '../models/User.js';
import { AuthRequest } from '../middleware/auth.js';
import mongoose from 'mongoose';

/** Resolve Firebase UID or MongoDB ObjectId to a MongoDB ObjectId */
async function resolveMongoId(userId: string): Promise<mongoose.Types.ObjectId | null> {
    if (mongoose.Types.ObjectId.isValid(userId)) {
        return new mongoose.Types.ObjectId(userId);
    }
    const user = await UserModel.findOne({ firebaseUid: userId }).lean();
    if (!user) return null;
    return user._id as mongoose.Types.ObjectId;
}

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

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
        const { message, systemPrompt, sessionId } = req.body;
        const user = (req as AuthRequest).user;

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

            // Save chat history if user is authenticated
            if (user && user.id) {
                try {
                    // Use provided sessionId or generate a new one
                    // If no sessionId provided, we create a new conversation
                    const effectiveSessionId = sessionId || new mongoose.Types.ObjectId().toString();

                    const mongoId = await resolveMongoId(user.id);
                    if (!mongoId) {
                        console.error(`User not found for AI chat: ${user.id}`);
                        res.json({ text, sessionId: effectiveSessionId });
                        return;
                    }

                    let chatHistory = await ChatHistoryModel.findOne({
                        userId: mongoId,
                        sessionId: effectiveSessionId
                    });

                    if (!chatHistory) {
                        chatHistory = new ChatHistoryModel({
                            userId: mongoId,
                            sessionId: effectiveSessionId,
                            messages: []
                        });
                    }

                    chatHistory.messages.push({
                        role: 'user',
                        content: message,
                        timestamp: new Date()
                    });

                    chatHistory.messages.push({
                        role: 'assistant',
                        content: text,
                        timestamp: new Date()
                    });

                    chatHistory.updatedAt = new Date();
                    await chatHistory.save();

                    console.log(`✅ Chat history saved for user ${user.id}, session ${effectiveSessionId}`);

                    // Return sessionId so client can continue conversation
                    res.json({ text, sessionId: effectiveSessionId });
                    return;
                } catch (dbError) {
                    console.error('❌ Error saving chat history:', dbError);
                    // Continue to return response even if save fails
                }
            }

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
        const user = (req as AuthRequest).user;

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
            console.log(`🤖 Using Gemini Model: ${GEMINI_MODEL}`);
            console.log(`👤 User Authenticated: ${user ? 'YES (' + user.id + ')' : 'NO'}`);

            // If user is logged in, we request raw JSON to parse and save
            // If not, we just return text as before (or we can always request JSON and format it)
            // Let's always request JSON for consistency

            const model = genAI.getGenerativeModel({
                model: GEMINI_MODEL,
                generationConfig: { responseMimeType: "application/json" }
            });

            // Prepare the image part
            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: 'image/jpeg'
                }
            };

            const jsonStructurePrompt = `
            You are an expert plant pathologist. Analyze the provided image and query.
            Return a JSON object with this exact structure:
            {
                "cropName": "name of crop",
                "detectedDisease": "name of disease or 'Healthy'",
                "confidence": number between 0 and 100,
                "symptoms": ["symptom 1", "symptom 2"],
                "treatment": "detailed treatment advice",
                "preventionTips": ["tip 1", "tip 2"],
                "isPlant": boolean
            }
            If the image is not a plant, set isPlant to false.
            `;

            // Combine system prompt and query
            const fullPrompt = `${jsonStructurePrompt}\n\n${systemPrompt || ''}\n\n${query}`;

            // Generate content with image and text
            console.log('📤 Sending request to Gemini Vision API...');
            const result = await model.generateContent([fullPrompt, imagePart]);
            const response = await result.response;
            const jsonText = response.text();
            console.log('✅ Gemini analysis received');

            let analysisData;
            try {
                analysisData = JSON.parse(jsonText);
            } catch (e) {
                console.error('Failed to parse JSON response:', jsonText);
                throw new Error('Invalid JSON response from AI');
            }

            // Save to database if user is authenticated
            if (user && user.id && analysisData.isPlant) {
                try {
                    const mongoId = await resolveMongoId(user.id);
                    if (mongoId) {
                        await CropDiseaseModel.create({
                            userId: mongoId,
                            cropName: analysisData.cropName || 'Unknown',
                            imageUrl: '', // We don't save the base64 to DB to avoid size limits, ideally upload to S3/Cloudinary
                            detectedDisease: analysisData.detectedDisease,
                            confidence: analysisData.confidence,
                            symptoms: analysisData.symptoms,
                            treatment: analysisData.treatment,
                            preventionTips: analysisData.preventionTips,
                            detectedAt: new Date()
                        });
                        console.log(`✅ Disease analysis saved to database for user ${user.id}`);
                    }
                } catch (dbError) {
                    console.error('❌ Error saving disease record:', dbError);
                }
            }

            // Format text for frontend display (backward compatibility)
            const formattedText = `**Disease:** ${analysisData.detectedDisease} (${analysisData.confidence}% confidence)
            
**Symptoms:**
${analysisData.symptoms.map((s: string) => `• ${s}`).join('\n')}

**Treatment:**
${analysisData.treatment}

**Prevention:**
${analysisData.preventionTips.map((s: string) => `• ${s}`).join('\n')}`;

            res.json({
                text: formattedText,
                data: analysisData,
                fallback: false
            });

        } catch (error: any) {
            console.error('❌ Gemini Vision API error:', error);

            // Log full error details
            if (error.response) {
                console.error('Response status:', error.response.status);
                console.error('Response statusText:', error.response.statusText);
            }

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
