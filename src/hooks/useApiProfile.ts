import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';

export interface ApiProfile {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  location: string | null;
  landSize: string | null;
  crops: string[];
  kccNumber: string | null;
  aadhaar: string | null;
  bankAccount: string | null;
}

export function useApiProfile() {
  const { token } = useAuth();
  const [profile, setProfile] = useState<ApiProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const backendUrl = (import.meta as ImportMeta).env?.VITE_SERVER_URL ?? '';

  const fetchProfile = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${backendUrl}/api/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch profile: ${response.status}`);
      }

      const data = await response.json();
      setProfile(data);
    } catch (err) {
      console.error('Profile fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<Omit<ApiProfile, 'id' | 'email'>>) => {
    if (!token) return false;

    try {
      setError(null);
      
      const response = await fetch(`${backendUrl}/api/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error(`Failed to update profile: ${response.status}`);
      }

      const updatedProfile = await response.json();
      setProfile(updatedProfile);
      return true;
    } catch (err) {
      console.error('Profile update error:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      return false;
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [token]);

  return {
    profile,
    loading,
    error,
    fetchProfile,
    updateProfile,
  };
}