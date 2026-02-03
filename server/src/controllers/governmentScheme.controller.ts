import { Request, Response } from 'express';
import { GovernmentSchemeModel } from '../models/GovernmentScheme.js';

// Get all schemes with optional filtering
export const getSchemes = async (req: Request, res: Response) => {
    try {
        const { state, category, active, language } = req.query;

        const query: any = {};
        if (state) query.state = new RegExp(String(state), 'i');
        if (category) query.category = new RegExp(String(category), 'i');
        if (active === 'true') query.isActive = true;

        const schemes = await GovernmentSchemeModel.find(query).sort({ lastUpdated: -1 });

        // Log for debugging
        console.log(`📋 Fetched ${schemes.length} schemes${language ? ` for language: ${language}` : ''}`);

        res.json(schemes);
    } catch (error) {
        console.error('Error fetching schemes:', error);
        res.status(500).json({ error: 'Failed to fetch schemes' });
    }
};

// Get single scheme by ID
export const getSchemeById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const scheme = await GovernmentSchemeModel.findOne({ schemeId: id });

        if (!scheme) {
            return res.status(404).json({ error: 'Scheme not found' });
        }
        res.json(scheme);
    } catch (error) {
        console.error('Error fetching scheme:', error);
        res.status(500).json({ error: 'Failed to fetch scheme' });
    }
};

// Create a new scheme
export const createScheme = async (req: Request, res: Response) => {
    try {
        const scheme = await GovernmentSchemeModel.create(req.body);
        res.status(201).json(scheme);
    } catch (error: any) {
        if (error.code === 11000) {
            return res.status(409).json({ error: 'Scheme with this ID already exists' });
        }
        console.error('Error creating scheme:', error);
        res.status(500).json({ error: 'Failed to create scheme' });
    }
};
