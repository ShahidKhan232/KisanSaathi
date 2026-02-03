import { Request, Response } from 'express';
import { CropInfoModel } from '../models/CropInfo.js';

// Get all crops with optional filtering
export const getAllCrops = async (req: Request, res: Response) => {
    try {
        const { category, season, search } = req.query;

        const query: any = {};
        if (category) query.category = category;
        if (season) query.season = season;
        if (search) query.cropName = new RegExp(String(search), 'i');

        const crops = await CropInfoModel.find(query).sort({ cropName: 1 });

        console.log(`🌱 Fetched ${crops.length} crops`);
        res.json(crops);
    } catch (error) {
        console.error('Error fetching crops:', error);
        res.status(500).json({ error: 'Failed to fetch crops' });
    }
};

// Get crop by name
export const getCropByName = async (req: Request, res: Response) => {
    try {
        const { name } = req.params;

        const crop = await CropInfoModel.findOne({
            cropName: new RegExp(`^${name}$`, 'i')
        });

        if (!crop) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        res.json(crop);
    } catch (error) {
        console.error('Error fetching crop:', error);
        res.status(500).json({ error: 'Failed to fetch crop' });
    }
};

// Get crop by ID
export const getCropById = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const crop = await CropInfoModel.findById(id);

        if (!crop) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        res.json(crop);
    } catch (error) {
        console.error('Error fetching crop:', error);
        res.status(500).json({ error: 'Failed to fetch crop' });
    }
};

// Create new crop (admin only - can add auth middleware later)
export const createCrop = async (req: Request, res: Response) => {
    try {
        const cropData = req.body;

        const existingCrop = await CropInfoModel.findOne({
            cropName: new RegExp(`^${cropData.cropName}$`, 'i')
        });

        if (existingCrop) {
            return res.status(409).json({ error: 'Crop already exists' });
        }

        const crop = await CropInfoModel.create(cropData);

        console.log(`✅ Created new crop: ${crop.cropName}`);
        res.status(201).json(crop);
    } catch (error) {
        console.error('Error creating crop:', error);
        res.status(500).json({ error: 'Failed to create crop' });
    }
};

// Update crop (admin only - can add auth middleware later)
export const updateCrop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        const crop = await CropInfoModel.findByIdAndUpdate(
            id,
            updates,
            { new: true, runValidators: true }
        );

        if (!crop) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        console.log(`✏️  Updated crop: ${crop.cropName}`);
        res.json(crop);
    } catch (error) {
        console.error('Error updating crop:', error);
        res.status(500).json({ error: 'Failed to update crop' });
    }
};

// Delete crop (admin only - can add auth middleware later)
export const deleteCrop = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const crop = await CropInfoModel.findByIdAndDelete(id);

        if (!crop) {
            return res.status(404).json({ error: 'Crop not found' });
        }

        console.log(`🗑️  Deleted crop: ${crop.cropName}`);
        res.json({ message: 'Crop deleted successfully' });
    } catch (error) {
        console.error('Error deleting crop:', error);
        res.status(500).json({ error: 'Failed to delete crop' });
    }
};
