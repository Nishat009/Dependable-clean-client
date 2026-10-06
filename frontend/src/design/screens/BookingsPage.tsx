import React from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '../Auth';
import BookingRow from '../components/BookingRow';
import ButtonLink from '../components/ButtonLink';
import EmptyState from '../components/EmptyState';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import { useRemote } from '../hooks/useRemote';
import type { Booking } from '../types';

export default function BookingsPage() {
  const { user } = useAuth();
  const { data: bookings, loading } = useRemote<Booking[]>(user ? '/bookingList' : null, []);
  const booked = useRouter().query.booked;
  return <>
    <PageHeading title={<>Your <em>bookings.</em></>} description="All your cleaning requests in one easy place." />
    {booked && <Notice message="Your booking request is in! We will be in touch to confirm the details." />}
    <div className="dashboard-section-head"><h2>All requests</h2><ButtonLink href="/book">Book another clean</ButtonLink></div>
    {bookings.length
      ? <div className="booking-list">{bookings.map((item) => <BookingRow key={item._id} booking={item} />)}</div>
      : !loading && <EmptyState title="No bookings yet" text="Your first fresh start is just a few clicks away." href="/book" />}
  </>;
}
