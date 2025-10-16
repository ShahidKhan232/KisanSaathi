import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { userProfileService, type UserProfile } from '../services/userProfileService';

export function useUserProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadProfile = async () => {
      if (!user?.id) return;
      
      try {
        setIsLoading(true);
        const data = await userProfileService.getUserProfile(user.id);
        if (isActive) {
          setProfile(data);
          setError(null);
        }
      } catch (err) {
        if (isActive) {
          setError(err as Error);
        }
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    // Subscribe to real-time updates
    const handleProfileUpdate = (updatedProfile: UserProfile) => {
      if (isActive) {
        setProfile(updatedProfile);
      }
    };

    if (user?.id) {
      loadProfile();
      userProfileService.subscribeToProfileUpdates(user.id, handleProfileUpdate);
    }

    return () => {
      isActive = false;
      userProfileService.unsubscribeFromProfileUpdates();
    };
  }, [user]);

  const updateProfile = async (update: Partial<UserProfile>) => {
    if (!user?.id || !profile) return;

    try {
      const updatedProfile = await userProfileService.updateUserProfile(user.id, update);
      setProfile(updatedProfile);
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  };

  const addCrop = async (crop: string) => {
    if (!user?.id) return;
    await userProfileService.addCrop(user.id, crop);
  };

  const removeCrop = async (crop: string) => {
    if (!user?.id) return;
    await userProfileService.removeCrop(user.id, crop);
  };

  const updateLandSize = async (landSize: string) => {
    if (!user?.id) return;
    await userProfileService.updateLandSize(user.id, landSize);
  };

  const updateKCCStatus = async (hasKCC: boolean) => {
    if (!user?.id) return;
    await userProfileService.updateKCCStatus(user.id, hasKCC);
  };

  const updateIncome = async (income: string) => {
    if (!user?.id) return;
    await userProfileService.updateIncome(user.id, income);
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    addCrop,
    removeCrop,
    updateLandSize,
    updateKCCStatus,
    updateIncome
  };
}