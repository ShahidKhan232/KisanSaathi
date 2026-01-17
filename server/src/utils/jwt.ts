import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';

// Debug logging
console.log('🔐 JWT_SECRET loaded:', JWT_SECRET ? `${JWT_SECRET.substring(0, 10)}...` : 'NOT SET');
console.log('📁 Current working directory:', process.cwd());
console.log('🌍 All env vars starting with JWT:', Object.keys(process.env).filter(k => k.startsWith('JWT')));

if (!JWT_SECRET || JWT_SECRET === 'dev_secret_change_me') {
    if (process.env.NODE_ENV === 'production') {
        throw new Error('JWT_SECRET must be set in production environment');
    }
    console.warn('⚠️  WARNING: Using default JWT secret. Set JWT_SECRET environment variable!');
    console.warn('⚠️  JWT_SECRET is:', JWT_SECRET || 'EMPTY/UNDEFINED');
}

export interface JwtPayload {
    id: string;
    email: string;
    name?: string;
    iat?: number;
    exp?: number;
}

export const signToken = (payload: JwtPayload): string => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

export const verifyToken = (token: string): JwtPayload | null => {
    try {
        return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
        return null;
    }
};

export const getTokenFromHeader = (authHeader: string | undefined): string | null => {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.slice(7);
};
