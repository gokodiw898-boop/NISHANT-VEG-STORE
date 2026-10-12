import { useState } from 'react';
import { configured } from './lib/supabase';
import { useToasts } from './lib/toast';
import Storefront from './components/Storefront';
import Admin from './components/Admin';
import Toasts from './components/Toasts';

export default function App() {
  const [view, setView] = useState<'store' | 'admin'>('store');
  const { toasts, notify } = useToasts();

  if (!configured) {
    return (
      <main className="mx-auto max-w-md p-6">
        <h1 className="font-display text-2xl font-bold">Setup needed</h1>
        <p className="mt-3">
          Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to your <code>.env</code> file (or your hosting
          environment variables), then restart. See README.md.
        </p>
      </main>
    );
  }

  return (
    <>
      {view === 'admin' ? (
        <Admin onExit={() => setView('store')} notify={notify} />
      ) : (
        <Storefront onAdmin={() => setView('admin')} notify={notify} />
      )}
      <Toasts toasts={toasts} />
    </>
  );
}
