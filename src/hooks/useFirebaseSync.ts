import { useEffect } from 'react';
import { AppState } from 'react-native';
import { usePremium } from '@/context/PremiumContext';
import { useAuth } from '@/context/AuthContext';
import { uploadSnapshot } from '@/firebase/syncService';

// Activa la sincronización Firebase solo para usuarios Plus y Pro.
// Llamar desde SettingsScreen.
export function useFirebaseSync() {
  const { isPremium } = usePremium();
  const { user } = useAuth();

  useEffect(() => {
    if (!isPremium || !user) return;

    const sub = AppState.addEventListener('change', state => {
      if (state === 'background' || state === 'inactive') {
        uploadSnapshot(user.uid);
      }
    });

    return () => sub.remove();
  }, [isPremium, user]);
}
