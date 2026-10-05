import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { AuthProvider, useAuth } from './Auth';
import { api } from './api';
import { setServices } from '../store';
import Home from './Home';
import { LoginPage, ServicesPage, BookingPage, DashboardPage, BookingsPage, ReviewPage, OrdersPage, AddServicePage, ManagePage, AddAdminPage } from './Pages';
import { Header } from './Layout';
import { useRevealObserver } from './Motion';

function Routes({ initialPath }) {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, ready } = useAuth();
  const path = (typeof window === 'undefined' ? initialPath : router.asPath).split('?')[0].replace(/\/$/, '') || '/';
  useRevealObserver(path);
  useEffect(() => {
    api('/services').then((data) => { if (Array.isArray(data)) dispatch(setServices(data)); }).catch(() => {});
  }, [dispatch]);
  let page;
  if (path === '/') page = <Home />;
  else if (path === '/login') page = <LoginPage />;
  else if (path === '/book') page = <ServicesPage />;
  else if (path.startsWith('/book/')) page = <BookingPage id={path.split('/')[2]} />;
  else if (!ready) page = <><Header /><main className="loading-screen"><span className="loading-spark">✳</span> Preparing your space…</main></>;
  else if (!user) {
    if (typeof window !== 'undefined') router.replace('/login?from=' + encodeURIComponent(path));
    page = <><Header /><main className="loading-screen">Taking you to sign in…</main></>;
  } else {
    const pages = { '/dashboard': <DashboardPage />, '/bookList': <BookingsPage />, '/addReview': <ReviewPage />, '/orderList': <OrdersPage />, '/addService': <AddServicePage />, '/addManage': <ManagePage />, '/addAdmin': <AddAdminPage /> };
    page = pages[path] || <Home />;
  }
  return <><Head><title>Dependable Clean — A fresh feeling for every space</title><meta name="description" content="Thoughtful cleaning services for spaces worth living in. Explore, book and manage your clean." /><meta name="viewport" content="width=device-width, initial-scale=1" /></Head>{page}</>;
}

export default function CleaningApp({ initialPath }) {
  return <AuthProvider><Routes initialPath={initialPath} /></AuthProvider>;
}
