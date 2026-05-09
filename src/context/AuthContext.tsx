import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { getFirebaseAuth } from '@/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextValue {
  user: User | null;
  isAuthLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    // Firebase persiste la sesión automáticamente vía AsyncStorage (getReactNativePersistence)
    const auth = getFirebaseAuth();
    const unsubscribe = onAuthStateChanged(auth, currentUser => {
      setUser(currentUser);
      setIsAuthLoading(false);
    });
    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}
