import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isDemoMode: boolean;
  login: (email: string, password: string) => Promise<{ error: Error | null }>;
  signup: (email: string, password: string, name: string) => Promise<{ error: Error | null }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isSupabaseConfigured;

  useEffect(() => {
    if (isSupabaseConfigured && supabase) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          });
        }
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email || "",
            user_metadata: session.user.user_metadata,
          });
        } else {
          setUser(null);
        }
        setLoading(false);
      });

      return () => {
        subscription.unsubscribe();
      };
    } else {
      // Demo Mode: restore session from local storage
      try {
        const storedUser = localStorage.getItem("df_demo_user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (e) {
        console.error("Failed to parse demo user session:", e);
      }
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          user_metadata: data.user.user_metadata,
        });
      }
      return { error: null };
    } else {
      try {
        const usersStr = localStorage.getItem("df_demo_users") || "[]";
        const users = JSON.parse(usersStr);
        const matched = users.find((u: { email: string; password: string; id: string; name: string }) =>
          u.email.toLowerCase() === email.toLowerCase()
        );
        if (!matched || matched.password !== password) {
          throw new Error("Invalid email or password");
        }
        const sessionUser = {
          id: matched.id,
          email: matched.email,
          user_metadata: { full_name: matched.name },
        };
        localStorage.setItem("df_demo_user", JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { error: null };
      } catch (e: unknown) {
        return { error: new Error((e as Error).message || "Failed to log in") };
      }
    }
  };

  const signup = async (email: string, password: string, name: string): Promise<{ error: Error | null }> => {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } },
      });
      if (error) return { error };
      if (data.user) {
        setUser({
          id: data.user.id,
          email: data.user.email || "",
          user_metadata: data.user.user_metadata,
        });
      }
      return { error: null };
    } else {
      try {
        const usersStr = localStorage.getItem("df_demo_users") || "[]";
        const users = JSON.parse(usersStr);
        const exists = users.some((u: { email: string }) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) throw new Error("An account with this email already exists");

        const newUser = {
          id: Math.random().toString(36).substring(2, 11),
          email,
          password,
          name,
        };
        users.push(newUser);
        localStorage.setItem("df_demo_users", JSON.stringify(users));

        const sessionUser = {
          id: newUser.id,
          email: newUser.email,
          user_metadata: { full_name: newUser.name },
        };
        localStorage.setItem("df_demo_user", JSON.stringify(sessionUser));
        setUser(sessionUser);
        return { error: null };
      } catch (e: unknown) {
        return { error: new Error((e as Error).message || "Failed to sign up") };
      }
    }
  };

  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      await supabase.auth.signOut();
    } else {
      localStorage.removeItem("df_demo_user");
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isDemoMode, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
