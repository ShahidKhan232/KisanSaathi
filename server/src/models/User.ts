import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface IUser {
    name?: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    phone?: string;
    location?: string;
    landSize?: string;
    crops?: string[];
    kccNumber?: string;
    aadhaar?: string;
    bankAccount?: string;
    // New enhanced fields
    preferredLanguage?: 'en' | 'hi' | 'mr';
    farmingExperience?: number; // years
    primaryCrops?: string[];
    farmLocation?: {
        latitude?: number;
        longitude?: number;
        address?: string;
    };
    soilType?: string;
    irrigationType?: string;
    lastActive?: Date;
    profileComplete?: boolean;
    notificationPreferences?: {
        email?: boolean;
        sms?: boolean;
        push?: boolean;
        priceAlerts?: boolean;
        schemeUpdates?: boolean;
    };
}


export interface IUserDoc extends Document, IUser {
    _id: mongoose.Types.ObjectId;
}

const UserSchema = new Schema<IUserDoc>({
    name: { type: String, trim: true },
    email: { type: String, unique: true, required: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    phone: { type: String, trim: true },
    location: { type: String, trim: true },
    landSize: { type: String, trim: true },
    crops: { type: [String], default: [] },
    kccNumber: { type: String, trim: true },
    aadhaar: { type: String, trim: true },
    bankAccount: { type: String, trim: true },
    // New enhanced fields
    preferredLanguage: { type: String, enum: ['en', 'hi', 'mr'], default: 'en' },
    farmingExperience: { type: Number, min: 0 },
    primaryCrops: { type: [String], default: [] },
    farmLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
        address: { type: String, trim: true }
    },
    soilType: { type: String, trim: true },
    irrigationType: { type: String, trim: true },
    lastActive: { type: Date, default: Date.now },
    profileComplete: { type: Boolean, default: false },
    notificationPreferences: {
        email: { type: Boolean, default: true },
        sms: { type: Boolean, default: false },
        push: { type: Boolean, default: true },
        priceAlerts: { type: Boolean, default: true },
        schemeUpdates: { type: Boolean, default: true }
    }
}, {
    timestamps: true
});

export const UserModel: Model<IUserDoc> =
    (mongoose.models.User as Model<IUserDoc>) || model<IUserDoc>('User', UserSchema);
