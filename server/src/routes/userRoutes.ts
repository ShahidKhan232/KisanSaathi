import express, { Request, Response } from 'express';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import { UserProfile } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Sample user data for development
const sampleUserProfiles: Record<string, UserProfile> = {
  '68e57559b2a0d84edd2f24a2': {
    userId: '68e57559b2a0d84edd2f24a2',
    landSize: '3',
    crops: ['धान', 'गेहूं'],
    hasKCC: true,
    income: 'below-2.5lakh',
    location: 'महाराष्ट्र',
    lastUpdated: new Date().toISOString(),
    previousApplications: []
  }
};

// Get user profile
router.get('/:userId/profile', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authUserId = req.headers.authorization?.replace('Bearer ', '');
    
    // Verify user is fetching their own profile
    if (!authUserId || authUserId !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Return profile or create default if it doesn't exist
    let profile = sampleUserProfiles[userId];
    if (!profile) {
      profile = {
        userId,
        landSize: '2-5',
        crops: ['धान', 'गेहूं'],
        hasKCC: true,
        income: 'below-2.5lakh',
        location: 'महाराष्ट्र',
        lastUpdated: new Date().toISOString(),
        previousApplications: []
      };
      sampleUserProfiles[userId] = profile;
    }
    
    res.json(profile);
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update user profile
router.patch('/:userId/profile', (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const authUserId = req.headers.authorization?.replace('Bearer ', '');
    const updates = req.body;
    
    // Verify user is updating their own profile
    if (!authUserId || authUserId !== userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Create default profile if it doesn't exist
    if (!sampleUserProfiles[userId]) {
      sampleUserProfiles[userId] = {
        userId,
        landSize: '2-5',
        crops: ['धान', 'गेहूं'],
        hasKCC: true,
        income: 'below-2.5lakh',
        location: 'महाराष्ट्र',
        lastUpdated: new Date().toISOString(),
        previousApplications: []
      };
    }
    
    // Update profile
    sampleUserProfiles[userId] = {
      ...sampleUserProfiles[userId],
      ...updates,
      lastUpdated: new Date().toISOString()
    };
    
    res.json(sampleUserProfiles[userId]);
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;