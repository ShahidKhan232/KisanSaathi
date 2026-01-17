import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface IChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    language?: string;
}

export interface IChatHistory {
    userId: mongoose.Types.ObjectId;
    sessionId: string;
    messages: IChatMessage[];
    topic?: string;
    createdAt: Date;
    updatedAt: Date;
}

export interface IChatHistoryDoc extends Document, IChatHistory {
    _id: mongoose.Types.ObjectId;
}

const ChatMessageSchema = new Schema<IChatMessage>({
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    language: { type: String, trim: true }
}, { _id: false });

const ChatHistorySchema = new Schema<IChatHistoryDoc>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sessionId: { type: String, required: true, trim: true, index: true },
    messages: { type: [ChatMessageSchema], default: [] },
    topic: { type: String, trim: true },
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound index for efficient queries
ChatHistorySchema.index({ userId: 1, createdAt: -1 });
ChatHistorySchema.index({ sessionId: 1, userId: 1 }, { unique: true });

export const ChatHistoryModel: Model<IChatHistoryDoc> =
    (mongoose.models.ChatHistory as Model<IChatHistoryDoc>) || model<IChatHistoryDoc>('ChatHistory', ChatHistorySchema);
