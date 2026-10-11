import React, { type ReactNode } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../Auth';
import Icon from './Icon';
import { isManager } from '../types';
export default function DashboardShell({ path, children }: {
    path: string;
    children: ReactNode;
}) {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const role = user?.role;
    const links = [['/dashboard', 'Overview'], ...(isManager(role) ? [['/orderList', 'Bookings'], ['/addManage', 'Services'], ['/locations', 'Service areas'], ['/manageReviews', 'Reviews'], ...(role === 'sub_admin' ? [] : [['/addAdmin', 'Team']]), ['/business', 'Business content'], ['/activity', 'Reports and activity']] : role === 'staff' ? [['/jobs', 'Jobs and schedule'], ['/addManage', 'Services'], ['/locations', 'Service areas']] : [['/bookList', 'My bookings'], ['/book', 'Request cleaning'], ['/addReview', 'Write a review']]), ['/support', 'Ticket support'], ['/profile', 'Profile']];
    return <div className="dashboard-page"><div className="dashboard-grid wrap"><aside className="dashboard-sidebar"><div className="sidebar-label">{role === 'super_admin' ? 'BUSINESS OWNER' : role === 'sub_admin' ? 'SUB ADMIN' : role === 'staff' ? 'STAFF' : 'YOUR WORKSPACE'}</div><nav aria-label="Dashboard navigation">{links.map(([href, label]) => <Link key={href} href={href} className={'side-link' + (path === href || (href === '/addManage' && (path.startsWith('/editService/') || path === '/addService')) || (href === '/book' && path.startsWith('/book/')) ? ' active' : '')} aria-current={path === href ? 'page' : undefined}><Icon name="grid" size={19}/><span>{label}</span></Link>)}</nav><div className="sidebar-profile"><div className="avatar">{user?.name.charAt(0)}</div><div><strong>{user?.name}</strong><small>{role?.replace('_', ' ')}</small></div><button aria-label="Sign out" onClick={() => { signOut(); router.push('/'); }}><Icon name="logout" size={18}/></button></div></aside><main className="dashboard-main" key={path}>{user?.demo && <div className="demo-banner">Demo account · Use test data only</div>}{children}</main></div></div>;
}
