import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface ICropRecommendation {
    userId: mongoose.Types.ObjectId;
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    temperature: number;
    humidity: number;
    ph: number;
    rainfall: number;
    recommendedCrop: string;
    confidence?: number;
    createdAt: Date;
}

export interface ICropRecommendationDoc extends Document, ICropRecommendation {
    _id: mongoose.Types.ObjectId;
}

const CropRecommendationSchema = new Schema<ICropRecommendationDoc>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    nitrogen: { type: Number, required: true },
    phosphorus: { type: Number, required: true },
    potassium: { type: Number, required: true },
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    ph: { type: Number, required: true },
    rainfall: { type: Number, required: true },
    recommendedCrop: { type: String, required: true, trim: true },
    confidence: { type: Number },
    createdAt: { type: Date, default: Date.now, index: true }
}, {
    timestamps: true
});

// Index for retrieving user history efficiently
CropRecommendationSchema.index({ userId: 1, createdAt: -1 });

export const CropRecommendationModel: Model<ICropRecommendationDoc> =
    (mongoose.models.CropRecommendation as Model<ICropRecommendationDoc>) || model<ICropRecommendationDoc>('CropRecommendation', CropRecommendationSchema);
