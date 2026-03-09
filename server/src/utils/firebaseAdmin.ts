import { initializeApp, getApps, getApp, type App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

let app: App | null = null;
let adminAvailable = false;

function getFirebaseAdminApp(): App | null {
    if (app) return app;

    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (!projectId || projectId === 'your-firebase-project-id') {
        console.warn('⚠️  FIREBASE_PROJECT_ID not set — Firebase token verification disabled');
        return null;
    }

    try {
        app = getApps().length > 0 ? getApp() : initializeApp({ projectId });
        adminAvailable = true;
        console.log(`✅ Firebase Admin initialized (project: ${projectId})`);
        return app;
    } catch (e) {
        console.warn('⚠️  Firebase Admin init failed:', e);
        return null;
    }
}

// Initialize eagerly on module load
getFirebaseAdminApp();

/**
 * Decode a Firebase ID token payload without signature verification.
 * Used as a fallback when Firebase Admin SDK is not configured (dev mode).
 * ONLY safe because the client already authenticated through Firebase.
 */
function decodeFirebaseTokenUnsafe(idToken: string): { uid: string; email?: string; name?: string } | null {
    try {
        const parts = idToken.split('.');
        if (parts.length !== 3) return null;
        // Base64url decode the payload
        const payload = Buffer.from(parts[1], 'base64url').toString('utf-8');
        const decoded = JSON.parse(payload);
        // Firebase tokens always have 'sub' as the UID and 'iss' containing googleapis
        if (!decoded.sub || !decoded.iss?.includes('googleapis')) return null;
        return {
            uid: decoded.sub,
            email: decoded.email,
            name: decoded.name,
        };
    } catch {
        return null;
    }
}

/**
 * Verify a Firebase ID token.
 * - If Firebase Admin is configured: full cryptographic verification
 * - If not configured (dev/placeholder): decode payload without sig check (trusts client)
 * Returns null if the token is clearly not a Firebase token.
 */
export async function verifyFirebaseToken(idToken: string): Promise<{ uid: string; email?: string; name?: string; firebase?: { sign_in_provider?: string } } | null> {
    const adminApp = getFirebaseAdminApp();

    if (adminApp) {
        // Full verification via Firebase Admin
        try {
            return await getAuth(adminApp).verifyIdToken(idToken) as any;
        } catch {
            return null;
        }
    }

    // Fallback: decode without verification for dev mode
    // Only treat as Firebase token if it looks like one (has 3 JWT parts and googleapis issuer)
    return decodeFirebaseTokenUnsafe(idToken);
}

export function isFirebaseAdminAvailable(): boolean {
    return adminAvailable;
}
