import React, { useEffect, useState, type ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { setServices, useAppDispatch } from '../store';
import { api } from './api';
import { configureBusiness } from './data';
import { AuthProvider, useAuth } from './Auth';
import DashboardShell from './components/DashboardShell';
import Footer from './components/Footer';
import Header from './components/Header';
import { useRevealObserver } from './components/Motion';
import DashboardPage from './screens/DashboardPage';
import { allowed, findRoute } from './routes';
import { isManager, type Service } from './types';

function Routes({ initialPath }: { initialPath: string }) {
  const router = useRouter();
  const [, setBusinessReady] = useState(false);
  const [serviceError,setServiceError] = useState('');
  useEffect(() => { api<{ timezone: string; currency: string }>('/business').then(configureBusiness).finally(() => setBusinessReady(true)).catch(() => {}); }, []);
  const dispatch = useAppDispatch();
  const { user, ready } = useAuth();
  const path = (typeof window === 'undefined' ? initialPath : router.asPath).split(/[?#]/)[0].replace(/\/$/, '') || '/';
  const route = findRoute(path);
  const needsUser = route.access !== 'public';
  useRevealObserver(path);

  // Render built-in services immediately, then replace them with live data when the API answers.
  const seesAllServices = isManager(user?.role);
  useEffect(() => {
    let active = true;
    api<Service[]>(seesAllServices ? '/serviceList' : '/services').then((data) => { if (!active) return; if (Array.isArray(data)) dispatch(setServices(data)); setServiceError(''); }).catch(() => { if (active) setServiceError('Services are unavailable. Please refresh and try again.'); });
    return () => { active = false; };
  }, [dispatch, seesAllServices]);
  useEffect(() => {
    if (needsUser && ready && !user) router.replace('/login?from=' + encodeURIComponent(path));
  }, [needsUser, ready, user, path, router]);

  let content: ReactNode;
  if (!needsUser) content = route.render();
  // The server cannot see the browser's session, so it renders this light placeholder in the dashboard's own colors
  // instead of a dark screen that would flash before the dashboard appears.
  else if (!ready || !user) content = <div className="dashboard-page dashboard-loading" aria-busy="true"><span className="loading-spark">✳</span> {ready ? 'Taking you to sign in…' : 'Preparing your space…'}</div>;
  else content = <DashboardShell path={path}>
    {allowed(route.access, user.role) ? route.render() : <DashboardPage />}
  </DashboardShell>;

  return <>
    <Head>
      <title>Dependable Clean — A fresh feeling for every space</title>
      <meta name="description" content="Thoughtful cleaning services for spaces worth living in. Explore, book and manage your clean." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <Header />
    {serviceError && <div role="alert" className="notice notice-error">{serviceError}</div>}
    {content}
    {!needsUser && <Footer />}
  </>;
}

export default function CleaningApp({ initialPath }: { initialPath: string }) {
  return <AuthProvider><Routes initialPath={initialPath} /></AuthProvider>;
}
