import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface ICropInfo {
    cropName: string;
    scientificName?: string;
    category: string;
    season: string[];
    duration: number;
    soilType: string[];
    climate: string;
    waterRequirement: string;
    fertilizers: string[];
    commonDiseases: string[];
    commonPests: string[];
    harvestingTips?: string;
    storageInfo?: string;
    marketDemand?: string;
    imageUrl?: string;
}

export interface ICropInfoDoc extends Document, ICropInfo {
    _id: mongoose.Types.ObjectId;
}

const CropInfoSchema = new Schema<ICropInfoDoc>({
    cropName: { type: String, required: true, unique: true, trim: true, index: true },
    scientificName: { type: String, trim: true },
    category: {
        type: String,
        required: true,
        trim: true,
        index: true,
        enum: ['cereal', 'pulse', 'oilseed', 'vegetable', 'fruit', 'spice', 'fiber', 'other']
    },
    season: {
        type: [String],
        required: true,
        index: true,
        enum: ['kharif', 'rabi', 'zaid', 'perennial']
    },
    duration: { type: Number, required: true, min: 0 }, // in days
    soilType: { type: [String], default: [] },
    climate: { type: String, required: true },
    waterRequirement: {
        type: String,
        required: true,
        enum: ['low', 'medium', 'high']
    },
    fertilizers: { type: [String], default: [] },
    commonDiseases: { type: [String], default: [] },
    commonPests: { type: [String], default: [] },
    harvestingTips: { type: String },
    storageInfo: { type: String },
    marketDemand: { type: String },
    imageUrl: { type: String, trim: true }
}, {
    timestamps: true
});

// Indexes for efficient queries
CropInfoSchema.index({ category: 1, season: 1 });

export const CropInfoModel: Model<ICropInfoDoc> =
    (mongoose.models.CropInfo as Model<ICropInfoDoc>) || model<ICropInfoDoc>('CropInfo', CropInfoSchema);
