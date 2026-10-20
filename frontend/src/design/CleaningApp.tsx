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
import { WorkPage, SupportPage, ProfilePage, BusinessPage, ActivityPage, SetupPage } from './screens/ManagementPages';
import TeamPage from './screens/TeamPage';
import { isManager, type Role, type Service } from './types';

// 'support' is every account (staff only see the tickets assigned to them); 'signedIn' is any account; 'customer' is customers only; 'staff' is anyone on the team; 'super_admin' is the owner and sub admins;
// 'owner' is the owner only.
type Access = 'support' | 'public' | 'signedIn' | 'customer' | 'staff' | 'super_admin' | 'owner';
interface Route { access: Access; render(): ReactNode }

function allowed(access: Access, role: Role): boolean {
  const superAdmin = isManager(role);
  if (access === 'support') return role === 'customer' || role === 'staff' || superAdmin;
  if (access === 'customer') return role === 'customer';
  if (access === 'staff') return superAdmin || role === 'staff';
  if (access === 'super_admin') return superAdmin;
  if (access === 'owner') return role === 'super_admin' || role === 'admin';
  return true;
}

// Dashboard screens need a signed-in user. Team screens also need the right role.
function findRoute(path: string): Route {
  const [, first, second] = path.split('/');
  if (path === '/') return { access: 'public', render: () => <Home /> };
  if (path === '/setup') return { access: 'public', render: () => <SetupPage /> };
  if (path === '/support') return { access: 'support', render: () => <SupportPage /> };
  if (path === '/profile') return { access: 'signedIn', render: () => <ProfilePage /> };
  if (path === '/jobs') return { access: 'staff', render: () => <WorkPage /> };
  if (path === '/business') return { access: 'super_admin', render: () => <BusinessPage /> };
  if (path === '/activity') return { access: 'super_admin', render: () => <ActivityPage /> };
  if (path === '/manageReviews') return { access: 'super_admin', render: () => <ReviewsAdminPage /> };
  if (path === '/login') return { access: 'public', render: () => <LoginPage /> };
  if (path === '/book') return { access: 'customer', render: () => <ServicesPage /> };
  if (first === 'book' && second) return { access: 'customer', render: () => <BookingPage id={second} /> };
  if (first === 'editService' && second) return { access: 'super_admin', render: () => <ServiceEditor key={second} id={second} /> };
  if (path === '/dashboard') return { access: 'signedIn', render: () => <DashboardPage /> };
  const customer: Record<string, () => ReactNode> = {
    '/bookList': () => <BookingsPage />,
    '/addReview': () => <ReviewPage />,
  };
  // Staff can look at these; the screens hide the controls that only the super admin may use.
  const team: Record<string, () => ReactNode> = {
    '/manageReviews': () => <ReviewsAdminPage />,
    '/addManage': () => <ManageServicesPage />,
    '/locations': () => <LocationsPage />,
  };
  const superAdmin: Record<string, () => ReactNode> = {
    '/orderList': () => <OrdersPage />,
    '/addService': () => <ServiceEditor key="new" />,
  };
  if (customer[path]) return { access: 'customer', render: customer[path] };
  if (team[path]) return { access: 'staff', render: team[path] };
  if (superAdmin[path]) return { access: 'super_admin', render: superAdmin[path] };
  if (path === '/addAdmin') return { access: 'owner', render: () => <TeamPage /> };
  return { access: 'public', render: () => <Home /> };
}

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
