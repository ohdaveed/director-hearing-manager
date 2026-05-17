import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export type Role = 'Inspector' | 'Admin' | 'Program Manager' | 'Super Admin';

export type AppUser = {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role?: Role;
  signatureText?: string;
  signatureStyle?: string;
};

type AuthContextType = {
  user: AppUser | null;
  session: any | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setIsLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function fetchProfile(supabaseUser: User) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', supabaseUser.email)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUser({
          id: data.id,
          email: data.email,
          firstName: data.first_name,
          lastName: data.last_name,
          role: data.role as Role,
          signatureText: data.signature_text,
          signatureStyle: data.signature_style,
        });
      } else {
        // Handle case where auth user exists but profile doesn't
        // Maybe create a default profile?
        setUser({
          id: supabaseUser.id,
          email: supabaseUser.email!,
          role: 'Inspector', // Default role
        });
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setIsLoading(false);
    }
  }

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
