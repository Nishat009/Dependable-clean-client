import React, { createContext, useContext, useEffect, useState } from 'react';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import firebaseConfig from '../legacy/Components/Login/Login/firebase.config';

const AuthContext = createContext(null);
const storageKey = 'dependable-clean-demo-user';

function firebaseApp() {
  return firebase.apps.length ? firebase.app() : firebase.initializeApp(firebaseConfig);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stored = null;
    try {
      stored = JSON.parse(sessionStorage.getItem(storageKey) || 'null');
    } catch {
      sessionStorage.removeItem(storageKey);
    }
    if (stored && stored.email) setUser(stored);
    const unsubscribe = firebaseApp().auth().onAuthStateChanged((person) => {
      if (person) {
        setUser({ name: person.displayName || 'Welcome back', email: person.email, photoURL: person.photoURL || '' });
      } else if (!stored) {
        setUser(null);
      }
      setReady(true);
    }, () => setReady(true));
    return unsubscribe;
  }, []);

  async function signInWithGoogle() {
    const result = await firebaseApp().auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
    const person = result.user;
    const nextUser = { name: person.displayName || 'Welcome back', email: person.email, photoURL: person.photoURL || '' };
    setUser(nextUser);
    return nextUser;
  }

  function signInDemo(role) {
    if (process.env.NODE_ENV !== 'development') return;
    const nextUser = role === 'admin'
      ? { name: 'Alex Morgan', email: 'admin@dependableclean.demo', role: 'admin', demo: true }
      : { name: 'Jamie Rivera', email: 'guest@dependableclean.demo', role: 'customer', demo: true };
    sessionStorage.setItem(storageKey, JSON.stringify(nextUser));
    setUser(nextUser);
    setReady(true);
    return nextUser;
  }

  async function signOut() {
    sessionStorage.removeItem(storageKey);
    await firebaseApp().auth().signOut();
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, ready, signInWithGoogle, signInDemo, signOut }}>
    {children}
  </AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
