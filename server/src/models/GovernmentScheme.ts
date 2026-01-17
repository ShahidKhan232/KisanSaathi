import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface IGovernmentScheme {
    schemeId: string;
    schemeName: string;
    description: string;
    benefits: string[];
    eligibility: string[];
    state: string;
    category: string;
    department: string;
    applicationProcess?: string;
    documentsRequired: string[];
    websiteUrl?: string;
    lastUpdated: Date;
    isActive: boolean;
}

export interface IGovernmentSchemeDoc extends Document, IGovernmentScheme {
    _id: mongoose.Types.ObjectId;
}

const GovernmentSchemeSchema = new Schema<IGovernmentSchemeDoc>({
    schemeId: { type: String, required: true, unique: true, trim: true },
    schemeName: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    benefits: { type: [String], default: [] },
    eligibility: { type: [String], default: [] },
    state: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    department: { type: String, required: true, trim: true },
    applicationProcess: { type: String },
    documentsRequired: { type: [String], default: [] },
    websiteUrl: { type: String, trim: true },
    lastUpdated: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true, index: true }
}, {
    timestamps: true
});

// Compound indexes for efficient filtering
GovernmentSchemeSchema.index({ state: 1, category: 1, isActive: 1 });
GovernmentSchemeSchema.index({ category: 1, isActive: 1 });

export const GovernmentSchemeModel: Model<IGovernmentSchemeDoc> =
    (mongoose.models.GovernmentScheme as Model<IGovernmentSchemeDoc>) || model<IGovernmentSchemeDoc>('GovernmentScheme', GovernmentSchemeSchema);
