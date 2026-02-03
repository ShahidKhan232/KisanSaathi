import { useEffect } from 'react';
import { socketService } from '../services/socketService';
import { useAuth } from './useAuth';

export function useSocket() {
  const { user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      socketService.connect(user.id);
      return () => socketService.disconnect();
    }
  }, [user]);

  return socketService;
}