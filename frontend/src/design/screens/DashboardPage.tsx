import React from 'react';
import Link from 'next/link';
import { useAuth } from '../Auth';
import BookingRow from '../components/BookingRow';
import ButtonLink from '../components/ButtonLink';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import { CountUp } from '../components/Motion';
import PageHeading from '../components/PageHeading';
import { useRemote } from '../hooks/useRemote';
import type { Booking } from '../types';

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: bookings } = useRemote<Booking[]>(user ? '/bookingList' : null, []);
  const upcoming = bookings.filter((item) => item.status !== 'Completed' && item.status !== 'Cancelled');
  return <>
    <PageHeading title={<>Welcome back, <em>{user?.name?.split(' ')[0] || 'friend'}.</em></>} description="A little overview of your cleaner, calmer space." />
    <div className="dashboard-welcome">
      <div>
        <span className="eyebrow"><span className="eyebrow-dot" /> YOUR NEXT FRESH START</span>
        <h2>A clean space is a good place to begin.</h2>
        <p>Make room for the moments that matter. We&apos;ll take care of the reset.</p>
        <ButtonLink href="/book">Book a clean</ButtonLink>
      </div>
      <span className="welcome-spark"><Icon name="sparkle" size={118} /></span>
    </div>
    <div className="stat-grid">
      <div><span>01 / BOOKING</span><strong><CountUp value={bookings.length} duration={900} /></strong><small>Total requests</small></div>
      <div><span>02 / UPCOMING</span><strong><CountUp value={upcoming.length} duration={900} /></strong><small>To look forward to</small></div>
      <div><span>03 / CARE</span><strong><CountUp value={100} suffix="%" /></strong><small>Made for your space</small></div>
    </div>
    <div className="dashboard-section-head">
      <div><span className="eyebrow"><span className="eyebrow-dot" /> ON THE HORIZON</span><h2>Your bookings</h2></div>
      <Link href="/bookList" className="text-link">View all <Icon name="arrow" size={18} /></Link>
    </div>
    {upcoming.length
      ? <div className="booking-list">{upcoming.slice(0, 2).map((item) => <BookingRow key={item._id} booking={item} />)}</div>
      : <EmptyState title="Your next fresh start awaits" text="Choose a service, pick your date, and let us handle the rest." href="/book" action="Explore services" />}
  </>;
}
