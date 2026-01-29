import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { UserProfile, UserRole, getUserProfile, getUserRoles } from '@/lib/auth';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  roles: UserRole[];
  isSuperAdmin: boolean;
  isClinicAdmin: boolean;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = roles.some(role => role.role === 'super_admin');
  const isClinicAdmin = roles.some(role => role.role === 'clinic_admin');

  const loadUserData = async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setRoles([]);
      return;
    }

    try {
      const [profileData, rolesData] = await Promise.all([
        getUserProfile(),
        getUserRoles()
      ]);

      setProfile(profileData);
      setRoles(rolesData);
    } catch (err) {
      // If role/profile queries fail (e.g. RLS), never leave the app stuck in loading.
      console.error('AuthContext.loadUserData error', err);
      setProfile(null);
      setRoles([]);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await loadUserData(user);
    }
  };

  useEffect(() => {
    let isMounted = true;

    // Listener for ongoing auth changes (does NOT control initial loading flag)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          // Fire and forget; do not touch `loading` here.
          loadUserData(currentSession.user);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    );

    // Initial load (controls `loading`)
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadUserData(currentSession.user);
        } else {
          setProfile(null);
          setRoles([]);
        }
      } catch (err) {
        console.error('AuthContext.initializeAuth error', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      profile, 
      roles, 
      isSuperAdmin, 
      isClinicAdmin, 
      loading,
      refreshProfile 
    }}>
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
