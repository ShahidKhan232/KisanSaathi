import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface ICropDisease {
    userId: mongoose.Types.ObjectId;
    cropName: string;
    imageUrl?: string;
    detectedDisease: string;
    confidence: number;
    symptoms: string[];
    treatment: string;
    preventionTips: string[];
    detectedAt: Date;
    location?: {
        latitude: number;
        longitude: number;
        address?: string;
    };
}

export interface ICropDiseaseDoc extends Document, ICropDisease {
    _id: mongoose.Types.ObjectId;
}

const CropDiseaseSchema = new Schema<ICropDiseaseDoc>({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    cropName: { type: String, required: true, trim: true, index: true },
    imageUrl: { type: String, trim: true },
    detectedDisease: { type: String, required: true, trim: true },
    confidence: { type: Number, required: true, min: 0, max: 100 },
    symptoms: { type: [String], default: [] },
    treatment: { type: String, required: true },
    preventionTips: { type: [String], default: [] },
    detectedAt: { type: Date, default: Date.now, index: true },
    location: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String, trim: true }
    }
}, {
    timestamps: true
});

// Compound index for efficient queries
CropDiseaseSchema.index({ userId: 1, detectedAt: -1 });
CropDiseaseSchema.index({ cropName: 1, detectedAt: -1 });

export const CropDiseaseModel: Model<ICropDiseaseDoc> =
    (mongoose.models.CropDisease as Model<ICropDiseaseDoc>) || model<ICropDiseaseDoc>('CropDisease', CropDiseaseSchema);
