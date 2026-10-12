import { useEffect, useState } from 'react';
import { supabase, friendlyError } from '../lib/supabase';
import { useWhatsAppNumber } from '../lib/useSettings';
import type { NotifyFn } from '../lib/toast';

export default function SettingsCard({ notify }: { notify: NotifyFn }) {
  const { number, reload } = useWhatsAppNumber();
  const [value, setValue] = useState('');
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (!touched) setValue(number.slice(2)); }, [number, touched]);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    let digits = value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
    if (!/^[6-9]\d{9}$/.test(digits)) { notify('error', 'Enter a valid 10-digit mobile number.'); return; }
    setBusy(true);
    const { data, error } = await supabase.from('settings').upsert({ key: 'whatsapp_number', value: `91${digits}` }).select();
    setBusy(false);
    if (error || !data?.length) { notify('error', error ? friendlyError(error) : 'Not allowed to change this setting.'); return; }
    setTouched(false);
    notify('success', 'WhatsApp order number saved');
    reload();
  }

  return (
    <section className="rounded-3xl bg-white p-4 shadow-card">
      <h2 className="font-display text-lg font-bold">WhatsApp order number</h2>
      <p className="mt-1 text-sm text-stone-600">Customer orders open a chat with this number. Make sure it is active on WhatsApp.</p>
      <form onSubmit={save} className="mt-3 space-y-3" noValidate>
        <div>
          <label htmlFor="wa-number" className="mb-1 block text-sm font-medium">Mobile number (10 digits)</label>
          <div className="flex items-center gap-2">
            <span className="rounded-2xl bg-leaf-100 px-3 py-3 font-semibold text-leaf-800">+91</span>
            <input id="wa-number" className="field" type="tel" inputMode="numeric" maxLength={14} value={value} onChange={(e) => { setTouched(true); setValue(e.target.value); }} />
          </div>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Saving…' : 'Save number'}</button>
      </form>
    </section>
  );
}
