import { useState } from 'react';
import type { Product } from '../types';
import { defaultQty, formatINR, lineTotalPaise, qtyLabel, qtyOptions, unitSuffix } from '../lib/pricing';

interface Props {
  p: Product;
  inOrder?: number;
  onAdd: (p: Product, qty: number) => void;
  onOrderNow: (p: Product, qty: number) => void;
}

export default function ProductCard({ p, inOrder, onAdd, onOrderNow }: Props) {
  const options = qtyOptions(p.unit);
  const [qty, setQty] = useState(defaultQty(p.unit));
  const [imgFailed, setImgFailed] = useState(false);
  const safeQty = options.some((o) => o.value === qty) ? qty : defaultQty(p.unit);
  const total = lineTotalPaise(p.price, p.unit, safeQty);
  const id = `qty-${p.id}`;

  return (
    <article className={`flex flex-col overflow-hidden rounded-3xl bg-white shadow-card transition hover:shadow-lift ${p.in_stock ? '' : 'opacity-90'}`}>
      <div className="relative aspect-[4/3] bg-leaf-100">
        {p.image_url && !imgFailed ? (
          <img
            src={p.image_url}
            alt={p.name}
            loading="lazy"
            onError={() => setImgFailed(true)}
            className={`h-full w-full object-cover ${p.in_stock ? '' : 'grayscale'}`}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-leaf-100 to-leaf-200 text-6xl" aria-hidden="true">🥬</div>
        )}
        <span
          className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-semibold ${
            p.in_stock ? 'bg-white/95 text-leaf-700' : 'bg-red-600 text-white'
          }`}
        >
          {p.in_stock ? 'In stock' : 'Out of stock'}
        </span>
        {inOrder ? (
          <span className="absolute right-3 top-3 rounded-full bg-leaf-700 px-3 py-1 text-xs font-semibold text-white">
            In order: {qtyLabel(p.unit, inOrder)}
          </span>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="font-display text-xl font-bold leading-tight">{p.name}</h3>
          <p className="mt-0.5 text-lg font-semibold text-leaf-700">
            {formatINR(Math.round(p.price * 100))}
            <span className="text-base font-medium text-stone-500">{unitSuffix(p.unit)}</span>
          </p>
        </div>

        <div>
          <label htmlFor={id} className="mb-1 block text-sm font-medium text-stone-600">Quantity</label>
          <select id={id} className="field" value={safeQty} disabled={!p.in_stock} onChange={(e) => setQty(Number(e.target.value))}>
            {options.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <p className="mt-2 text-sm text-stone-600">
            {qtyLabel(p.unit, safeQty)} = <strong className="text-base text-ink">{formatINR(total)}</strong>
          </p>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <button type="button" className="btn-primary w-full" disabled={!p.in_stock} aria-label={`Order ${p.name} now`} onClick={() => onOrderNow(p, safeQty)}>
            Order Now
          </button>
          <button type="button" className="btn-soft w-full" disabled={!p.in_stock} aria-label={`Add ${p.name} to my order`} onClick={() => onAdd(p, safeQty)}>
            {inOrder ? 'Update in order' : 'Add to order'}
          </button>
        </div>
      </div>
    </article>
  );
}
