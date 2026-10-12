import { useMemo, useState } from 'react';
import { useProducts } from '../lib/useProducts';
import { useWhatsAppNumber } from '../lib/useSettings';
import type { OrderLine, Product } from '../types';
import { formatINR, toLine } from '../lib/pricing';
import { openWhatsApp } from '../lib/whatsapp';
import type { NotifyFn } from '../lib/toast';
import ProductCard from './ProductCard';
import ConfirmDialog from './ConfirmDialog';

export default function Storefront({ onAdmin, notify }: { onAdmin: () => void; notify: NotifyFn }) {
  const { products, loading, error, reload } = useProducts();
  const { number: whatsappNumber } = useWhatsAppNumber();
  const [query, setQuery] = useState('');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [showSummary, setShowSummary] = useState(false);
  const [pending, setPending] = useState<OrderLine[] | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !q || p.name.toLowerCase().includes(q))
      .sort((a, b) => Number(b.in_stock) - Number(a.in_stock) || a.name.localeCompare(b.name));
  }, [products, query]);

  // Built from live product data, so price changes and out-of-stock items are always respected.
  const lines = useMemo(
    () => Object.entries(cart).flatMap(([id, qty]) => {
      const p = products.find((x) => x.id === id);
      return p && p.in_stock && qty > 0 ? [toLine(p, qty)] : [];
    }),
    [cart, products],
  );
  const total = lines.reduce((s, l) => s + l.totalPaise, 0);

  const addToOrder = (p: Product, qty: number) => {
    if (!p.in_stock || !(qty > 0)) return;
    setCart((c) => ({ ...c, [p.id]: qty }));
    notify('success', `${p.name} added to your order`);
  };
  const removeLine = (id: string) => setCart((c) => { const n = { ...c }; delete n[id]; return n; });

  const confirmAndOpen = () => {
    const l = pending;
    setPending(null);
    if (l) { setShowSummary(false); openWhatsApp(l, whatsappNumber); }
  };

  return (
    <div className="min-h-screen pb-28">
      <header className="sticky top-0 z-30 border-b border-cream-200 bg-cream-50/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-leaf-600 text-2xl" aria-hidden="true">🥬</div>
            <div>
              <h1 className="font-display text-lg font-extrabold leading-none tracking-tight text-leaf-800 sm:text-xl">NISHANT VEG STORE</h1>
              <p className="mt-1 text-sm text-stone-600">Fresh Vegetables, Everyday</p>
            </div>
          </div>
          <div className="text-right text-sm">
            <p className="font-semibold text-leaf-800">Khajuwala</p>
            <p className="flex items-center justify-end gap-1.5 text-stone-600">
              <span className="h-2.5 w-2.5 rounded-full bg-leaf-500" aria-hidden="true" /> Fresh today
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4">
        <section className="py-8 sm:py-12">
          <h2 className="font-display text-3xl font-extrabold tracking-tight text-leaf-900 sm:text-5xl">Fresh Vegetables at Your Doorstep</h2>
          <p className="mt-3 text-lg text-stone-700">Your local vegetable store in Khajuwala.</p>
          <p className="mt-1 text-stone-500">ताज़ी सब्ज़ियाँ, सीधे आपके घर तक।</p>
          <p className="mt-4 inline-block rounded-2xl bg-leaf-100 px-4 py-2 text-sm font-medium text-leaf-800">
            Service available in Khajuwala town only.
          </p>
          <div className="mt-6 max-w-md">
            <label htmlFor="search" className="sr-only">Search vegetables</label>
            <input id="search" type="search" className="field" placeholder="Search vegetables (e.g. tomato)" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </section>

        {error && (
          <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-red-50 p-4 text-red-800">
            <span>{error}</span>
            <button type="button" className="btn bg-red-600 text-white" onClick={reload}>Try again</button>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-busy="true">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse overflow-hidden rounded-3xl bg-white shadow-card">
                <div className="aspect-[4/3] bg-leaf-100" />
                <div className="space-y-3 p-4"><div className="h-5 w-2/3 rounded bg-leaf-100" /><div className="h-4 w-1/3 rounded bg-leaf-100" /><div className="h-12 rounded-2xl bg-leaf-100" /></div>
              </div>
            ))}
          </div>
        ) : visible.length === 0 && !error ? (
          <div className="rounded-3xl bg-white p-10 text-center shadow-card">
            <p className="text-5xl" aria-hidden="true">🥕</p>
            <p className="mt-3 font-display text-xl font-bold">{query ? 'No vegetables match your search' : 'No vegetables available right now'}</p>
            <p className="mt-1 text-stone-600">{query ? 'Try a different name.' : 'Please check again soon. Fresh stock is added every day.'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((p) => (
              <ProductCard key={p.id} p={p} inOrder={cart[p.id]} onAdd={addToOrder} onOrderNow={(pr, q) => setPending([toLine(pr, q)])} />
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-sm text-stone-500">Orders are confirmed by the store through WhatsApp. Service available in Khajuwala town only.</p>
      </main>

      <footer className="mt-10 bg-leaf-900 px-4 py-8 text-leaf-100">
        <div className="mx-auto max-w-6xl">
          <p className="font-display text-lg font-bold text-white">NISHANT VEG STORE</p>
          <p className="mt-1">Fresh vegetables for Khajuwala town, Rajasthan.</p>
          <p className="mt-1 text-leaf-200">Place your order by sending a WhatsApp message to the store. We confirm availability and delivery with you there.</p>
          <div className="mt-6 text-center">
            <button type="button" onClick={onAdmin} className="px-3 py-2 text-[10px] text-leaf-300/60 hover:text-leaf-200">Admin</button>
          </div>
        </div>
      </footer>

      {lines.length > 0 && !showSummary && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-cream-200 bg-white/95 p-3 backdrop-blur">
          <div className="mx-auto max-w-6xl">
            <button type="button" className="btn-primary w-full" onClick={() => setShowSummary(true)}>
              Review order ({lines.length} {lines.length === 1 ? 'item' : 'items'}) · {formatINR(total)}
            </button>
          </div>
        </div>
      )}

      {showSummary && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/40 sm:items-center" onClick={() => setShowSummary(false)}>
          <div role="dialog" aria-modal="true" aria-labelledby="summary-title" className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-5 shadow-lift sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h2 id="summary-title" className="font-display text-xl font-bold">Your order</h2>
              <button type="button" className="min-h-[44px] px-2 text-stone-500" onClick={() => setShowSummary(false)} aria-label="Close order summary">Close</button>
            </div>
            {lines.length === 0 ? (
              <p className="py-6 text-stone-600">Your order is empty.</p>
            ) : (
              <>
                <ul className="mt-3 divide-y divide-cream-200">
                  {lines.map((l) => (
                    <li key={l.id} className="flex items-center justify-between gap-3 py-3">
                      <div><p className="font-semibold">{l.name}</p><p className="text-sm text-stone-600">{l.qtyLabel}</p></div>
                      <div className="flex items-center gap-3">
                        <span className="font-semibold">{formatINR(l.totalPaise)}</span>
                        <button type="button" className="min-h-[44px] px-2 text-sm text-red-600" onClick={() => removeLine(l.id)} aria-label={`Remove ${l.name}`}>Remove</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 flex justify-between border-t border-cream-200 pt-3 text-lg font-bold"><span>Total</span><span>{formatINR(total)}</span></p>
                <p className="mt-2 text-sm text-stone-500">Final price and delivery are confirmed by the store on WhatsApp.</p>
                <button type="button" className="btn-primary mt-4 w-full" onClick={() => setPending(lines)}>Send order on WhatsApp</button>
              </>
            )}
          </div>
        </div>
      )}

      {pending && (
        <ConfirmDialog
          title="Delivery service is available in Khajuwala town only. Are you ordering from Khajuwala?"
          message="WhatsApp will open with your order typed in. You must press Send there to place it."
          confirmLabel="Yes, Continue"
          cancelLabel="Cancel"
          onConfirm={confirmAndOpen}
          onCancel={() => setPending(null)}
        />
      )}
    </div>
  );
}
