import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface IAlert {
    userId: mongoose.Types.ObjectId;
    crop: string;
    targetPrice: number;
    createdAt: Date;
    // New enhanced fields
    market?: string;
    alertType: 'above' | 'below' | 'change';
    isActive: boolean;
    lastTriggered?: Date;
    notificationSent: boolean;
    expiresAt?: Date;
}


export interface IAlertDoc extends Document, IAlert { }

const PriceAlertSchema = new Schema<IAlertDoc>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    crop: { type: String, required: true },
    targetPrice: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    // New enhanced fields
    market: { type: String, trim: true },
    alertType: { type: String, enum: ['above', 'below', 'change'], default: 'above' },
    isActive: { type: Boolean, default: true, index: true },
    lastTriggered: { type: Date },
    notificationSent: { type: Boolean, default: false },
    expiresAt: { type: Date }
}, {
    timestamps: true
});

// Indexes for efficient queries
PriceAlertSchema.index({ userId: 1, isActive: 1 });
PriceAlertSchema.index({ crop: 1, isActive: 1 });

export const PriceAlertModel: Model<IAlertDoc> =
    (mongoose.models.PriceAlert as Model<IAlertDoc>) || model<IAlertDoc>('PriceAlert', PriceAlertSchema);
