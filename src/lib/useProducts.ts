import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';
import type { Product } from '../types';

/** Loads products and keeps them fresh: Realtime pushes, plus refetch on reconnect, tab focus and a slow timer. */
export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('products').select('*').order('name');
    if (error) setError('Could not load vegetables. Check your internet connection and try again.');
    else { setProducts((data ?? []) as Product[]); setError(null); }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
    const channel = supabase
      .channel('products-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => load())
      .subscribe((status) => {
        if (status === 'SUBSCRIBED' || status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') load();
      });
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    window.addEventListener('online', load);
    document.addEventListener('visibilitychange', onVisible);
    const timer = setInterval(load, 60_000);
    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener('online', load);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(timer);
    };
  }, [load]);

  return { products, loading, error, reload: load };
}
