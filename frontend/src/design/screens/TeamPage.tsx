import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import StatusBadge from '../components/StatusBadge';
import { useRemote } from '../hooks/useRemote';
import type { TeamMember } from '../types';

interface AddResult { email: string; name: string; created: boolean }

// Admins add teammates here. A teammate without an account gets one with the temporary password,
// so they can sign in straight away with that email and password.
export default function TeamPage() {
  const { user } = useAuth();
  const { data: team, refresh } = useRemote<TeamMember[]>('/admin', []);
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<AddResult>('/addAdmin', jsonOptions('POST', fields));
      setNotice(result.created
        ? `${result.name} can now sign in as an admin with ${result.email} and the temporary password you set.`
        : `${result.name || result.email} already had an account and is now an admin. They sign in with their own password.`);
      setFields({ name: '', email: '', password: '' });
      refresh();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function remove(member: TeamMember) {
    if (!window.confirm(`Remove admin access for ${member.name || member.email}? Their account stays, as a customer.`)) return;
    setError('');
    try { await api('/deleteAdmin/' + encodeURIComponent(member.email), jsonOptions('DELETE')); refresh(); }
    catch (cause) { setError(errorMessage(cause)); }
  }

  return <>
    <PageHeading eyebrow="ADMIN TOOLS" title={<>Your <em>team.</em></>} description="Give a trusted teammate access to the admin workspace." />
    <div className="form-card dashboard-form">
      <span className="eyebrow"><span className="eyebrow-dot" /> TEAM ACCESS</span>
      <h2>Add a teammate.</h2>
      <Notice message={notice} onClose={() => setNotice('')} />
      <Notice message={error} type="error" onClose={() => setError('')} />
      <form onSubmit={submit} className="stack-form">
        <label>Email address<input required type="email" autoComplete="off" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} placeholder="teammate@example.com" /></label>
        <div className="form-two">
          <label>Full name<input autoComplete="off" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="Alex Morgan" /></label>
          <label>Temporary password<input type="text" autoComplete="new-password" minLength={6} value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} placeholder="At least 6 characters" /></label>
        </div>
        <small className="field-hint">Name and password are needed for someone new. If they already have an account, the email is enough.</small>
        <button className="button" type="submit" disabled={busy}><span>{busy ? 'Adding…' : 'Add teammate'}</span><Icon name="arrowUp" size={18} /></button>
      </form>
    </div>
    <div className="dashboard-section-head"><h2>Current admins</h2><span className="result-count">{team.length} PEOPLE</span></div>
    <div className="admin-list">{team.map((member) => <div className="admin-row" key={member._id}>
      <span className="avatar">{(member.name || member.email).charAt(0).toUpperCase()}</span>
      <div className="row-main"><strong>{member.name || member.email}</strong><span>{member.email}{member.email === user?.email ? ' · You' : ''}</span></div>
      <StatusBadge status={member.hasAccount ? 'Active' : 'No account'} />
      {member.email !== user?.email && <button className="icon-button danger" type="button" aria-label={'Remove ' + member.email} title="Remove admin access" onClick={() => remove(member)}><Icon name="trash" size={18} /></button>}
    </div>)}</div>
  </>;
}
