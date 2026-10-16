import {
  createContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
  useCallback,
  useContext,
} from 'react';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User as FirebaseUser,
} from 'firebase/auth';
import { auth, googleProvider } from '../services/firebase';

// ─── Types ──────────────────────────────────────────────────────────────────

export interface JwtUser {
  id: string;         // MongoDB _id (from /api/auth/firebase-sync)
  firebaseUid: string;
  email: string;
  name?: string | null;
}

interface AuthContextType {
  user: JwtUser | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  token: string | null;           // Firebase ID token (refreshed automatically)
  signInEmail: (email: string, password: string) => Promise<void>;
  signUpEmail: (email: string, password: string, name?: string) => Promise<void>;
  signInGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// The token key — keep consistent with the rest of the app
const TOKEN_KEY = 'auth_token';

const backendUrl = (import.meta as ImportMeta).env?.VITE_SERVER_URL ?? 'http://localhost:5001';

// ─── Sync Firebase user with MongoDB ────────────────────────────────────────
async function syncWithBackend(firebaseUser: FirebaseUser): Promise<{ id: string }> {
  const idToken = await firebaseUser.getIdToken();
  // Store token so apiService interceptor picks it up immediately
  localStorage.setItem(TOKEN_KEY, idToken);

  const res = await fetch(`${backendUrl}/api/auth/firebase-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify({
      firebaseUid: firebaseUser.uid,
      email: firebaseUser.email,
      name: firebaseUser.displayName,
    }),
  });

  if (!res.ok) throw new Error('Backend sync failed');
  return res.json(); // { id: mongoDbUserId }
}

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<JwtUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Listen to Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        try {
          const idToken = await fbUser.getIdToken();
          setToken(idToken);
          localStorage.setItem(TOKEN_KEY, idToken);

          // Sync with MongoDB to get the stable MongoDB user ID
          const { id } = await syncWithBackend(fbUser);
          setFirebaseUser(fbUser);
          setUser({
            id,
            firebaseUid: fbUser.uid,
            email: fbUser.email ?? '',
            name: fbUser.displayName,
          });
        } catch (e) {
          console.error('Auth state sync error:', e);
          setUser(null);
          setToken(null);
          localStorage.removeItem(TOKEN_KEY);
        }
      } else {
        setFirebaseUser(null);
        setUser(null);
        setToken(null);
        localStorage.removeItem(TOKEN_KEY);
      }
      setLoading(false);
    });

    // Firebase ID tokens expire after 1 hour — refresh proactively every 55 min
    const refreshInterval = setInterval(async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          const freshToken = await currentUser.getIdToken(true); // force refresh
          setToken(freshToken);
          localStorage.setItem(TOKEN_KEY, freshToken);
        } catch {
          // Will be caught by onAuthStateChanged
        }
      }
    }, 55 * 60 * 1000);

    return () => {
      unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signInEmail = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const signUpEmail = useCallback(async (email: string, password: string, name?: string) => {
    setError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const signInGoogle = useCallback(async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      // onAuthStateChanged will handle the rest
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') return; // User dismissed, not an error
      const msg = mapFirebaseError(err.code);
      setError(msg);
      throw new Error(msg);
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setToken(null);
    setFirebaseUser(null);
  }, []);

  const value = useMemo(
    () => ({ user, firebaseUser, loading, error, token, signInEmail, signUpEmail, signInGoogle, logout }),
    [user, firebaseUser, loading, error, token, signInEmail, signUpEmail, signInGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

// ─── Firebase error code → human message ─────────────────────────────────────

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found':           'No account found with this email.',
    'auth/wrong-password':           'Incorrect password. Please try again.',
    'auth/invalid-credential':       'Invalid email or password.',
    'auth/email-already-in-use':     'This email is already registered.',
    'auth/weak-password':            'Password must be at least 6 characters.',
    'auth/invalid-email':            'Please enter a valid email address.',
    'auth/too-many-requests':        'Too many attempts. Please wait and try again.',
    'auth/network-request-failed':   'Network error. Check your connection.',
    'auth/popup-blocked':            'Popup was blocked. Allow popups for this site.',
    'auth/cancelled-popup-request':  'Sign-in cancelled.',
  };
  return map[code] ?? `Authentication error (${code})`;
}
