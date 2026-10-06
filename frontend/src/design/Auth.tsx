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

  useEffect(() => {
    const session = readSession();
    setUser(session?.user || null);
    setReady(true);
    if (!session) return;
    // Refresh the role in case an admin was added or removed since the last visit.
    api<User>('/me').then((fresh) => {
      storeSession({ ...session, user: fresh });
      setUser(fresh);
    }).catch((error: unknown) => {
      if (error instanceof ApiError && error.status === 401) { storeSession(null); setUser(null); }
    });
  }, []);

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
