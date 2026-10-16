import express, { Response } from 'express';
import mongoose from 'mongoose';
import { authRequired } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { UserModel } from '../models/User.js';

const router = express.Router();

/**
 * Resolve a user document by MongoDB ObjectId or Firebase UID.
 */
async function resolveUser(id: string) {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return UserModel.findById(id);
  }
  return UserModel.findOne({ firebaseUid: id });
}

// Get authenticated user's profile — scoped strictly to req.user.id
router.get('/:userId/profile', authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const authenticatedId = req.user!.id;

    const user = await resolveUser(authenticatedId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      userId: String(user._id),
      landSize: user.landSize ?? '',
      crops: user.crops ?? [],
      hasKCC: !!user.kccNumber,
      income: '',
      location: user.location ?? '',
      lastUpdated: (user as any).updatedAt?.toISOString() ?? new Date().toISOString(),
      previousApplications: []
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({ error: 'Failed to fetch user profile' });
  }
});

// Update authenticated user's profile — scoped strictly to req.user.id
router.patch('/:userId/profile', authRequired, async (req: AuthRequest, res: Response) => {
  try {
    const authenticatedId = req.user!.id;
    const { landSize, crops, location } = req.body;

    const user = await resolveUser(authenticatedId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const updateFields: Record<string, any> = {};
    if (landSize !== undefined) updateFields.landSize = String(landSize).trim();
    if (crops !== undefined && Array.isArray(crops)) updateFields.crops = crops;
    if (location !== undefined) updateFields.location = String(location).trim();

    const updated = await UserModel.findByIdAndUpdate(
      user._id,
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    res.json({
      userId: String(updated!._id),
      landSize: updated!.landSize ?? '',
      crops: updated!.crops ?? [],
      hasKCC: !!updated!.kccNumber,
      income: '',
      location: updated!.location ?? '',
      lastUpdated: new Date().toISOString(),
      previousApplications: []
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    res.status(500).json({ error: 'Failed to update user profile' });
  }
});

export default router;