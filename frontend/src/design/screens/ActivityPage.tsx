import React, { useState } from 'react';
import { useRemote } from '../hooks/useRemote';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import Notice from '../components/Notice';
import SearchField from '../components/SearchField';
import { businessConfig, formatDate, formatMoney } from '../data';

export default function ActivityPage() {
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
