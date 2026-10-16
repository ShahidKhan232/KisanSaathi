import { Response } from 'express';
import { ChatHistoryModel } from '../models/ChatHistory.js';
import { UserModel } from '../models/User.js';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';

/** Resolve Firebase UID or MongoDB ObjectId to a MongoDB ObjectId */
async function resolveMongoId(userId: string): Promise<mongoose.Types.ObjectId | null> {
    if (mongoose.Types.ObjectId.isValid(userId)) {
        return new mongoose.Types.ObjectId(userId);
    }
    const user = await UserModel.findOne({ firebaseUid: userId }).lean();
    if (!user) return null;
    return user._id as mongoose.Types.ObjectId;
}

// Get chat history for a user
export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { limit = 10, skip = 0 } = req.query;

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.json([]); // New user — no history yet

        const history = await ChatHistoryModel
            .find({ userId: mongoId })
            .sort({ createdAt: -1 })
            .limit(Number(limit))
            .skip(Number(skip));

        console.log(`📜 Fetched ${history.length} chat sessions for user ${userId}`);
        res.json(history);
    } catch (error) {
        console.error('Error fetching chat history:', error);
        res.status(500).json({ error: 'Failed to fetch chat history' });
    }
};

// Get a specific chat session
export const getChatSession = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { sessionId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.status(404).json({ error: 'Session not found' });

        const session = await ChatHistoryModel.findOne({ userId: mongoId, sessionId });
        if (!session) return res.status(404).json({ error: 'Session not found' });

        res.json(session);
    } catch (error) {
        console.error('Error fetching chat session:', error);
        res.status(500).json({ error: 'Failed to fetch chat session' });
    }
};

// Create or update chat session
export const saveChatMessage = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const { sessionId, message, topic } = req.body;
        if (!sessionId || !message) {
            return res.status(400).json({ error: 'Session ID and message are required' });
        }

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.status(404).json({ error: 'User not found' });

        let session = await ChatHistoryModel.findOne({ userId: mongoId, sessionId });

        if (session) {
            session.messages.push(message);
            session.updatedAt = new Date();
            await session.save();
        } else {
            session = await ChatHistoryModel.create({ userId: mongoId, sessionId, messages: [message], topic });
        }

        console.log(`💬 Saved message to session ${sessionId} for user ${userId}`);
        res.json(session);
    } catch (error) {
        console.error('Error saving chat message:', error);
        res.status(500).json({ error: 'Failed to save chat message' });
    }
};

// Delete chat session
export const deleteChatSession = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        const { sessionId } = req.params;
        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const mongoId = await resolveMongoId(userId);
        if (!mongoId) return res.status(404).json({ error: 'Session not found' });

        const result = await ChatHistoryModel.deleteOne({ userId: mongoId, sessionId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ error: 'Session not found' });
        }

        console.log(`🗑️  Deleted chat session ${sessionId} for user ${userId}`);
        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error('Error deleting chat session:', error);
        res.status(500).json({ error: 'Failed to delete chat session' });
    }
};
