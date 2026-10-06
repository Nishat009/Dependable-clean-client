import React, { useEffect, type ReactNode } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { setServices, useAppDispatch } from '../store';
import { api } from './api';
import { AuthProvider, useAuth } from './Auth';
import DashboardShell from './components/DashboardShell';
import Footer from './components/Footer';
import Header from './components/Header';
import { useRevealObserver } from './components/Motion';
import BookingPage from './screens/BookingPage';
import BookingsPage from './screens/BookingsPage';
import DashboardPage from './screens/DashboardPage';
import Home from './screens/Home';
import LocationsPage from './screens/LocationsPage';
import LoginPage from './screens/LoginPage';
import ManageServicesPage from './screens/ManageServicesPage';
import OrdersPage from './screens/OrdersPage';
import ReviewPage from './screens/ReviewPage';
import ReviewsAdminPage from './screens/ReviewsAdminPage';
import ServiceEditor from './screens/ServiceEditor';
import ServicesPage from './screens/ServicesPage';
import TeamPage from './screens/TeamPage';
import type { Service } from './types';

type Access = 'public' | 'customer' | 'admin';
interface Route { access: Access; render(): ReactNode }

// Dashboard screens need a signed-in user; admin screens also need the admin role.
function findRoute(path: string): Route {
  const [, first, second] = path.split('/');
  if (path === '/') return { access: 'public', render: () => <Home /> };
  if (path === '/login') return { access: 'public', render: () => <LoginPage /> };
  if (path === '/book') return { access: 'public', render: () => <ServicesPage /> };
  if (first === 'book' && second) return { access: 'public', render: () => <BookingPage id={second} /> };
  if (first === 'editService' && second) return { access: 'admin', render: () => <ServiceEditor key={second} id={second} /> };
  const customer: Record<string, () => ReactNode> = {
    '/dashboard': () => <DashboardPage />,
    '/bookList': () => <BookingsPage />,
    '/addReview': () => <ReviewPage />,
  };
  const admin: Record<string, () => ReactNode> = {
    '/orderList': () => <OrdersPage />,
    '/manageReviews': () => <ReviewsAdminPage />,
    '/addService': () => <ServiceEditor key="new" />,
    '/addManage': () => <ManageServicesPage />,
    '/locations': () => <LocationsPage />,
    '/addAdmin': () => <TeamPage />,
  };
  if (customer[path]) return { access: 'customer', render: customer[path] };
  if (admin[path]) return { access: 'admin', render: admin[path] };
  return { access: 'public', render: () => <Home /> };
}

function Routes({ initialPath }: { initialPath: string }) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, ready } = useAuth();
  const path = (typeof window === 'undefined' ? initialPath : router.asPath).split(/[?#]/)[0].replace(/\/$/, '') || '/';
  const route = findRoute(path);
  const needsUser = route.access !== 'public';
  useRevealObserver(path);

  useEffect(() => {
    api<Service[]>('/services').then((data) => { if (Array.isArray(data)) dispatch(setServices(data)); }).catch(() => {});
  }, [dispatch]);
  useEffect(() => {
    if (needsUser && ready && !user) router.replace('/login?from=' + encodeURIComponent(path));
  }, [needsUser, ready, user, path, router]);

  let content: ReactNode;
  if (!needsUser) content = route.render();
  // The server cannot see the browser's session, so it renders this light placeholder in the dashboard's own colors
  // instead of a dark screen that would flash before the dashboard appears.
  else if (!ready || !user) content = <div className="dashboard-page dashboard-loading" aria-busy="true"><span className="loading-spark">✳</span> {ready ? 'Taking you to sign in…' : 'Preparing your space…'}</div>;
  else content = <DashboardShell path={path}>
    {route.access === 'admin' && user.role !== 'admin' ? <DashboardPage /> : route.render()}
  </DashboardShell>;

  return <>
    <Head>
      <title>Dependable Clean — A fresh feeling for every space</title>
      <meta name="description" content="Thoughtful cleaning services for spaces worth living in. Explore, book and manage your clean." />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
    </Head>
    <Header />
    {content}
    {!needsUser && <Footer />}
  </>;
}

export default function CleaningApp({ initialPath }: { initialPath: string }) {
  return <AuthProvider><Routes initialPath={initialPath} /></AuthProvider>;
}
