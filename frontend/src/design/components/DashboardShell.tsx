import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../Auth';
import Icon, { type IconName } from './Icon';

interface SideLink { href: string; label: string; icon: IconName }

const customerLinks: SideLink[] = [
  { href: '/dashboard', label: 'Overview', icon: 'grid' },
  { href: '/bookList', label: 'My bookings', icon: 'calendar' },
  { href: '/addReview', label: 'Write a review', icon: 'star' },
];
// Staff see these read-only; the super admin can also make changes on them.
const adminLinks: SideLink[] = [
  { href: '/dashboard', label: 'Overview', icon: 'home' },
  { href: '/manageReviews', label: 'Reviews', icon: 'message' },
  { href: '/addManage', label: 'Manage services', icon: 'grid' },
  { href: '/locations', label: 'Locations', icon: 'pin' },
];
// Only the super admin sees orders, adds services and manages the team.
const superAdminLinks: SideLink[] = [
  { href: '/orderList', label: 'Orders', icon: 'list' },
  { href: '/addService', label: 'Add service', icon: 'plus' },
  { href: '/addAdmin', label: 'Team', icon: 'users' },
];

interface DashboardShellProps {
  /** The current path. The content area remounts when it changes, so only the content animates in. */
  path: string;
  children: ReactNode;
}

// The sidebar and content frame shared by every dashboard screen. The app shell renders it once,
// so moving between screens does not remount the sidebar.
export default function DashboardShell({ path, children }: DashboardShellProps) {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const isAdmin = user?.role === 'admin' || user?.role === 'superAdmin' || user?.role === 'staff';
  const isSuperAdmin = user?.role === 'admin' || user?.role === 'superAdmin';
  const linkTo = (link: SideLink) => <Link key={link.href} href={link.href} className={'side-link' + (path === link.href || (link.href === '/addManage' && path.startsWith('/editService')) ? ' active' : '')}>
    <Icon name={link.icon} size={19} /><span>{link.label}</span>
  </Link>;

  return <div className="dashboard-page">
    <div className="dashboard-grid wrap">
      <aside className="dashboard-sidebar">
        {!isAdmin && <div className="sidebar-label">WORKSPACE</div>}
        <nav aria-label="Dashboard navigation">
          {user?.role === 'customer' && customerLinks.map(linkTo)}
          {!isAdmin && <Link href="/book" className={'side-link' + (path === '/book' || path.startsWith('/book/') ? ' active' : '')}><Icon name="sparkle" size={19} /><span>Explore services</span></Link>}
          {isAdmin && <><div className="sidebar-label">{isSuperAdmin ? 'ADMIN TOOLS' : 'STAFF VIEW'}</div>{adminLinks.map(linkTo)}{isSuperAdmin && superAdminLinks.map(linkTo)}</>}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">{(user?.name || 'G').charAt(0)}</div>
          <div><strong>{user?.name || 'Guest'}</strong><small>{isSuperAdmin ? 'Super admin' : isAdmin ? 'Staff' : 'Customer'}</small></div>
          <button type="button" aria-label="Sign out" title="Sign out" onClick={() => { signOut(); router.push('/'); }}><Icon name="logout" size={18} /></button>
        </div>
      </aside>
      <main className="dashboard-main" key={path}>
        {user?.demo && <div className="demo-banner"><Icon name="sparkle" size={16} /> Demo account · Anyone can use it, so please keep it to test data</div>}
        {children}
      </main>
    </div>
  </div>;
}
