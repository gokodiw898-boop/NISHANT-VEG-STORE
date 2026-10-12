import { useEffect, useState } from 'react';
import { BUCKET, friendlyError, supabase } from '../lib/supabase';
import { UNITS } from '../lib/pricing';
import { resizeToJpeg } from '../lib/image';
import type { Product, Unit } from '../types';
import type { NotifyFn } from '../lib/toast';

interface Props {
  initial?: Product;
  submitLabel: string;
  notify: NotifyFn;
  onSaved: () => void;
  onCancel?: () => void;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

export default function ProductForm({ initial, submitLabel, notify, onSaved, onCancel }: Props) {
  const [name, setName] = useState(initial?.name ?? '');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? 'kg');
  const [inStock, setInStock] = useState(initial?.in_stock ?? true);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.image_url ?? null);
  const [busy, setBusy] = useState<'' | 'uploading' | 'saving'>('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => () => { if (preview?.startsWith('blob:')) URL.revokeObjectURL(preview); }, [preview]);

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!ALLOWED.includes(f.type)) { setErrors((x) => ({ ...x, image: 'Use a JPG, PNG or WebP photo.' })); return; }
    if (f.size > 15 * 1024 * 1024) { setErrors((x) => ({ ...x, image: 'Photo is too large (max 15 MB).' })); return; }
    setErrors((x) => ({ ...x, image: '' }));
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const errs: Record<string, string> = {};
    const trimmed = name.trim();
    const priceNum = Number(price);
    if (trimmed.length < 1 || trimmed.length > 60) errs.name = 'Enter a name (1 to 60 characters).';
    if (!price || !Number.isFinite(priceNum) || priceNum <= 0 || priceNum > 100000) errs.price = 'Enter a price above 0.';
    if (!UNITS.some((u) => u.value === unit)) errs.unit = 'Choose a pricing unit.';
    setErrors(errs);
    if (Object.keys(errs).length) return;

    let newPath: string | null = null;
    let saved = false;
    try {
      let newUrl: string | null = null;
      if (file) {
        setBusy('uploading');
        const blob = await resizeToJpeg(file);
        newPath = `products/${crypto.randomUUID()}.jpg`;
        const { error } = await supabase.storage.from(BUCKET).upload(newPath, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
        if (error) throw error;
        newUrl = supabase.storage.from(BUCKET).getPublicUrl(newPath).data.publicUrl;
      }
      setBusy('saving');
      const payload = {
        name: trimmed,
        price: Math.round(priceNum * 100) / 100,
        unit,
        in_stock: inStock,
        ...(newPath ? { image_url: newUrl, image_path: newPath } : {}),
      };
      const q = initial
        ? supabase.from('products').update(payload).eq('id', initial.id).select()
        : supabase.from('products').insert(payload).select();
      const { data, error } = await q;
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Not allowed, or this vegetable no longer exists.');
      saved = true;
      if (initial?.image_path && newPath) {
        try { await supabase.storage.from(BUCKET).remove([initial.image_path]); } catch { /* old image cleanup is best effort */ }
      }
      notify('success', initial ? 'Changes saved' : 'Vegetable added');
      if (!initial) { setName(''); setPrice(''); setUnit('kg'); setInStock(true); setFile(null); setPreview(null); }
      onSaved();
    } catch (err) {
      if (newPath && !saved) { try { await supabase.storage.from(BUCKET).remove([newPath]); } catch { /* ignore */ } }
      notify('error', friendlyError(err));
    } finally {
      setBusy('');
    }
  }

  const idp = initial ? `e-${initial.id}` : 'new';
  return (
    <form onSubmit={submit} className="space-y-4" noValidate>
      <div>
        <label htmlFor={`${idp}-name`} className="mb-1 block text-sm font-medium">Vegetable name</label>
        <input id={`${idp}-name`} className="field" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} aria-invalid={!!errors.name} />
        {errors.name && <p role="alert" className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor={`${idp}-price`} className="mb-1 block text-sm font-medium">Price (₹)</label>
          <input id={`${idp}-price`} className="field" type="number" inputMode="decimal" min="0.01" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} aria-invalid={!!errors.price} />
          {errors.price && <p role="alert" className="mt-1 text-sm text-red-600">{errors.price}</p>}
        </div>
        <div>
          <label htmlFor={`${idp}-unit`} className="mb-1 block text-sm font-medium">Pricing unit</label>
          <select id={`${idp}-unit`} className="field" value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
            {UNITS.map((u) => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label htmlFor={`${idp}-photo`} className="mb-1 block text-sm font-medium">Photo</label>
        {preview && <img src={preview} alt="Selected vegetable" className="mb-2 h-36 w-full rounded-2xl object-cover" />}
        <input id={`${idp}-photo`} type="file" accept="image/jpeg,image/png,image/webp" className="field py-3" onChange={onFile} />
        {errors.image && <p role="alert" className="mt-1 text-sm text-red-600">{errors.image}</p>}
      </div>
      <label className="flex min-h-[48px] cursor-pointer items-center gap-3">
        <input type="checkbox" className="h-6 w-6 accent-leaf-600" checked={inStock} onChange={(e) => setInStock(e.target.checked)} />
        <span className="font-medium">{inStock ? 'In Stock' : 'Out of Stock'}</span>
      </label>
      {busy && <p role="status" className="text-sm text-leaf-700">{busy === 'uploading' ? 'Uploading photo…' : 'Saving…'}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn-primary flex-1" disabled={!!busy}>{busy ? 'Please wait…' : submitLabel}</button>
        {onCancel && <button type="button" className="btn-soft" onClick={onCancel} disabled={!!busy}>Cancel</button>}
      </div>
    </form>
  );
}
