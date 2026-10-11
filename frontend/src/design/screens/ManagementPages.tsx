import { businessConfig } from '../data';
import React, { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { useRouter } from 'next/router';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
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
import { ChatBubble, messageAuthor } from '../components/SupportChat';
import { isManager, type Booking, type SupportMessage, type SupportTicket, type TeamMember } from '../types';
function useAction(refresh: () => void) {
    const [error, setError] = useState(''), [busy, setBusy] = useState(false);
    const run = async (action: () => Promise<unknown>) => { setBusy(true); setError(''); try {
        await action();
        refresh();
    }
    catch (e) {
        setError(errorMessage(e));
    }
    finally {
        setBusy(false);
    } };
    return { error, busy, run };
}
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
export function WorkPage() {
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
const ticketFilters = [{ value: 'all', label: 'All tickets' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'unassigned', label: 'Unassigned' }];
export function SupportPage() {
    const { user } = useAuth();
    const owner = isManager(user?.role), customer = user?.role === 'customer';
    const remote = useRemote<SupportTicket[]>('/support', []);
    const team = useRemote<TeamMember[]>(owner ? '/admin' : null, []);
    const [selected, setSelected] = useState(''), [text, setText] = useState(''), [filter, setFilter] = useState('all');
    const history = useRemote<SupportMessage[]>(selected ? '/support/' + selected + '/messages' : null, []);
    const { error, busy, run } = useAction(() => { remote.refresh(); history.refresh(); });
    useEffect(() => { const timer = window.setInterval(() => { remote.refresh(); history.refresh(); }, 10000); return () => window.clearInterval(timer); }, [remote.refresh, history.refresh]);
    // A customer has a single ticket, so it opens straight away.
    useEffect(() => { if (customer && !selected && remote.data[0]) setSelected(remote.data[0]._id); }, [customer, selected, remote.data]);
    const ticket = remote.data.find(c => c._id === selected);
    const rows = remote.data.filter(c => filter === 'all' || (filter === 'unassigned' ? !c.staffEmail : c.status === filter));
    const staffOptions = [{ value: '', label: 'Unassigned' }, ...team.data.filter(m => m.role === 'staff' && m.active && m.hasAccount).map(m => ({ value: m.email, label: m.name || m.email, hint: m.name ? m.email : undefined }))];
    const patch = (body: unknown) => run(() => api('/support/' + selected, jsonOptions('PATCH', body)));
    const description = owner ? 'Every customer chat. Assign a ticket to a staff member to have them answer it.' : customer ? 'Chat with our team. We reply here, usually within the day.' : 'Customer tickets the owner has assigned to you.';
    return <><PageHeading title={<>Ticket support</>} description={description}/><Notice type="error" message={error || remote.error || history.error || team.error}/>
    {customer && !remote.loading && !remote.data.length && <button disabled={busy} className="button" onClick={() => run(async () => { const c = await api<SupportTicket>('/support', jsonOptions('POST')); setSelected(c._id); })}>Start a conversation</button>}
    {!customer && <div className="filter-bar"><Select label="Show" value={filter} options={ticketFilters} onChange={setFilter}/></div>}
    {remote.loading && <p>Loading tickets...</p>}{!remote.loading && !customer && !rows.length && <p>{owner ? 'No tickets here.' : 'No tickets are assigned to you yet.'}</p>}
    {!customer && <div className="admin-list ticket-list">{rows.map(c => <button className="admin-row ticket-row" key={c._id} onClick={() => setSelected(c._id)} aria-pressed={selected === c._id}>
      <span className="row-main"><strong>{c.name}</strong><small>{c.email}{owner && <> · {c.staffName ? 'Assigned to ' + c.staffName : 'Unassigned'}</>}</small></span>
      {c.unread > 0 && <span className="ticket-unread">{c.unread} unread</span>}
      <StatusBadge status={c.status}/>
    </button>)}</div>}
    {selected && <div className="form-card ticket-thread">
      <div className="ticket-thread-head"><h2>{customer ? 'Your conversation' : ticket?.name || 'Messages'}</h2>{ticket && <StatusBadge status={ticket.status}/>}</div>
      {!customer && ticket && <div className="row-actions">
        {owner && <Select compact className="assign-select" ariaLabel="Assign staff" placeholder="Assign staff" disabled={busy} value={ticket.staffEmail || ''} options={staffOptions}
            onChange={email => { if (email !== (ticket.staffEmail || '')) patch({ staffEmail: email }); }}/>}
        <button disabled={busy} className="small-button" onClick={() => patch({ status: ticket.status === 'resolved' ? 'open' : 'resolved' })}>{ticket.status === 'resolved' ? 'Reopen ticket' : 'Mark resolved'}</button>
      </div>}
      {history.loading && !history.data.length && <p>Loading messages...</p>}{!history.loading && !history.data.length && <p>{customer ? 'Send us a message below.' : 'No messages yet.'}</p>}
      <div className="chat-messages">{history.data.map(m => <ChatBubble key={m._id} message={m} mine={m.author === user?.email} name={messageAuthor(m, user?.email, ticket)}/>)}</div>
      <form className="stack-form" onSubmit={e => { e.preventDefault(); run(async () => { await api('/support/' + selected + '/messages', jsonOptions('POST', { text })); setText(''); }); }}><label>Message<textarea required maxLength={2000} value={text} onChange={e => setText(e.target.value)}/></label><button disabled={busy} className="button">Send message</button></form>
    </div>}
  </>;
}
export function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || ''), [phone, setPhone] = useState(''), [saved, setSaved] = useState(false);
    const profile = useRemote<{
        name: string;
        phone: string;
    }>('/profile', { name: user?.name || '', phone: '' });
    useEffect(() => { setName(profile.data.name); setPhone(profile.data.phone); }, [profile.data]);
    const { error, busy, run } = useAction(() => setSaved(true));
    return <><PageHeading title={<>Your profile</>}/><Notice type="error" message={error}/>{saved && <p>Profile saved. Your updated name appears after signing in again.</p>}<form className="form-card stack-form" onSubmit={e => { e.preventDefault(); run(() => api('/profile', jsonOptions('PATCH', { name, phone }))); }}><p>{user?.email}</p><label>Name<input required value={name} onChange={e => setName(e.target.value)}/></label><label>Phone<input value={phone} onChange={e => setPhone(e.target.value)}/></label><button className="button" disabled={busy}>Save profile</button></form></>;
}
type Business = {
    email: string;
    phone: string;
    faq: string;
    cancellationPolicy: string;
    offers: string;
    timezone: string;
    currency: string;
};
export function BusinessPage() {
    const remote = useRemote<Business>('/business', { email: '', phone: '', faq: '', cancellationPolicy: '', offers: '', timezone: '', currency: '' });
    const [fields, setFields] = useState(remote.data);
    useEffect(() => setFields(remote.data), [remote.data]);
    const { error, busy, run } = useAction(remote.refresh);
    return <><PageHeading title={<>Business content</>} description="Publish your actual contact details, FAQ, cancellation policy and offers. Leave unconfirmed content blank."/><Notice type="error" message={error || remote.error}/><form className="form-card stack-form" onSubmit={e => { e.preventDefault(); run(() => api('/business', jsonOptions('PATCH', fields))); }}>{(['email', 'phone', 'faq', 'cancellationPolicy', 'offers'] as const).map(key => <label key={key}>{key}<textarea value={typeof fields[key] === 'string' ? fields[key] : ''} onChange={e => setFields({ ...fields, [key]: e.target.value })}/></label>)}<p>Timezone: {fields.timezone} · Currency: {fields.currency}</p><button disabled={busy} className="button">Save content</button></form></>;
}
export function ActivityPage() {
    const remote = useRemote<{
        actor: string;
        action: string;
        target: string;
        createdAt: string;
    }[]>('/activity', []);
    const report = useRemote<{
        bookings: number;
        bookingValue: number;
        recordedPayments: number;
    }>('/reports', { bookings: 0, bookingValue: 0, recordedPayments: 0 });
    const [page, setPage] = useState(1), [search, setSearch] = useState('');
    const rows = remote.data.filter(r => [r.actor, r.action, r.target].join(' ').toLowerCase().includes(search.toLowerCase()));
    const first = (page - 1) * ACTIVITY_PAGE_SIZE;
    const tiles: [string, string, string][] = [
        ['BOOKINGS', String(report.data.bookings), 'All booking requests'],
        ['BOOKING VALUE', formatMoney(report.data.bookingValue), 'Total of booked prices'],
        ['RECORDED PAYMENTS', formatMoney(report.data.recordedPayments), 'Payments marked as received'],
    ];
    return <><PageHeading title={<>Reports and activity</>} description="Business totals, and who changed what in the dashboard."/><Notice type="error" message={remote.error || report.error}/>
        <div className="stat-grid">{tiles.map(([label, value, note]) => <div key={label}><span>{label}</span><strong>{report.loading ? '—' : value}</strong><small>{note}</small></div>)}</div>
        <SearchField className="list-search" ariaLabel="Search activity" placeholder="Search by person, action or item" value={search} onChange={value => { setSearch(value); setPage(1); }}/>
        {remote.loading ? <p>Loading activity…</p> : !rows.length ? <div className="empty-state"><h3>{search ? 'Nothing matches' : 'No activity yet'}</h3><p>{search ? `No activity matches “${search}”.` : 'Changes made in the dashboard will be listed here.'}</p></div> : <div className="data-table-card">
            <table className="data-table">
                <thead><tr><th scope="col">When</th><th scope="col">Person</th><th scope="col">Action</th><th scope="col">Item</th></tr></thead>
                <tbody>{rows.slice(first, first + ACTIVITY_PAGE_SIZE).map((r, i) => <tr key={first + i}>
                    <td data-label="When"><time dateTime={r.createdAt}>{formatDate(r.createdAt)}<small>{formatTime(r.createdAt)}</small></time></td>
                    <td data-label="Person" className="data-table-strong">{r.actor}</td>
                    <td data-label="Action"><span className={'action-pill action-' + actionTone(r.action)}>{r.action}</span></td>
                    <td data-label="Item" className={/^[a-f0-9]{24}$/i.test(r.target) ? 'data-table-id' : undefined}>{r.target || '—'}</td>
                </tr>)}</tbody>
            </table>
            <Pagination className="data-table-foot" page={page} pageSize={ACTIVITY_PAGE_SIZE} total={rows.length} noun="entries" onChange={setPage}/>
        </div>}</>;
}
const ACTIVITY_PAGE_SIZE = 20;
// Colors an activity by its last word, e.g. "booking updated".
function actionTone(action: string) {
    const verb = action.trim().split(' ').pop() || '';
    if (/created|added|invited|approved|published/.test(verb)) return 'add';
    if (/deleted|removed|cancelled|rejected|revoked|disabled/.test(verb)) return 'remove';
    return 'change';
}
function formatTime(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: businessConfig.timezone });
}
export function SetupPage() {
    const router = useRouter();
    const [password, setPassword] = useState(''), [done, setDone] = useState(false);
    const { error, busy, run } = useAction(() => setDone(true));
    return <main className="public-page wrap"><h1>Set up your staff account</h1><Notice type="error" message={error}/>{done ? <p>Password set. <a href="/login">Sign in</a> to open your dashboard.</p> : <form className="form-card stack-form" onSubmit={(e: FormEvent) => { e.preventDefault(); run(() => api('/setupAccount', jsonOptions('POST', { token: router.query.token, password }))); }}><label>Your password<input type="password" required minLength={12} maxLength={200} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/></label><button disabled={busy} className="button">Set password</button></form>}</main>;
}
