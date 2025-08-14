import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, userData?: any) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>({ role: 'admin', full_name: 'Admin User' });
  const [loading, setLoading] = useState(false);

  const signIn = async (email: string, password: string) => {
    // Simulated for now - will be properly implemented when Supabase is connected
    const mockSession = { user: { email } } as Session;
    setUser({ email } as User);
    setSession(mockSession);
  };

  const signUp = async (email: string, password: string, userData?: any) => {
    // Simulated for now
  };

  const signOut = async () => {
    setUser(null);
    setSession(null);
    setUserProfile(null);
  };

  const resetPassword = async (email: string) => {
    // Simulated for now
  };

  const value = {
    user,
    session,
    userProfile,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};