import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

export type Role = "Inspector" | "Admin" | "Program Manager" | "Super Admin";

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
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
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
        .from("users")
        .select(
          "id, email, first_name, last_name, role, signature_text, signature_style",
        )
        .eq("email", supabaseUser.email)
        .is("deleted_at", null)
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
        // Auth user exists but no profile — create one automatically
        const nameParts = (
          supabaseUser.user_metadata?.first_name
            ? `${supabaseUser.user_metadata.first_name} ${supabaseUser.user_metadata.last_name ?? ""}`.trim()
            : (supabaseUser.email?.split("@")[0] ?? "")
        )?.split(" ");
        const firstName =
          supabaseUser.user_metadata?.first_name ?? nameParts[0] ?? "";
        const lastName =
          supabaseUser.user_metadata?.last_name ??
          nameParts.slice(1).join(" ") ??
          "";

        try {
          const { data: newProfile, error: insertError } = await supabase
            .from("users")
            .insert({
              id: supabaseUser.id,
              email: supabaseUser.email!,
              first_name: firstName,
              last_name: lastName,
              role: "Inspector",
            })
            .select(
              "id, email, first_name, last_name, role, signature_text, signature_style",
            )
            .single();

          if (insertError) throw insertError;

          setUser({
            id: newProfile.id,
            email: newProfile.email,
            firstName: newProfile.first_name,
            lastName: newProfile.last_name,
            role: newProfile.role as Role,
            signatureText: newProfile.signature_text,
            signatureStyle: newProfile.signature_style,
          });
        } catch (err) {
          console.error("Error creating user profile:", err);
          setUser({
            id: supabaseUser.id,
            email: supabaseUser.email!,
            role: "Inspector",
          });
        }
      }
    } catch (err) {
      console.error("Error fetching user profile:", err);
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
