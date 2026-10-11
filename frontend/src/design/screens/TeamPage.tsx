import React, { useState, type FormEvent } from 'react';
import { api, errorMessage, jsonOptions } from '../api';
import { useRemote } from '../hooks/useRemote';
import Icon from '../components/Icon';
import PageHeading from '../components/PageHeading';
import Pagination from '../components/Pagination';
import PasswordInput from '../components/PasswordInput';
import SearchField from '../components/SearchField';
import Select from '../components/Select';
import ConfirmModal from '../components/ConfirmModal';
import Notice from '../components/Notice';
import type { Role, TeamMember } from '../types';

type NewMember = { name: string; email: string; password: string; role: 'staff' | 'sub_admin' };
const emptyMember: NewMember = { name: '', email: '', password: '', role: 'staff' };
const roleOptions = [
    { value: 'staff', label: 'Staff', hint: 'Sees and works on the jobs assigned to them' },
    { value: 'sub_admin', label: 'Sub admin', hint: 'Manages bookings and assigns staff' },
];
const roleLabels: Partial<Record<Role, string>> = { super_admin: 'Owner', sub_admin: 'Sub admin', staff: 'Staff' };
const isTeamRole = (role?: Role) => role === 'staff' || role === 'sub_admin';

// Checked here before sending, so mistakes show under the field instead of coming back from the server.
// The email rule is stricter than the browser's own, which accepts addresses without a domain ending such as "a@b".
const nameProblem = (name: string) => {
    const value = name.trim();
    if (!value) return 'Enter their name.';
    if (value.includes('@')) return 'Enter their name here, not an email address.';
    if (!/\p{L}/u.test(value)) return 'A name needs at least one letter.';
    if (value.length < 2) return 'Enter their full name.';
    return '';
};
const emailProblem = (email: string) => {
    const value = email.trim();
    if (!value) return 'Enter their email address.';
    return /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)*\.[a-z]{2,}$/i.test(value) ? '' : 'Enter a full email address, like name@example.com.';
};
const passwordProblem = (password: string) => !password ? 'Set a password for them.' : password.length < 12 ? `Use at least 12 characters (${password.length} so far).` : password.length > 200 ? 'Use 200 characters or fewer.' : '';

