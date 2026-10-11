import { businessConfig } from '../data';
import React from 'react';
import Link from 'next/link';
import { useAuth } from '../Auth';
import { useRemote } from '../hooks/useRemote';
import PageHeading from '../components/PageHeading';
import Notice from '../components/Notice';
import BookingRow from '../components/BookingRow';
import { isManager, type Booking, type Review } from '../types';
export default function DashboardPage() {
    const { user } = useAuth();
    const owner = isManager(user?.role), staff = user?.role === 'staff';
    const bookings = useRemote<Booking[]>(owner || staff ? '/orderList' : '/bookingList', []);
    const reviews = useRemote<Review[]>(owner ? '/reviewList' : null, []);
    const support = useRemote<{
        unread: number;
    }[]>('/support', []);
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: businessConfig.timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
    const upcoming = bookings.data.filter(b => !['completed', 'cancelled'].includes(b.status)).sort((a, b) => a.date.localeCompare(b.date));
    const tiles = owner ? [['Pending requests', bookings.data.filter(b => b.status === 'requested').length, '/orderList'], ['Upcoming jobs', upcoming.length, '/orderList'], ['Unassigned bookings', upcoming.filter(b => !b.staffEmail).length, '/orderList'], ['Pending reviews', reviews.data.filter(r => r.status === 'Pending').length, '/manageReviews'], ['Unread tickets', support.data.reduce((n, c) => n + c.unread, 0), '/support']] : staff ? [['Today’s jobs', upcoming.filter(b => b.date === today).length, '/jobs'], ['Upcoming schedule', upcoming.length, '/jobs'], ['Completed jobs', bookings.data.filter(b => b.status === 'completed').length, '/jobs'], ['Unread tickets', support.data.reduce((n, c) => n + c.unread, 0), '/support']] : [['Upcoming cleaning', upcoming.length, '/bookList'], ['Booking history', bookings.data.length, '/bookList'], ['Unread tickets', support.data.reduce((n, c) => n + c.unread, 0), '/support']];
    return <><PageHeading title={<>Hello, <em>{user?.name.split(' ')[0]}.</em></>} description="Your cleaning workspace. Booking requests await owner confirmation."/><Notice type="error" message={bookings.error || reviews.error || support.error}/>{bookings.loading ? <p>Loading your dashboard…</p> : <><div className="stat-grid">{tiles.map(([label, value, href]) => <Link className="team-stat" key={String(label)} href={String(href)}><span>{label}</span><strong>{value}</strong></Link>)}</div><h2>{staff ? 'Upcoming assigned jobs' : 'Upcoming cleaning'}</h2>{upcoming.slice(0, 5).map(b => <BookingRow key={b._id} booking={b}/>)}{!upcoming.length && <p>No upcoming cleaning jobs.</p>}</>}</>;
}
