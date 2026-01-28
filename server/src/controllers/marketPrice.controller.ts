import { Request, Response } from 'express';
import { MarketPriceModel } from '../models/MarketPrice.js';

// Get prices with optional filtering by commodity, market, state
export const getMarketPrices = async (req: Request, res: Response) => {
    try {
        const { commodity, market, state, district, limit } = req.query;

        const query: any = {};
        if (commodity) query.commodity = new RegExp(String(commodity), 'i');
        if (market) query.market = new RegExp(String(market), 'i');
        if (state) query.state = new RegExp(String(state), 'i');
        if (district) query.district = new RegExp(String(district), 'i');

        const prices = await MarketPriceModel.find(query)
            .sort({ priceDate: -1 })
            .limit(Number(limit) || 50);

        res.json(prices);
    } catch (error) {
        console.error('Error fetching market prices:', error);
        res.status(500).json({ error: 'Failed to fetch market prices' });
    }
};

// Add a new market price (Admin or Script use)
export const addMarketPrice = async (req: Request, res: Response) => {
    try {
        const priceData = req.body;

        // Basic duplicate check is handled by unique index in model
        const price = await MarketPriceModel.create({
            ...priceData,
            priceDate: priceData.priceDate || new Date()
        });

        res.status(201).json(price);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Price entry already exists for this market and date' });
        }
        console.error('Error adding market price:', error);
        res.status(500).json({ error: 'Failed to add market price' });
    }
};
