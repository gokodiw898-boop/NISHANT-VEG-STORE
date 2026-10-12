import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ADMIN_EMAIL, supabase } from '../lib/supabase';
import type { NotifyFn } from '../lib/toast';
import Dashboard from './Dashboard';

interface Props { onExit: () => void; notify: NotifyFn }

export default function Admin({ onExit, notify }: Props) {
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  if (session === undefined) return <p className="p-6">Loading…</p>;
  if (!session) return <Login onExit={onExit} />;
  return <Dashboard onExit={onExit} notify={notify} />;
}

function Login({ onExit }: { onExit: () => void }) {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fails, setFails] = useState(0);
  const [lockedUntil, setLockedUntil] = useState(0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (Date.now() < lockedUntil) { setError('Too many attempts. Please wait a little and try again.'); return; }
    if (!password) { setError('Enter the admin password.'); return; }
    setBusy(true); setError('');
    // The password is checked by Supabase Auth on the server. It is never compared in this code.
    const { error: err } = await supabase.auth.signInWithPassword({ email: ADMIN_EMAIL, password });
    setBusy(false);
    if (err) {
      const n = fails + 1;
      setFails(n);
      if (n >= 5) { setLockedUntil(Date.now() + 30_000); setFails(0); }
      setError(/failed to fetch|network/i.test(err.message) ? 'No internet connection. Try again.' : 'Incorrect password.');
      setPassword('');
    }
    // On success onAuthStateChange swaps in the dashboard.
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center p-6">
      <h1 className="font-display text-2xl font-extrabold text-leaf-800">NISHANT VEG STORE</h1>
      <p className="mt-1 text-stone-600">Admin login</p>
      <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
        <div>
          <label htmlFor="pw" className="mb-1 block text-sm font-medium">Password</label>
          <input id="pw" type="password" autoComplete="current-password" className="field" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error} />
        </div>
        {error && <p role="alert" className="text-sm font-medium text-red-600">{error}</p>}
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Logging in…' : 'Login'}</button>
        <button type="button" className="btn-soft w-full" onClick={onExit}>Back to store</button>
      </form>
    </main>
  );
}
