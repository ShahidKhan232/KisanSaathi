import type { Request, Response, NextFunction } from 'express';
import { verifyToken, getTokenFromHeader, type JwtPayload } from '../utils/jwt.js';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export const authRequired = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = getTokenFromHeader(req.headers.authorization);

  if (!token) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid token' });
    return;
  }

  req.user = payload;
  next();
};

// Optional auth - sets user if token is valid, but doesn't require it
export const authOptional = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const token = getTokenFromHeader(req.headers.authorization);

  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = payload;
    }
  }

  next();
};