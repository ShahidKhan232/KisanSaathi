// In-memory storage types for fallback when MongoDB is unavailable

export type MemUser = {
    id: string;
    name?: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
};

export type MemProfile = {
    phone?: string;
    location?: string;
    landSize?: string;
    crops?: string[];
    kccNumber?: string;
    aadhaar?: string;
    bankAccount?: string;
};

export type MemAlert = {
    userId: string;
    crop: string;
    targetPrice: number;
    createdAt: Date;
    market?: string;
    alertType: 'above' | 'below' | 'change';
    isActive: boolean;
};

export type MemCropDisease = {
    id: string;
    userId: string;
    cropName: string;
    detectedDisease: string;
    confidence: number;
    detectedAt: Date;
};

export type MemMarketPrice = {
    id: string;
    commodity: string;
    market: string;
    state: string;
    modalPrice: number;
    priceDate: Date;
};

export type MemChatHistory = {
    id: string;
    userId: string;
    sessionId: string;
    messages: Array<{ role: 'user' | 'assistant'; content: string; timestamp: Date }>;
    createdAt: Date;
};

// In-memory stores
export const usersMemory: MemUser[] = [];
export const userIdToProfile: Record<string, MemProfile> = {};
export const alertsMemory: MemAlert[] = [];
export const cropDiseasesMemory: MemCropDisease[] = [];
export const marketPricesMemory: MemMarketPrice[] = [];
export const chatHistoryMemory: MemChatHistory[] = [];
