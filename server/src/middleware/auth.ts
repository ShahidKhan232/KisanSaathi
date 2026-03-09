import type { Request, Response, NextFunction } from 'express';
import { verifyToken, getTokenFromHeader, type JwtPayload } from '../utils/jwt.js';
import { verifyFirebaseToken } from '../utils/firebaseAdmin.js';

// Extend Express Request type to include user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Resolve a token (Firebase ID token or legacy JWT) into a JwtPayload.
 * Returns null if token is invalid or missing.
 */
async function resolveToken(authHeader: string | undefined): Promise<JwtPayload | null> {
  const token = getTokenFromHeader(authHeader);
  if (!token) return null;

  // ── Try Firebase ID token first ──────────────────────────────────────────
  const firebaseDecoded = await verifyFirebaseToken(token);
  if (firebaseDecoded) {
    return {
      id: firebaseDecoded.uid,
      email: firebaseDecoded.email ?? '',
      name: firebaseDecoded.name ?? undefined,
    };
  }

  // ── Fall back to legacy JWT ──────────────────────────────────────────────
  return verifyToken(token) ?? null;
}

export const authRequired = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const payload = await resolveToken(req.headers.authorization);
  if (!payload) {
    res.status(401).json({ error: 'Unauthorized: Invalid or missing token' });
    return;
  }
  req.user = payload;
  next();
};

export const authOptional = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const payload = await resolveToken(req.headers.authorization);
  if (payload) req.user = payload;
  next();
};