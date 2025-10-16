export type ApplicationStatus = 'available' | 'applied' | 'approved' | 'rejected' | 'pending';
export type DocumentStatus = 'pending' | 'uploaded' | 'verified' | 'rejected';

export interface SchemeDocument {
  id: string;
  name: string;
  description?: string;
  required: boolean;
  format: 'pdf' | 'image' | 'any';
  maxSize: number; // in MB
  status: DocumentStatus;
  uploadedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface ApplicationStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  completedAt?: string;
  requiredDocuments: string[]; // References to SchemeDocument ids
  nextSteps?: string[];
  notes?: string[];
}

export interface ApplicationProgress {
  applicationId: string;
  schemeId: string;
  currentStep: number;
  totalSteps: number;
  startedAt: string;
  lastUpdated: string;
  status: ApplicationStatus;
  documents: SchemeDocument[];
  steps: ApplicationStep[];
  timeline: Array<{
    date: string;
    title: string;
    description: string;
    type: 'success' | 'warning' | 'error' | 'info';
  }>;
}