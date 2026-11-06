import React, { type ReactNode } from 'react';
import ActivityPage from './screens/ActivityPage';
import BookingPage from './screens/BookingPage';
import BookingsPage from './screens/BookingsPage';
import BusinessPage from './screens/BusinessPage';
import DashboardPage from './screens/DashboardPage';
import Home from './screens/Home';
import LocationsPage from './screens/LocationsPage';
import LoginPage from './screens/LoginPage';
import ManageServicesPage from './screens/ManageServicesPage';
import OrdersPage from './screens/OrdersPage';
import ProfilePage from './screens/ProfilePage';
import ReviewPage from './screens/ReviewPage';
import ReviewsAdminPage from './screens/ReviewsAdminPage';
import ServiceEditor from './screens/ServiceEditor';
import ServicesPage from './screens/ServicesPage';
import SetupPage from './screens/SetupPage';
import SupportPage from './screens/SupportPage';
import TeamPage from './screens/TeamPage';
import WorkPage from './screens/WorkPage';
import { isManager, type Role } from './types';

// 'support' is every account (staff only see the tickets assigned to them); 'signedIn' is any account; 'customer' is customers only; 'staff' is anyone on the team; 'super_admin' is the owner and sub admins;
// 'owner' is the owner only.
export type Access = 'support' | 'public' | 'signedIn' | 'customer' | 'staff' | 'super_admin' | 'owner';
export interface Route { access: Access; render(): ReactNode }

export function allowed(access: Access, role: Role): boolean {
  const superAdmin = isManager(role);
  if (access === 'support') return role === 'customer' || role === 'staff' || superAdmin;
  if (access === 'customer') return role === 'customer';
  if (access === 'staff') return superAdmin || role === 'staff';
  if (access === 'super_admin') return superAdmin;
  if (access === 'owner') return role === 'super_admin' || role === 'admin';
  return true;
}

// Dashboard screens need a signed-in user. Team screens also need the right role.
export function findRoute(path: string): Route {
  const [, first, second] = path.split('/');
  if (path === '/home') return { access: 'public', render: () => <Home /> };
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
