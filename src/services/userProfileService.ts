import { socketService } from './socketService';

export interface UserProfile {
  landSize: string;
  crops: string[];
  hasKCC: boolean;
  income: string;
  previousApplications: {
    schemeId: string;
    status: 'approved' | 'rejected' | 'pending';
    appliedDate: string;
  }[];
}

export interface UserProfileUpdate {
  field: keyof UserProfile;
  value: any;
}

class UserProfileService {
  private static instance: UserProfileService;
  
  private constructor() {}

  public static getInstance(): UserProfileService {
    if (!UserProfileService.instance) {
      UserProfileService.instance = new UserProfileService();
    }
    return UserProfileService.instance;
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    const response = await fetch(`/api/users/${userId}/profile`, {
      headers: {
        'Authorization': `Bearer ${userId}`
      }
    });
    if (!response.ok) {
      throw new Error('Failed to fetch user profile');
    }
    return response.json();
  }

  async updateUserProfile(userId: string, update: Partial<UserProfile>): Promise<UserProfile> {
    const response = await fetch(`/api/users/${userId}/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userId}`
      },
      body: JSON.stringify(update)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update user profile');
    }
    
    // Emit update through socket
    socketService.emit('profile:update', { userId, update });
    
    return response.json();
  }

  async addCrop(userId: string, crop: string): Promise<void> {
    await this.updateUserProfile(userId, {
      crops: [...(await this.getUserProfile(userId)).crops, crop]
    });
  }

  async removeCrop(userId: string, crop: string): Promise<void> {
    const profile = await this.getUserProfile(userId);
    await this.updateUserProfile(userId, {
      crops: profile.crops.filter(c => c !== crop)
    });
  }

  async updateLandSize(userId: string, landSize: string): Promise<void> {
    await this.updateUserProfile(userId, { landSize });
  }

  async updateKCCStatus(userId: string, hasKCC: boolean): Promise<void> {
    await this.updateUserProfile(userId, { hasKCC });
  }

  async updateIncome(userId: string, income: string): Promise<void> {
    await this.updateUserProfile(userId, { income });
  }

  subscribeToProfileUpdates(userId: string, callback: (profile: UserProfile) => void): void {
    socketService.subscribe<UserProfile>('profile:update', callback);
  }

  unsubscribeFromProfileUpdates(): void {
    socketService.unsubscribe('profile:update');
  }
}

export const userProfileService = UserProfileService.getInstance();