export default function TeamPage() {
    const remote = useRemote<TeamMember[]>('/admin', []);
    const [fields, setFields] = useState<NewMember>(emptyMember), [checked, setChecked] = useState(false), [notice, setNotice] = useState('');
    const [error, setError] = useState(''), [busy, setBusy] = useState(false), [search, setSearch] = useState(''), [page, setPage] = useState(1);
    const [toggling, setToggling] = useState<TeamMember | null>(null), [renaming, setRenaming] = useState<TeamMember | null>(null), [newName, setNewName] = useState('');
    const problems = { name: nameProblem(fields.name), email: emailProblem(fields.email), password: passwordProblem(fields.password) };
    const set = <K extends keyof NewMember>(key: K, value: NewMember[K]) => setFields(current => ({ ...current, [key]: value }));
    // Errors show once they try to submit, then update as they type.
    const fieldError = (key: keyof typeof problems) => checked && problems[key] ? <small className="field-error" role="alert">{problems[key]}</small> : null;

    async function add(event: FormEvent) {
        event.preventDefault();
        setChecked(true); setError(''); setNotice('');
        if (problems.name || problems.email || problems.password) return;
        setBusy(true);
        try {
            const added = await api<{ email: string; name: string; role: string }>('/addAdmin', jsonOptions('POST', { ...fields, name: fields.name.trim(), email: fields.email.trim() }));
            setNotice(`${added.name} can now sign in as ${added.role === 'sub_admin' ? 'a sub admin' : 'staff'} with ${added.email} and the password you set.`);
            setFields(emptyMember); setChecked(false);
            remote.refresh();
        } catch (cause) { setError(errorMessage(cause)); }
        finally { setBusy(false); }
    }

    const rows = remote.data.filter(m => [m.name, m.email].join(' ').toLowerCase().includes(search.toLowerCase()));
    return <><PageHeading title={<>Your team</>} description="Add staff with a password you set, so they can sign in straight away. Deactivation immediately blocks protected access and preserves job history."/>
        <Notice message={notice} onClose={() => setNotice('')}/>
        <Notice type="error" message={error || remote.error} onClose={() => setError('')}/>
        <form className="form-card stack-form" noValidate onSubmit={add}>
            <div className="form-two">
                <label>Full name<input maxLength={80} autoComplete="off" placeholder="e.g. Nishat Raihana" aria-invalid={Boolean(checked && problems.name)} value={fields.name} onChange={e => set('name', e.target.value)}/>{fieldError('name')}</label>
                <label>Email address<input type="email" maxLength={200} autoComplete="off" placeholder="name@example.com" aria-invalid={Boolean(checked && problems.email)} value={fields.email} onChange={e => set('email', e.target.value)}/>{fieldError('email')}</label>
            </div>
            <div className="form-two">
                <label>Password<PasswordInput maxLength={200} autoComplete="new-password" placeholder="At least 12 characters" aria-invalid={Boolean(checked && problems.password)} value={fields.password} onChange={e => set('password', e.target.value)}/>{fieldError('password')}</label>
                <Select label="Role" value={fields.role} options={roleOptions} onChange={role => set('role', role as NewMember['role'])}/>
            </div>
            <small className="field-hint">Share the password with them privately. They can sign in with this email and password right away.</small>
            <button disabled={busy} className="button" type="submit"><span>{busy ? 'Adding…' : 'Add team member'}</span><Icon name="arrowUp" size={18}/></button>
        </form>
        <SearchField className="list-search" ariaLabel="Search team" placeholder="Search by name or email" value={search} onChange={value => { setSearch(value); setPage(1); }}/>{remote.loading && <p>Loading team…</p>}<div className="admin-list">{rows.slice((page - 1) * 10, page * 10).map(m => <article className="admin-row" key={m._id}><div className="row-main"><strong>{m.name || m.email}</strong><span>{m.email} · {(m.role && roleLabels[m.role]) || m.role} · {m.active ? 'Active' : 'Deactivated'}{!m.hasAccount ? ' · Setup pending' : ''}</span></div>{isTeamRole(m.role) && <div className="row-actions"><button type="button" className="small-button" disabled={busy} onClick={() => { setNewName(m.name || ''); setRenaming(m); }}>Edit</button><button type="button" className={'small-button' + (m.active ? ' small-button-danger' : ' small-button-primary')} disabled={busy} onClick={() => setToggling(m)}>{m.active ? 'Deactivate' : 'Reactivate'}</button></div>}</article>)}</div><Pagination page={page} pageSize={10} total={rows.length} noun="team members" onChange={setPage}/>
    {toggling && <ConfirmModal title={(toggling.active ? 'Deactivate ' : 'Reactivate ') + (toggling.name || 'this staff member') + '?'} icon={toggling.active ? 'close' : 'check'}
      tone={toggling.active ? 'danger' : 'primary'} confirmLabel={toggling.active ? 'Deactivate' : 'Reactivate'} onCancel={() => setToggling(null)}
      onConfirm={async () => { await api('/staff/' + encodeURIComponent(toggling.email), jsonOptions('PATCH', { active: !toggling.active })); setToggling(null); remote.refresh(); }}>
      {toggling.active ? <><strong>{toggling.email}</strong> will no longer be able to sign in or be assigned jobs.</> : <><strong>{toggling.email}</strong> will be able to sign in and take jobs again.</>}
    </ConfirmModal>}
    {renaming && <ConfirmModal title="Edit staff name" icon="edit" tone="primary" confirmLabel="Save name" confirmDisabled={Boolean(nameProblem(newName)) || newName.trim() === renaming.name}
      onCancel={() => setRenaming(null)} onConfirm={async () => { await api('/staff/' + encodeURIComponent(renaming.email), jsonOptions('PATCH', { name: newName.trim() })); setRenaming(null); remote.refresh(); }}
      body={<label className="modal-field"><span className="field-label">Name</span><input maxLength={80} value={newName} onChange={e => setNewName(e.target.value)}/>{newName.trim() && nameProblem(newName) && <small className="field-error">{nameProblem(newName)}</small>}</label>}>
      The name shown for <strong>{renaming.email}</strong> across the dashboard.
    </ConfirmModal>}</>;
}
