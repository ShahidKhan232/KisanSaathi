import { useState, useEffect, useCallback } from 'react';
import { alertService, Alert } from '../services/alertService';

interface UseAlertsReturn {
  alerts: Alert[];
  loading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  refreshAlerts: () => Promise<void>;
}

export function useAlerts(autoRefreshMinutes: number = 5): UseAlertsReturn {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchAlerts = useCallback(async () => {
    try {
      setError(null);
      const newAlerts = await alertService.getAlerts();
      setAlerts(newAlerts);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch alerts');
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshAlerts = useCallback(async () => {
    setLoading(true);
    alertService.clearCache(); // Force fresh data
    await fetchAlerts();
  }, [fetchAlerts]);

  // Initial load
  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Auto-refresh interval
  useEffect(() => {
    if (autoRefreshMinutes <= 0) return;

    const interval = setInterval(() => {
      fetchAlerts();
    }, autoRefreshMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [autoRefreshMinutes, fetchAlerts]);

  // Refresh when page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchAlerts();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchAlerts]);

  // Clean up expired alerts
  useEffect(() => {
    const cleanupExpiredAlerts = () => {
      const now = new Date();
      setAlerts(prevAlerts => 
        prevAlerts.filter(alert => 
          !alert.expiresAt || alert.expiresAt > now
        )
      );
    };

    const interval = setInterval(cleanupExpiredAlerts, 60 * 1000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  return {
    alerts,
    loading,
    error,
    lastUpdated,
    refreshAlerts
  };
}