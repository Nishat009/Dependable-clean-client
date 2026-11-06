import React, { useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { api, jsonOptions } from '../api';
import { useAction } from '../hooks/useAction';
import Notice from '../components/Notice';
import { passwordProblem } from '../validators';

export default function SetupPage() {
    const router = useRouter();
    const [password, setPassword] = useState(''), [done, setDone] = useState(false);
    const { error, busy, run } = useAction(() => setDone(true));
    return <main className="public-page wrap"><h1>Set up your staff account</h1><Notice type="error" message={error}/>{done ? <p>Password set. <a href="/login">Sign in</a> to open your dashboard.</p> : <form className="form-card stack-form" onSubmit={(e: FormEvent) => { e.preventDefault(); run(async () => { const problem = passwordProblem(password, true); if (problem) throw new Error(problem); await api('/setupAccount', jsonOptions('POST', { token: router.query.token, password })); }); }}><label>Your password<input type="password" required minLength={12} maxLength={200} autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)}/></label><button disabled={busy} className="button">Set password</button></form>}</main>;
}
