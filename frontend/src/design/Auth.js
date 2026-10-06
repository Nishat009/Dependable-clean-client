import React, { createContext, useContext, useEffect, useState } from 'react';
import { api, jsonOptions, readSession, storeSession } from './api';

const AuthContext = createContext(null);

// The API checks the email and password and returns a signed token, which is kept in the browser.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const session = readSession();
    setUser(session?.user || null);
    setReady(true);
    if (!session) return;
    // Refresh the role in case an admin was added or removed since the last visit.
    api('/me').then((fresh) => {
      storeSession({ ...session, user: fresh });
      setUser(fresh);
    }).catch((error) => {
      if (error.status === 401) { storeSession(null); setUser(null); }
    });
  }, []);

  function begin(session) {
    storeSession(session);
    setUser(session.user);
    return session.user;
  }

  const signIn = ({ email, password }) => api('/login', jsonOptions('POST', { email, password })).then(begin);
  const signUp = ({ name, email, password }) => api('/signup', jsonOptions('POST', { name, email, password })).then(begin);
  const signInDemo = (role) => api('/demoLogin', jsonOptions('POST', { role })).then(begin);

  async function signOut() {
    storeSession(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, signIn, signUp, signInDemo, signOut }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
