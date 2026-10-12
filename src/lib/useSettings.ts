import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

// Fallback used until the database value loads (or if it can't be reached).
export const DEFAULT_NUMBER = ((import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined) || '916350580036').replace(/\D/g, '');

/** WhatsApp order number from the database. Changing it in the admin panel updates every phone. */
export function useWhatsAppNumber() {
  const [number, setNumber] = useState(DEFAULT_NUMBER);

  const load = useCallback(async () => {
    const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_number').maybeSingle();
    if (data?.value && /^91\d{10}$/.test(data.value)) setNumber(data.value);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('settings-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settings' }, () => load())
      .subscribe();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('online', load);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', load);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  return { number, reload: load };
}
