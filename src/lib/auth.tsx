import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import * as store from '@/lib/localStore';
import type { User as DbUser } from '@/types/database';

interface AuthContextType {
  user: DbUser | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize users (creates admin if not exists)
    store.getUsers();

    // Check for existing session
    const currentUser = store.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
    setLoading(false);
  }, []);

  async function signIn(username: string, password: string) {
    const authenticatedUser = store.authenticate(username, password);

    if (!authenticatedUser) {
      return { error: new Error('Pogrešno korisničko ime ili lozinka') };
    }

    store.setCurrentUser(authenticatedUser);
    setUser(authenticatedUser);
    return { error: null };
  }

  async function signOut() {
    store.setCurrentUser(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
