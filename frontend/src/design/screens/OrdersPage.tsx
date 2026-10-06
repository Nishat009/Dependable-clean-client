import React, { useState } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatMoney } from '../data';
import { useRemote } from '../hooks/useRemote';
import { bookingStatuses, type Booking, type BookingStatus } from '../types';

export default function OrdersPage() {
  const { data: orders, loading, refresh } = useRemote<Booking[]>('/orderList', []);
  const [error, setError] = useState('');

  async function update(id: string, status: BookingStatus) {
    try { await api('/updateOrderList/' + id, jsonOptions('PATCH', { status })); refresh(); }
    catch (cause) { setError(errorMessage(cause)); }
  }

  return <>
    <PageHeading eyebrow="ADMIN TOOLS" title={<>All <em>orders.</em></>} description="See and manage cleaning requests across your team." />
    <Notice message={error} type="error" onClose={() => setError('')} />
    <div className="dashboard-section-head"><h2>Recent requests</h2><span className="result-count">{orders.length} ORDERS</span></div>
    {orders.length ? <div className="admin-list">{orders.map((item) => <article className="admin-row" key={item._id}>
      <div className="row-icon"><Icon name="calendar" size={22} /></div>
      <div className="row-main">
        <strong>{item.serviceName || 'Cleaning service'} <span className="row-price-inline">{formatMoney(item.price)}</span></strong>
        <span>{item.name || item.email} · {formatDate(item.date)}</span>
        <small>{[item.locationName, item.address].filter(Boolean).join(' · ')}</small>
        {item.notes && <small className="row-note">“{item.notes}”</small>}
      </div>
      <StatusBadge status={item.status} />
      <select aria-label={'Status for ' + item.serviceName} value={item.status || 'Pending'} onChange={(event) => update(item._id, event.target.value as BookingStatus)}>
        {bookingStatuses.map((status) => <option key={status}>{status}</option>)}
      </select>
    </article>)}</div> : !loading && <EmptyState title="No requests yet" text="New cleaning requests will appear here." />}
  </>;
}
