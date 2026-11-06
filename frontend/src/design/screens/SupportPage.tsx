import React, { useEffect, useState } from 'react';
import { api, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import { useAction } from '../hooks/useAction';
import { useRemote } from '../hooks/useRemote';
import PageHeading from '../components/PageHeading';
import Notice from '../components/Notice';
import Select from '../components/Select';
import StatusBadge from '../components/StatusBadge';
import { ChatBubble, messageAuthor } from '../components/SupportChat';
import { isManager, type SupportMessage, type SupportTicket, type TeamMember } from '../types';

const ticketFilters = [{ value: 'all', label: 'All tickets' }, { value: 'open', label: 'Open' }, { value: 'resolved', label: 'Resolved' }, { value: 'unassigned', label: 'Unassigned' }];
export default function SupportPage() {
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
