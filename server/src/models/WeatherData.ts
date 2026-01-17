import mongoose, { Schema, model, Model, Document } from 'mongoose';

export interface ITemperature {
    min: number;
    max: number;
    avg: number;
}

export interface IForecast {
    date: Date;
    temperature: ITemperature;
    humidity: number;
    rainfall: number;
    condition: string;
}

export interface IWeatherData {
    location: string;
    coordinates?: {
        latitude: number;
        longitude: number;
    };
    temperature: ITemperature;
    humidity: number;
    rainfall: number;
    windSpeed: number;
    forecast: IForecast[];
    recordDate: Date;
    source: string;
}

export interface IWeatherDataDoc extends Document, IWeatherData {
    _id: mongoose.Types.ObjectId;
}

const TemperatureSchema = new Schema<ITemperature>({
    min: { type: Number, required: true },
    max: { type: Number, required: true },
    avg: { type: Number, required: true }
}, { _id: false });

const ForecastSchema = new Schema<IForecast>({
    date: { type: Date, required: true },
    temperature: { type: TemperatureSchema, required: true },
    humidity: { type: Number, required: true, min: 0, max: 100 },
    rainfall: { type: Number, required: true, min: 0 },
    condition: { type: String, required: true, trim: true }
}, { _id: false });

const WeatherDataSchema = new Schema<IWeatherDataDoc>({
    location: { type: String, required: true, trim: true, index: true },
    coordinates: {
        latitude: { type: Number },
        longitude: { type: Number }
    },
    temperature: { type: TemperatureSchema, required: true },
    humidity: { type: Number, required: true, min: 0, max: 100 },
    rainfall: { type: Number, required: true, min: 0 },
    windSpeed: { type: Number, required: true, min: 0 },
    forecast: { type: [ForecastSchema], default: [] },
    recordDate: { type: Date, required: true, index: true },
    source: { type: String, required: true, trim: true }
}, {
    timestamps: true
});

// Compound index for efficient queries
WeatherDataSchema.index({ location: 1, recordDate: -1 });

// Unique constraint to prevent duplicate weather records
WeatherDataSchema.index({ location: 1, recordDate: 1, source: 1 }, { unique: true });

export const WeatherDataModel: Model<IWeatherDataDoc> =
    (mongoose.models.WeatherData as Model<IWeatherDataDoc>) || model<IWeatherDataDoc>('WeatherData', WeatherDataSchema);
