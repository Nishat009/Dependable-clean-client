import React, { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/router';
import { errorMessage } from '../api';
import { useAuth } from '../Auth';
import Icon from '../components/Icon';
import Notice from '../components/Notice';
import PasswordInput from '../components/PasswordInput';
import type { Role } from '../types';

const demos: { role: Role; label: string }[] = [
  { role: 'customer', label: 'customer' },
  { role: 'staff', label: 'staff' },
  { role: 'admin', label: 'super admin' },
];

type Mode = 'signin' | 'signup';
type Busy = '' | 'form' | Role;

export default function LoginPage() {
  const router = useRouter();
  const { user, signIn, signUp, signInDemo } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState<Busy>('');
  const [error, setError] = useState('');
  const destination = typeof router.query.from === 'string' && router.query.from.startsWith('/') ? router.query.from : '/dashboard';
  const signingUp = mode === 'signup';

  useEffect(() => { if (router.query.mode === 'signup') setMode('signup'); }, [router.query.mode]);
  useEffect(() => { if (user) router.replace(destination); }, [user, destination, router]);

  async function run(action: () => Promise<unknown>, key: Busy) {
    setBusy(key); setError('');
    try { await action(); } catch (cause) { setError(errorMessage(cause)); setBusy(''); }
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    run(() => signingUp ? signUp({ name, email, password }) : signIn({ email, password }), 'form');
  }
  function switchMode(next: Mode) { setMode(next); setError(''); }

  return <main className="auth-page">
    <div className="auth-art"><div className="auth-art-content">
      <span className="eyebrow"><span className="eyebrow-dot" /> YOUR FRESH START</span>
      <h1>Good things happen in <em>clean spaces.</em></h1>
      <p>Step into a simpler way to care for your space.</p>
      <div className="auth-orbit"><Icon name="sparkle" size={75} /></div>
    </div></div>
    <div className="auth-form-side"><div className="auth-card">
      <span className="eyebrow"><span className="eyebrow-dot" /> {signingUp ? 'NEW HERE' : 'WELCOME BACK'}</span>
      <h2>{signingUp ? <>Create your<br /><em>account.</em></> : <>Make yourself<br /><em>at home.</em></>}</h2>
      <p>{signingUp ? 'Join in a few seconds to book a service and keep track of your fresh starts.' : 'Sign in to book a service and keep track of your fresh starts.'}</p>
      <div className="auth-tabs" role="tablist" aria-label="Sign in or create an account">
        <button type="button" role="tab" aria-selected={!signingUp} className={signingUp ? '' : 'active'} onClick={() => switchMode('signin')}>Sign in</button>
        <button type="button" role="tab" aria-selected={signingUp} className={signingUp ? 'active' : ''} onClick={() => switchMode('signup')}>Create account</button>
      </div>
      <Notice message={error} type="error" onClose={() => setError('')} />
      <form onSubmit={submit} className="stack-form auth-form">
        {signingUp && <label>Your name<input required autoComplete="name" placeholder="Jamie Rivera" value={name} onChange={(event) => setName(event.target.value)} /></label>}
        <label>Email address<input required type="email" autoComplete="email" placeholder="you@example.com" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label>Password<PasswordInput required minLength={6} autoComplete={signingUp ? 'new-password' : 'current-password'} placeholder={signingUp ? 'At least 6 characters' : 'Your password'} value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <button className="button auth-primary" type="submit" disabled={Boolean(busy)}>
          <span>{busy === 'form' ? (signingUp ? 'Creating your account…' : 'Signing you in…') : (signingUp ? 'Create account' : 'Sign in')}</span><Icon name="arrowUp" size={19} />
        </button>
      </form>
      <p className="auth-switch">{signingUp ? 'Already have an account? ' : 'New to Dependable Clean? '}<button type="button" onClick={() => switchMode(signingUp ? 'signin' : 'signup')}>{signingUp ? 'Sign in' : 'Create an account'}</button></p>
      <div className="demo-login">
        <span>TRY A DEMO ACCOUNT</span>
        {demos.map((demo) => <button key={demo.role} type="button" disabled={Boolean(busy)} onClick={() => run(() => signInDemo(demo.role), demo.role)}>
          {busy === demo.role ? `Opening the ${demo.label} demo…` : 'Demo ' + demo.label} <Icon name="arrow" size={17} />
        </button>)}
      </div>
      <small>By continuing, you can manage your bookings from one beautiful place.</small>
    </div></div>
  </main>;
}
