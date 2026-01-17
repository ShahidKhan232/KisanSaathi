import { z } from 'zod';

export const RegisterSchema = z.object({
    name: z.string().min(1).optional(),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters')
});

export const LoginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

export const ProfileSchema = z.object({
    name: z.string().min(1).optional(),
    phone: z.string().min(3).optional(),
    email: z.string().email().optional(),
    location: z.string().min(1).optional(),
    landSize: z.string().min(1).optional(),
    crops: z.array(z.string()).optional(),
    kccNumber: z.string().optional(),
    aadhaar: z.string().optional(),
    bankAccount: z.string().optional()
});

export const AlertSchema = z.object({
    userId: z.string().min(1).optional(), // Will be overridden by token if present
    crop: z.string().min(1, 'Crop name is required'),
    targetPrice: z.number().positive('Target price must be positive')
});

export const AIRequestSchema = z.object({
    message: z.string().min(1, 'Message is required'),
    systemPrompt: z.string().optional()
});

export const ImageAnalysisSchema = z.object({
    imageBase64: z.string().min(1, 'Image data is required'),
    query: z.string().min(1, 'Query is required'),
    systemPrompt: z.string().optional()
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type ProfileInput = z.infer<typeof ProfileSchema>;
export type AlertInput = z.infer<typeof AlertSchema>;
export type AIRequestInput = z.infer<typeof AIRequestSchema>;
export type ImageAnalysisInput = z.infer<typeof ImageAnalysisSchema>;
