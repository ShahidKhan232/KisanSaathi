import { Response } from 'express';
import { ChatHistoryModel } from '../models/ChatHistory.js';
import mongoose from 'mongoose';
import { AuthRequest } from '../middleware/auth.js';

// Get chat history for a user
export const getChatHistory = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { limit = 10, skip = 0 } = req.query;

        const history = await ChatHistoryModel
            .find({ userId: new mongoose.Types.ObjectId(userId) })
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

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const session = await ChatHistoryModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            sessionId
        });

        if (!session) {
            return res.status(404).json({ error: 'Session not found' });
        }

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
        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { sessionId, message, topic } = req.body;

        if (!sessionId || !message) {
            return res.status(400).json({ error: 'Session ID and message are required' });
        }

        // Find or create session
        let session = await ChatHistoryModel.findOne({
            userId: new mongoose.Types.ObjectId(userId),
            sessionId
        });

        if (session) {
            // Update existing session
            session.messages.push(message);
            session.updatedAt = new Date();
            await session.save();
        } else {
            // Create new session
            session = await ChatHistoryModel.create({
                userId: new mongoose.Types.ObjectId(userId),
                sessionId,
                messages: [message],
                topic
            });
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

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const result = await ChatHistoryModel.deleteOne({
            userId: new mongoose.Types.ObjectId(userId),
            sessionId
        });

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
