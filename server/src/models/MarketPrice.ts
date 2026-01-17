import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface IMarketPrice {
    commodity: string;
    variety?: string;
    market: string;
    state: string;
    district: string;
    minPrice: number;
    maxPrice: number;
    modalPrice: number;
    priceDate: Date;
    arrivals?: number;
    source: 'agmarknet' | 'enam' | 'other';
    fetchedAt: Date;
}

export interface IMarketPriceDoc extends Document, IMarketPrice {
    _id: mongoose.Types.ObjectId;
}

const MarketPriceSchema = new Schema<IMarketPriceDoc>({
    commodity: { type: String, required: true, trim: true, index: true },
    variety: { type: String, trim: true },
    market: { type: String, required: true, trim: true, index: true },
    state: { type: String, required: true, trim: true },
    district: { type: String, required: true, trim: true },
    minPrice: { type: Number, required: true, min: 0 },
    maxPrice: { type: Number, required: true, min: 0 },
    modalPrice: { type: Number, required: true, min: 0 },
    priceDate: { type: Date, required: true, index: true },
    arrivals: { type: Number, min: 0 },
    source: { type: String, enum: ['agmarknet', 'enam', 'other'], default: 'agmarknet' },
    fetchedAt: { type: Date, default: Date.now }
}, {
    timestamps: true
});

// Compound indexes for efficient queries
MarketPriceSchema.index({ commodity: 1, market: 1, priceDate: -1 });
MarketPriceSchema.index({ commodity: 1, state: 1, priceDate: -1 });
MarketPriceSchema.index({ priceDate: -1 });

// Unique constraint to prevent duplicate price entries
MarketPriceSchema.index({ commodity: 1, market: 1, priceDate: 1 }, { unique: true });

export const MarketPriceModel: Model<IMarketPriceDoc> =
    (mongoose.models.MarketPrice as Model<IMarketPriceDoc>) || model<IMarketPriceDoc>('MarketPrice', MarketPriceSchema);
