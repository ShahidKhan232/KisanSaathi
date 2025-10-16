import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';

interface TokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export const verifyToken = async (token: string): Promise<TokenPayload> => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    throw new Error('Invalid token');
  }
};