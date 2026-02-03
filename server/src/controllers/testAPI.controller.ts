import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';

// Test endpoint to verify API is working
export const testAPI = async (req: AuthRequest, res: Response) => {
    try {
        console.log('🧪 Test API endpoint called');
        console.log('   Method:', req.method);
        console.log('   URL:', req.url);
        console.log('   Headers:', req.headers);
        console.log('   User ID:', req.user?.id);
        
        res.json({
            success: true,
            message: 'API is working correctly',
            timestamp: new Date().toISOString(),
            user: req.user ? {
                id: req.user.id,
                email: req.user.email
            } : null,
            server: 'Crop Disease Detection API'
        });
    } catch (error) {
        console.error('❌ Test API error:', error);
        res.status(500).json({
            success: false,
            error: 'API test failed',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
};
