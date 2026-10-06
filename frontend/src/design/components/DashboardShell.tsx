import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../Auth';
import Icon, { type IconName } from './Icon';

interface SideLink { href: string; label: string; icon: IconName }

const customerLinks: SideLink[] = [
  { href: '/dashboard', label: 'Overview', icon: 'grid' },
  { href: '/book', label: 'Explore services', icon: 'sparkle' },
  { href: '/bookList', label: 'My bookings', icon: 'calendar' },
  { href: '/addReview', label: 'Write a review', icon: 'star' },
];
const adminLinks: SideLink[] = [
  { href: '/orderList', label: 'Orders', icon: 'list' },
  { href: '/manageReviews', label: 'Reviews', icon: 'message' },
  { href: '/addService', label: 'Add service', icon: 'plus' },
  { href: '/addManage', label: 'Manage services', icon: 'grid' },
  { href: '/locations', label: 'Locations', icon: 'pin' },
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
  const isAdmin = user?.role === 'admin';
  const linkTo = (link: SideLink) => <Link key={link.href} href={link.href} className={'side-link' + (path === link.href || (link.href === '/addManage' && path.startsWith('/editService')) ? ' active' : '')}>
    <Icon name={link.icon} size={19} /><span>{link.label}</span>
  </Link>;

  return <div className="dashboard-page">
    <div className="dashboard-grid wrap">
      <aside className="dashboard-sidebar">
        <div className="sidebar-label">WORKSPACE</div>
        <nav aria-label="Dashboard navigation">
          {customerLinks.map(linkTo)}
          {isAdmin && <><div className="sidebar-divider" /><div className="sidebar-label">ADMIN TOOLS</div>{adminLinks.map(linkTo)}</>}
        </nav>
        <div className="sidebar-profile">
          <div className="avatar">{(user?.name || 'G').charAt(0)}</div>
          <div><strong>{user?.name || 'Guest'}</strong><small>{isAdmin ? 'Administrator' : 'Member'}</small></div>
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
