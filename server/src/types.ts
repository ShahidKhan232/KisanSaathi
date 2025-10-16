export interface UserProfile {
  userId: string;
  landSize: string;
  crops: string[];
  hasKCC: boolean;
  income: string;
  location?: string;
  lastUpdated: string;
  previousApplications: Array<{
    schemeId: string;
    status: 'approved' | 'rejected' | 'pending';
    appliedDate: string;
  }>;
}