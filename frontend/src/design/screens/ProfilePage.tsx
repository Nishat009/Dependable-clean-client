import React, { useEffect, useState } from 'react';
import { api, jsonOptions } from '../api';
import { useAuth } from '../Auth';
import { useAction } from '../hooks/useAction';
import { useRemote } from '../hooks/useRemote';
import PageHeading from '../components/PageHeading';
import Notice from '../components/Notice';
import { nameProblem } from '../validators';

export default function ProfilePage() {
    const { user } = useAuth();
    const [name, setName] = useState(user?.name || ''), [phone, setPhone] = useState(''), [saved, setSaved] = useState(false);
    const profile = useRemote<{
        name: string;
        phone: string;
    }>('/profile', { name: user?.name || '', phone: '' });
    useEffect(() => { setName(profile.data.name); setPhone(profile.data.phone); }, [profile.data]);
    const { error, busy, run } = useAction(() => setSaved(true));
    return <><PageHeading title={<>Your profile</>}/><Notice type="error" message={error}/>{saved && <p>Profile saved. Your updated name appears after signing in again.</p>}<form className="form-card stack-form" onSubmit={e => { e.preventDefault(); run(async () => { const problem = nameProblem(name, true); if (problem) throw new Error(problem); await api('/profile', jsonOptions('PATCH', { name: name.trim(), phone })); }); }}><p>{user?.email}</p><label>Name<input required value={name} onChange={e => setName(e.target.value)}/></label><label>Phone<input value={phone} onChange={e => setPhone(e.target.value)}/></label><button className="button" disabled={busy}>Save profile</button></form></>;
}
