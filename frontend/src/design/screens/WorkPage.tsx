import React, { useState, type ReactNode } from 'react';
import { api, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import { useAction } from '../hooks/useAction';
import { useEarliestBookingDate } from '../hooks/useEarliestBookingDate';
import { useRemote } from '../hooks/useRemote';
import ConfirmModal from '../components/ConfirmModal';
import DatePicker from '../components/DatePicker';
import { type IconName } from '../components/Icon';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Notice from '../components/Notice';
import SearchField from '../components/SearchField';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import { formatDate, formatMoney } from '../data';
import { isManager, type Booking, type TeamMember } from '../types';

// What the bookings page asks before an action. `field` adds a date or note the action needs, passed to `action`.
type BookingDialog = {
    title: string;
    text: ReactNode;
    confirmLabel: string;
    cancelLabel?: string;
    icon: IconName;
    tone?: 'danger' | 'primary';
    field?: 'date' | 'note';
    action(input: string): Promise<unknown>;
};
const bookingFilters =['all', 'requested', 'confirmed', 'assigned', 'in_progress', 'completed', 'cancelled']
    .map(status => ({ value: status, label: status === 'all' ? 'All statuses' : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ') }));
export default function WorkPage() {
    const { user } = useAuth();
    const owner = isManager(user?.role);
    const remote = useRemote<Booking[]>(user?.role === 'customer' ? '/bookingList' : '/orderList', []);
    const team = useRemote<TeamMember[]>(owner ? '/admin' : null, []);
    const [search, setSearch] = useState(''), [filter, setFilter] = useState('all'), [page, setPage] = useState(1);
    const { error, busy, run } = useAction(remote.refresh);
    const rows = remote.data.filter(row => (filter === 'all' || row.status === filter) && [row.serviceName, row.name, row.email, row.address, row.staffEmail].join(' ').toLowerCase().includes(search.toLowerCase()));
    const earliest = useEarliestBookingDate();
    const [dialog, setDialog] = useState<BookingDialog | null>(null), [input, setInput] = useState('');
    const ask = (next: BookingDialog) => { setInput(''); setDialog(next); };
    const patch = (row: Booking, body: unknown) => api('/updateOrderList/' + row._id, jsonOptions('PATCH', body));
    const update = (row: Booking, body: unknown) => run(() => patch(row, body));
    const job = (row: Booking) => <><strong>{row.serviceName}</strong> for {row.name} on {formatDate(row.date)}</>;
    const staffName = (email: string) => { const member = team.data.find(m => m.email === email); return member?.name || email; };
    return <><PageHeading title={<>{owner ? 'All bookings' : user?.role === 'staff' ? 'Your assigned jobs' : 'Your bookings'}</>} description="A request is confirmed only after the owner confirms it."/>
    <Notice type="error" message={error || remote.error || team.error}/>
    <div className="filter-bar"><SearchField label="Search" value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Service, customer or address"/><Select label="Status" value={filter} options={bookingFilters} onChange={value => { setFilter(value); setPage(1); }}/></div>
    {remote.loading && <p role="status">Loading bookings...</p>}
    {!remote.loading && !rows.length && <p>No matching bookings.</p>}
    <div className="admin-list">{rows.slice((page - 1) * 10, page * 10).map(row => <article className="form-card" key={row._id}>
      <h3>{row.serviceName} · {formatMoney(row.price)}</h3><StatusBadge status={row.status}/><p>{formatDate(row.date)} · {row.name} · {row.email}</p><p>{[row.locationName, row.thana, row.address].filter(Boolean).join(' · ')}</p>
      <details><summary>Booking details</summary><p>Reference: {row._id}</p><p>{row.phone}</p><p>{row.notes}</p><p>{row.scope?.details}</p><ul>{row.scope?.includes?.map(item => <li key={item}>{item}</li>)}</ul><p>Assigned staff: {row.staffEmail || 'Unassigned'}</p></details>
      {row.changeRequest && <p>Change requested: {row.changeRequest.type} {row.changeRequest.date}. Awaiting owner response.</p>}
      <div className="row-actions">
        {owner && row.status === 'requested' && <button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Confirm this cleaning request?', icon: 'check', tone: 'primary', confirmLabel: 'Confirm request',
            text: <>{job(row)}. The customer will see the booking as confirmed.</>, action: () => patch(row, { status: 'confirmed' }) })}>Confirm request</button>}
        {owner && ['confirmed', 'assigned'].includes(row.status) && <Select compact className="assign-select" ariaLabel="Assign staff" placeholder="Assign staff" disabled={busy} value={row.staffEmail || ''}
            options={team.data.filter(m => m.role === 'staff' && m.active && m.hasAccount).map(m => ({ value: m.email, label: m.name || m.email, hint: m.name ? m.email : undefined }))}
            onChange={email => { if (email && email !== row.staffEmail) ask({
            title: row.staffEmail ? 'Reassign this job?' : 'Assign this job?', icon: 'users', tone: 'primary', confirmLabel: 'Assign ' + staffName(email).split(' ')[0],
            text: <>{job(row)} goes to <strong>{staffName(email)}</strong>{row.staffEmail ? <>, instead of {staffName(row.staffEmail)}</> : null}.</>,
            action: () => patch(row, { staffEmail: email }) }); }}/>}
        {user?.role !== 'customer' && row.status === 'assigned' && <button disabled={busy} className="small-button" onClick={() => update(row, { status: 'in_progress' })}>Start job</button>}
        {user?.role !== 'customer' && row.status === 'in_progress' && <button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Mark this job completed?', icon: 'check', tone: 'primary', confirmLabel: 'Mark completed',
            text: <>{job(row)} will be marked as done.</>, action: () => patch(row, { status: 'completed' }) })}>Complete job</button>}
        {owner && ['requested', 'confirmed', 'assigned'].includes(row.status) && <button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Cancel this booking?', icon: 'close', confirmLabel: 'Cancel booking', cancelLabel: 'Keep booking',
            text: <>{job(row)} will be cancelled, and the customer will see it as cancelled.</>, action: () => patch(row, { status: 'cancelled' }) })}>Cancel</button>}
        {owner && row.changeRequest?.type === 'reschedule' && <button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Approve the new date?', icon: 'calendar', tone: 'primary', confirmLabel: 'Approve reschedule',
            text: <><strong>{row.serviceName}</strong> for {row.name} moves from {formatDate(row.date)} to <strong>{formatDate(row.changeRequest?.date)}</strong>.</>,
            action: () => patch(row, { approveReschedule: true }) })}>Approve reschedule</button>}
        {owner && row.changeRequest && <button disabled={busy} className="small-button" onClick={() => update(row, { clearChangeRequest: true })}>Mark request handled</button>}
        {user?.role === 'customer' && ['requested', 'confirmed', 'assigned'].includes(row.status) && <><button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Ask to cancel this booking?', icon: 'close', confirmLabel: 'Send request', cancelLabel: 'Keep booking',
            text: <>We will ask the owner to cancel <strong>{row.serviceName}</strong> on {formatDate(row.date)}. It stays booked until they respond.</>,
            action: () => api('/bookings/' + row._id + '/request', jsonOptions('POST', { type: 'cancellation' })) })}>Request cancellation</button>
          <button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Pick a new date', icon: 'calendar', tone: 'primary', confirmLabel: 'Send request', field: 'date',
            text: <>Choose a new day for <strong>{row.serviceName}</strong>, at least three days ahead. The owner confirms the change.</>,
            action: date => api('/bookings/' + row._id + '/request', jsonOptions('POST', { type: 'reschedule', date })) })}>Request reschedule</button></>}
        {user?.role !== 'customer' && row.status !== 'completed' && <button disabled={busy} className="small-button" onClick={() => ask({
            title: 'Add an internal note', icon: 'message', tone: 'primary', confirmLabel: 'Save note', field: 'note',
            text: <>For {job(row)}. Only the team can see it.</>, action: internalNote => patch(row, { internalNote: internalNote.trim() }) })}>Add internal note</button>}
      </div>
      {row.internalNotes?.map((n, i) => <p key={i}><small>{n.createdAt} · {n.author}</small><br />{n.text}</p>)}
      {user?.role !== 'customer' && row.status === 'completed' && <p><small>This job is completed, so internal notes are closed.</small></p>}
    </article>)}</div>
    <Pagination page={page} pageSize={10} total={rows.length} noun="bookings" onChange={setPage} />
    {dialog && <ConfirmModal title={dialog.title} icon={dialog.icon} tone={dialog.tone} confirmLabel={dialog.confirmLabel} cancelLabel={dialog.cancelLabel}
      confirmDisabled={Boolean(dialog.field) && !input.trim()} onCancel={() => setDialog(null)}
      onConfirm={async () => { await dialog.action(input); setDialog(null); remote.refresh(); }}
      body={dialog.field === 'date' ? <DatePicker label="New date" required min={earliest || undefined} value={input} onChange={setInput} placeholder="Choose a day"/>
        : dialog.field === 'note' ? <label className="modal-field"><span className="field-label">Note</span><textarea rows={4} maxLength={1000} value={input} onChange={e => setInput(e.target.value)} placeholder="e.g. Customer asked us to use the side entrance"/></label>
        : undefined}>
      {dialog.text}
    </ConfirmModal>}
  </>;
}
