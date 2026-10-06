import React, { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);
const storageKey = 'dependable-clean-user';

function readStoredUser() {
  try {
    const stored = JSON.parse(localStorage.getItem(storageKey) || 'null');
    return stored && stored.email ? stored : null;
  } catch {
    return null;
  }
}

function storeUser(user) {
  try {
    if (user) localStorage.setItem(storageKey, JSON.stringify(user));
    else localStorage.removeItem(storageKey);
  } catch {
    // The session still works for this page view when storage is blocked.
  }
}

// Sign-in is by name and email only, kept in the browser, until a real auth provider is added back.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setUser(readStoredUser());
    setReady(true);
  }, []);

  function signIn({ name, email }) {
    const nextUser = { name: name.trim() || 'Welcome back', email: email.trim().toLowerCase() };
    storeUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }

  function signInDemo(role) {
    if (process.env.NODE_ENV !== 'development') return;
    const nextUser = role === 'admin'
      ? { name: 'Alex Morgan', email: 'admin@dependableclean.demo', role: 'admin', demo: true }
      : { name: 'Jamie Rivera', email: 'guest@dependableclean.demo', role: 'customer', demo: true };
    storeUser(nextUser);
    setUser(nextUser);
    return nextUser;
  }

  async function signOut() {
    storeUser(null);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, signIn, signInDemo, signOut }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
