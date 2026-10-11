import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { ApiError, api, jsonOptions, readSession, storeSession } from './api';
import type { Role, Session, User } from './types';

interface Credentials { email: string; password: string }
interface SignUpDetails extends Credentials { name: string }

interface AuthValue {
  user: User | null;
  /** False until the stored session has been read in the browser. */
  ready: boolean;
  signIn(credentials: Credentials): Promise<User>;
  signUp(details: SignUpDetails): Promise<User>;
  signInDemo(role: Role): Promise<User>;
  signOut(): void;
}

const AuthContext = createContext<AuthValue | null>(null);

// The API checks the email and password and returns a signed token, which is kept in the browser.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => { setUser(readSession()?.user || null); setReady(true); }, []);
  useEffect(() => {
    if (!user?.email) return;
    let active = true;
    const refresh = async () => {
      const current = readSession();
      if (!current) return;
      try {
        const fresh = await api<User>('/me');
        // Keep the same user object when nothing changed, so screens that depend on it do not reload every 30 seconds.
        if (active && readSession()?.token === current.token) {
          storeSession({ ...current, user: fresh });
          setUser((previous) => previous && JSON.stringify(previous) === JSON.stringify(fresh) ? previous : fresh);
        }
      } catch (error) {
        if (active && error instanceof ApiError && error.status === 401) { storeSession(null); setUser(null); }
      }
    };
    refresh();
    const timer = window.setInterval(refresh, 30000);
    return () => { active = false; window.clearInterval(timer); };
  }, [user?.email]);

  function begin(session: Session): User {
    storeSession(session);
    setUser(session.user);
    return session.user;
  }

  const value: AuthValue = {
    user,
    ready,
    signIn: (credentials) => api<Session>('/login', jsonOptions('POST', credentials)).then(begin),
    signUp: (details) => api<Session>('/signup', jsonOptions('POST', details)).then(begin),
    signInDemo: (role) => api<Session>('/demoLogin', jsonOptions('POST', { role })).then(begin),
    signOut() {
      storeSession(null);
      setUser(null);
    },
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider.');
  return value;
}
