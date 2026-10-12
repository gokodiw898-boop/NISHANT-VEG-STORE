import { useEffect, useState } from 'react';
import { BUCKET, friendlyError, supabase } from '../lib/supabase';
import { useProducts } from '../lib/useProducts';
import { formatINR, unitSuffix } from '../lib/pricing';
import type { Product } from '../types';
import type { NotifyFn } from '../lib/toast';
import ProductForm from './ProductForm';
import ConfirmDialog from './ConfirmDialog';
import SettingsCard from './SettingsCard';

export default function Dashboard({ onExit, notify }: { onExit: () => void; notify: NotifyFn }) {
  const { products, loading, error, reload } = useProducts();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    supabase.rpc('is_admin').then(({ data, error }) => setIsAdmin(!error && data === true));
  }, []);

  const mark = (id: string, on: boolean) => setBusyIds((s) => { const n = new Set(s); on ? n.add(id) : n.delete(id); return n; });

  async function logout() {
    await supabase.auth.signOut();
    onExit();
  }

  async function toggleStock(p: Product) {
    if (busyIds.has(p.id)) return;
    mark(p.id, true);
    const { data, error } = await supabase.from('products').update({ in_stock: !p.in_stock }).eq('id', p.id).select();
    mark(p.id, false);
    if (error || !data?.length) { notify('error', error ? friendlyError(error) : 'Not allowed to change stock.'); return; }
    notify('success', `${p.name} is now ${p.in_stock ? 'out of stock' : 'in stock'}`);
    reload();
  }

  async function confirmDelete() {
    if (!toDelete || deleting) return;
    setDeleting(true);
    const p = toDelete;
    const { data, error } = await supabase.from('products').delete().eq('id', p.id).select();
    if (error || !data?.length) {
      notify('error', error ? friendlyError(error) : 'Not allowed, or already deleted.');
    } else {
      if (p.image_path) { try { await supabase.storage.from(BUCKET).remove([p.image_path]); } catch { /* best effort */ } }
      notify('success', `${p.name} deleted`);
      reload();
    }
    setDeleting(false);
    setToDelete(null);
  }

  if (isAdmin === null) return <p className="p-6">Checking access…</p>;
  if (!isAdmin) {
    return (
      <main className="mx-auto max-w-sm p-6">
        <h1 className="font-display text-xl font-bold">No admin access</h1>
        <p className="mt-2 text-stone-600">This account is not allowed to manage products.</p>
        <button type="button" className="btn-primary mt-4 w-full" onClick={logout}>Logout</button>
      </main>
    );
  }

  const inStock = products.filter((p) => p.in_stock).length;

  return (
    <div className="min-h-screen bg-cream-100 pb-16">
      <header className="sticky top-0 z-30 bg-leaf-800 px-4 py-3 text-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <h1 className="font-display text-base font-bold leading-tight sm:text-xl">NISHANT VEG STORE — Admin Panel</h1>
          <button type="button" className="btn min-h-[44px] bg-white/15 px-4 text-sm text-white hover:bg-white/25" onClick={logout}>Logout</button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-5">
        <section className="grid grid-cols-3 gap-3" aria-label="Overview">
          {[['Total vegetables', products.length], ['In stock', inStock], ['Out of stock', products.length - inStock]].map(([label, n]) => (
            <div key={label as string} className="rounded-2xl bg-white p-3 text-center shadow-card">
              <p className="font-display text-3xl font-extrabold text-leaf-700">{n}</p>
              <p className="text-xs text-stone-600">{label}</p>
            </div>
          ))}
        </section>

        <SettingsCard notify={notify} />

        <section className="rounded-3xl bg-white p-4 shadow-card">
          {showAdd ? (
            <>
              <h2 className="mb-3 font-display text-lg font-bold">Add vegetable</h2>
              <ProductForm submitLabel="Add Vegetable" notify={notify} onSaved={() => { reload(); setShowAdd(false); }} onCancel={() => setShowAdd(false)} />
            </>
          ) : (
            <button type="button" className="btn-primary w-full" onClick={() => setShowAdd(true)}>+ Add new vegetable</button>
          )}
        </section>

        {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-red-800">{error} <button type="button" className="underline" onClick={reload}>Retry</button></p>}
        {loading && <p>Loading vegetables…</p>}
        {!loading && products.length === 0 && !error && <p className="rounded-2xl bg-white p-6 text-center text-stone-600">No vegetables yet. Add your first one above.</p>}

        <ul className="space-y-3">
          {products.map((p) => (
            <li key={p.id} className="rounded-3xl bg-white p-4 shadow-card">
              {editing === p.id ? (
                <ProductForm initial={p} submitLabel="Save Changes" notify={notify} onSaved={() => { reload(); setEditing(null); }} onCancel={() => setEditing(null)} />
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-16 w-16 rounded-2xl object-cover" /> : <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-leaf-100 text-3xl" aria-hidden="true">🥬</div>}
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-display text-lg font-bold">{p.name}</p>
                      <p className="text-leaf-700">{formatINR(Math.round(p.price * 100))}<span className="text-stone-500">{unitSuffix(p.unit)}</span></p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={p.in_stock}
                      aria-label={`${p.name}: ${p.in_stock ? 'In Stock' : 'Out of Stock'}. Tap to change`}
                      disabled={busyIds.has(p.id)}
                      onClick={() => toggleStock(p)}
                      className={`min-h-[48px] rounded-2xl px-3 text-sm font-semibold ${p.in_stock ? 'bg-leaf-100 text-leaf-800' : 'bg-red-100 text-red-700'} disabled:opacity-50`}
                    >
                      {busyIds.has(p.id) ? '…' : p.in_stock ? 'In Stock' : 'Out of Stock'}
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" className="btn-soft flex-1" onClick={() => setEditing(p.id)}>Edit</button>
                    <button type="button" className="btn flex-1 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => setToDelete(p)}>Delete</button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </main>

      {toDelete && (
        <ConfirmDialog
          title="Are you sure you want to delete this vegetable?"
          message={`${toDelete.name} will be removed from the store.`}
          confirmLabel="Delete"
          danger
          busy={deleting}
          onConfirm={confirmDelete}
          onCancel={() => !deleting && setToDelete(null)}
        />
      )}
    </div>
  );
}
