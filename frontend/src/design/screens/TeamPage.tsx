import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import ConfirmModal from '../components/ConfirmModal';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PageHeading from '../components/PageHeading';
import PasswordInput from '../components/PasswordInput';
import StatusBadge from '../components/StatusBadge';
import { useRemote } from '../hooks/useRemote';
import type { TeamMember } from '../types';

interface AddResult { email: string; name: string; created: boolean; role: string }

// The super admin adds staff here. A teammate without an account gets one with the temporary password,
// so they can sign in straight away with that email and password. Staff can look at services, locations
// and reviews, but cannot change them or see orders.
export default function TeamPage() {
  const { user } = useAuth();
  const { data: team, refresh } = useRemote<TeamMember[]>('/admin', []);
  const [fields, setFields] = useState({ name: '', email: '', password: '' });
  const [pendingRemove, setPendingRemove] = useState<TeamMember | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setError(''); setNotice('');
    try {
      const result = await api<AddResult>('/addAdmin', jsonOptions('POST', fields));
      setNotice(result.created
        ? `${result.name} can now sign in as staff with ${result.email} and the temporary password you set.`
        : `${result.name || result.email} already had an account and is now staff. They sign in with their own password.`);
      setFields({ name: '', email: '', password: '' });
      refresh();
    } catch (cause) { setError(errorMessage(cause)); }
    finally { setBusy(false); }
  }

  async function remove(member: TeamMember) {
    await api('/deleteAdmin/' + encodeURIComponent(member.email), jsonOptions('DELETE'));
    setPendingRemove(null);
    setNotice(`${member.name || member.email} is no longer on the team.`);
    refresh();
  }

  return <>
    <PageHeading eyebrow="SUPER ADMIN TOOLS" title={<>Your <em>team.</em></>} description="Staff can see services, locations and who has written a review. They cannot approve reviews, change services or see orders." />
    <div className="form-card dashboard-form">
      <span className="eyebrow"><span className="eyebrow-dot" /> TEAM ACCESS</span>
      <h2>Add a staff member.</h2>
      <Notice message={notice} onClose={() => setNotice('')} />
      <Notice message={error} type="error" onClose={() => setError('')} />
      <form onSubmit={submit} className="stack-form">
        <label>Email address<input required type="email" autoComplete="off" value={fields.email} onChange={(event) => setFields({ ...fields, email: event.target.value })} placeholder="teammate@example.com" /></label>
        <div className="form-two">
          <label>Full name<input autoComplete="off" value={fields.name} onChange={(event) => setFields({ ...fields, name: event.target.value })} placeholder="Alex Morgan" /></label>
          <label>Temporary password<PasswordInput autoComplete="new-password" minLength={6} value={fields.password} onChange={(event) => setFields({ ...fields, password: event.target.value })} placeholder="At least 6 characters" /></label>
        </div>
        <small className="field-hint">Name and password are needed for someone new. If they already have an account, the email is enough.</small>
        <button className="button" type="submit" disabled={busy}><span>{busy ? 'Adding…' : 'Add staff member'}</span><Icon name="arrowUp" size={18} /></button>
      </form>
    </div>
    <div className="dashboard-section-head"><h2>Super admin and staff</h2><span className="result-count">{team.length} PEOPLE</span></div>
    <div className="admin-list">{team.map((member) => <div className="admin-row" key={member._id}>
      <span className="avatar">{(member.name || member.email).charAt(0).toUpperCase()}</span>
      <div className="row-main"><strong>{member.name || member.email}</strong><span>{member.email}{member.email === user?.email ? ' · You' : ''}</span></div>
      <StatusBadge status={member.role === 'superAdmin' ? 'Super admin' : member.hasAccount ? 'Staff' : 'No account'} />
      {member.role !== 'superAdmin' && member.email !== user?.email && <button className="icon-button danger" type="button" aria-label={'Remove ' + member.email} title="Remove staff access" onClick={() => setPendingRemove(member)}><Icon name="trash" size={18} /></button>}
    </div>)}</div>
    {pendingRemove && <ConfirmModal title="Remove from the team?" confirmLabel="Remove access" icon="users" onCancel={() => setPendingRemove(null)} onConfirm={() => remove(pendingRemove)}>
      <strong>{pendingRemove.name || pendingRemove.email}</strong> will lose staff access. Their account stays, as a customer.
    </ConfirmModal>}
  </>;
}
