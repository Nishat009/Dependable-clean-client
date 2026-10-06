import React from 'react';
import { formatDate, formatMoney } from '../data';
import type { Booking } from '../types';
import Icon from './Icon';
import StatusBadge from './StatusBadge';

export default function BookingRow({ booking }: { booking: Booking }) {
  const place = [booking.locationName, booking.address].filter(Boolean).join(' · ') || 'Address to confirm';
  return <article className="booking-row">
    <div className="row-icon"><Icon name="sparkle" size={25} /></div>
    <div className="row-main"><strong>{booking.serviceName || 'Cleaning service'}</strong><span>{formatDate(booking.date)} <b>·</b> {place}</span></div>
    <StatusBadge status={booking.status} />
    <strong className="row-price">{formatMoney(booking.price)}</strong>
  </article>;
}
